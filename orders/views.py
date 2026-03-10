import stripe
from django.conf import settings
from django.db import models
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from products.models import Product
from shoppingCart.models import Cart
from .models import Order, OrderItem
from .serializers import OrderSerializer

stripe.api_key = settings.STRIPE_SECRET_KEY


class CheckoutView(APIView):
    """
    POST /api/orders/checkout/

    Converts the authenticated user's cart into a pending Order.
    Pre-populates the shipping address from their UserProfile.
    Returns the order details including the Stripe client_secret
    for the frontend to confirm payment.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        # Load cart items
        cart_items = Cart.objects.filter(user=user).select_related('product')
        if not cart_items.exists():
            return Response(
                {'detail': 'Your cart is empty.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check all items are still in stock
        for item in cart_items:
            if item.product.stock < item.quantity:
                return Response(
                    {'detail': f'"{item.product.name}" only has {item.product.stock} item(s) in stock.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Address from user profile
        try:
            profile = user.profile
            shipping_fields = {
                'shipping_address': profile.shipping_address,
                'shipping_city': profile.shipping_city,
                'shipping_province': profile.shipping_province,
                'shipping_postal': profile.shipping_postal,
                'shipping_country': profile.shipping_country,
            }
        except user.__class__.profile.RelatedObjectDoesNotExist:
            shipping_fields = {}  # No profile

        # Create pending order
        order = Order.objects.create(
            user=user,
            email=user.email,
            status=Order.Status.PENDING,
            **shipping_fields,
        )

        # Snapshot cart items into OrderItems
        for item in cart_items:
            unit_price_cents = int(item.product.price * 100)
            OrderItem.objects.create(
                order=order,
                product_id=item.product.pk,
                product_name=item.product.name,
                unit_price_cents=unit_price_cents,
                quantity=item.quantity,
            )

        order.calculate_total()

        # Create Stripe PaymentIntent
        try:
            intent = stripe.PaymentIntent.create(
                amount=order.total_price_cents,
                currency=settings.STRIPE_CURRENCY,
                metadata={'order_id': order.pk},
            )
        except stripe.error.StripeError as e:
            order.delete()
            return Response(
                {'detail': f'Payment error: {e.user_message}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        order.stripe_payment_intent_id = intent.id
        order.stripe_client_secret = intent.client_secret
        order.save(update_fields=['stripe_payment_intent_id', 'stripe_client_secret'])

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderListView(APIView):
    """
    GET /api/orders/
    Returns all orders for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user=request.user).prefetch_related('items')
        return Response(OrderSerializer(orders, many=True).data)


class OrderDetailView(APIView):
    """
    GET /api/orders/<pk>/
    Returns a single order belonging to the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            order = Order.objects.prefetch_related('items').get(pk=pk, user=request.user)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(OrderSerializer(order).data)


@csrf_exempt
@require_POST
def stripe_webhook(request):
    """
    POST /api/orders/webhook/stripe/

    Receives signed events from Stripe. This is the canonical confirmation
    of payment — not the frontend redirect. Handles:
      - payment_intent.succeeded  → mark order PAID, decrement stock, send email
      - payment_intent.payment_failed → mark order FAILED
    """
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return HttpResponse('Invalid payload.', status=400)
    except stripe.error.SignatureVerificationError:
        return HttpResponse('Invalid signature.', status=400)

    if event['type'] == 'payment_intent.succeeded':
        _handle_payment_succeeded(event['data']['object'])
    elif event['type'] == 'payment_intent.payment_failed':
        _handle_payment_failed(event['data']['object'])

    return HttpResponse(status=200)


# ---------------------------------------------------------------------------
# Webhook helpers
# ---------------------------------------------------------------------------

def _handle_payment_succeeded(payment_intent):
    order_id = payment_intent.get('metadata', {}).get('order_id')
    if not order_id:
        return

    try:
        order = Order.objects.prefetch_related('items').get(pk=order_id)
    except Order.DoesNotExist:
        return

    if order.status == Order.Status.PAID:
        return  # Already handled

    order.status = Order.Status.PAID
    order.save(update_fields=['status'])

    # Decrement stock for ordered product
    for item in order.items.all():
        Product.objects.filter(pk=item.product_id).update(
            stock=models.F('stock') - item.quantity
        )

    # Clear user cart
    if order.user:
        Cart.objects.filter(user=order.user).delete()




def _handle_payment_failed(payment_intent):
    order_id = payment_intent.get('metadata', {}).get('order_id')
    if not order_id:
        return

    try:
        order = Order.objects.get(pk=order_id)
        order.status = Order.Status.FAILED
        order.save(update_fields=['status'])
    except Order.DoesNotExist:
        pass