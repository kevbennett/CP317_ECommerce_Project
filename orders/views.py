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
from .models import Order, OrderItem, Return, ReturnItem
from .serializers import OrderSerializer, ReturnSerializer, ReturnItemInputSerializer

try:
    import stripe
except Exception:
    stripe = None

STRIPE_ENABLED = bool(stripe and getattr(settings, "STRIPE_SECRET_KEY", None))
if STRIPE_ENABLED:
    stripe.api_key = settings.STRIPE_SECRET_KEY


def _luhn_checksum(card_number: str) -> bool:
    """Basic Luhn check for mock card validation."""
    digits = [int(ch) for ch in card_number if ch.isdigit()]
    if len(digits) < 12:
        return False
    checksum = 0
    parity = len(digits) % 2
    for idx, digit in enumerate(digits):
        if idx % 2 == parity:
            digit *= 2
            if digit > 9:
                digit -= 9
        checksum += digit
    return checksum % 10 == 0


def _validate_mock_card(payload):
    number = str(payload.get("card_number", "")).replace(" ", "").replace("-", "")
    exp_month = str(payload.get("exp_month", "")).strip()
    exp_year = str(payload.get("exp_year", "")).strip()
    cvc = str(payload.get("cvc", "")).strip()

    if not number or not exp_month or not exp_year or not cvc:
        return "Card number, expiry month/year, and CVC are required."

    if not number.isdigit() or not _luhn_checksum(number):
        return "Invalid card number."

    if not exp_month.isdigit() or not exp_year.isdigit():
        return "Invalid expiry date."

    month = int(exp_month)
    year = int(exp_year)
    if month < 1 or month > 12:
        return "Invalid expiry month."
    if year < 2000 or year > 2100:
        return "Invalid expiry year."

    if not cvc.isdigit() or len(cvc) not in (3, 4):
        return "Invalid CVC."

    return None


def _mock_payment_intent_id(order_id):
    return f"mock_pi_{order_id}"


def _mock_refund_id(order_id, sequence):
    return f"mock_refund_{order_id}_{sequence}"


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

        # Create Stripe PaymentIntent if configured; otherwise mock payment.
        if STRIPE_ENABLED:
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
        else:
            error = _validate_mock_card(request.data or {})
            if error:
                order.delete()
                return Response({'detail': error}, status=status.HTTP_400_BAD_REQUEST)

            order.status = Order.Status.PAID
            order.stripe_payment_intent_id = _mock_payment_intent_id(order.pk)
            order.stripe_client_secret = ""
            order.save(update_fields=['status', 'stripe_payment_intent_id', 'stripe_client_secret'])

            for item in order.items.all():
                Product.objects.filter(pk=item.product_id).update(
                    stock=models.F('stock') - item.quantity
                )
            Cart.objects.filter(user=user).delete()

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


class ReturnView(APIView):
    """
    POST /orders/<order_pk>/return/
    Request a full order return or partial return (specific items).
 
    Full return body:   { "reason": "..." }
    Partial return body: { "reason": "...", "items": [{"order_item_id": 1, "quantity": 1}] }
 
    If no items are provided, all items in the order are returned.
    """
    permission_classes = [IsAuthenticated]
 
    def post(self, request, order_pk):
        # Fetch the order
        try:
            order = Order.objects.prefetch_related('items').get(pk=order_pk, user=request.user)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)
 
        # Only paid orders can be returned
        if order.status not in [Order.Status.PAID, Order.Status.PARTIALLY_RETURNED]:
            return Response(
                {'detail': 'Only paid orders can be returned.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        reason = request.data.get('reason', '')
        items_data = request.data.get('items', [])
 
        # If no items specified, return the full order
        if not items_data:
            items_to_return = [
                {'order_item_id': item.pk, 'quantity': item.quantity}
                for item in order.items.all()
            ]
            is_full_return = True
        else:
            # Validate each item
            serializer = ReturnItemInputSerializer(data=items_data, many=True)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            items_to_return = serializer.validated_data
            is_full_return = False
 
        # Validate quantities against order items
        order_items_map = {item.pk: item for item in order.items.all()}
        return_items = []
        refund_amount_cents = 0
 
        for item_data in items_to_return:
            order_item_id = item_data['order_item_id']
            quantity = item_data['quantity']
 
            order_item = order_items_map.get(order_item_id)
            if not order_item:
                return Response(
                    {'detail': f'Order item {order_item_id} not found in this order.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if quantity > order_item.quantity:
                return Response(
                    {'detail': f'Cannot return more than {order_item.quantity} of {order_item.product_name}.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
 
            return_items.append((order_item, quantity))
            refund_amount_cents += order_item.unit_price_cents * quantity
 
        # Issue Stripe refund if configured; otherwise mock refund.
        if STRIPE_ENABLED:
            try:
                refund = stripe.Refund.create(
                    payment_intent=order.stripe_payment_intent_id,
                    amount=refund_amount_cents,
                )
            except stripe.error.StripeError as e:
                return Response(
                    {'detail': f'Refund error: {e.user_message}'},
                    status=status.HTTP_502_BAD_GATEWAY,
                )
            refund_id = refund.id
        else:
            refund_sequence = Return.objects.filter(order=order).count() + 1
            refund_id = _mock_refund_id(order.pk, refund_sequence)
 
        # Create Return record
        return_request = Return.objects.create(
            order=order,
            user=request.user,
            status=Return.Status.REFUNDED,
            reason=reason,
            stripe_refund_id=refund_id,
            refund_amount_cents=refund_amount_cents,
        )
 
        # Create ReturnItems and restock
        for order_item, quantity in return_items:
            ReturnItem.objects.create(
                return_request=return_request,
                order_item=order_item,
                quantity=quantity,
            )
            Product.objects.filter(pk=order_item.product_id).update(
                stock=models.F('stock') + quantity
            )
 
        # Update order status
        if is_full_return or not items_data:
            order.status = Order.Status.RETURNED
        else:
            order.status = Order.Status.PARTIALLY_RETURNED
        order.save(update_fields=['status'])
 
        return Response(ReturnSerializer(return_request).data, status=status.HTTP_201_CREATED)
 
 
class ReturnListView(APIView):
    """
    GET /orders/<order_pk>/returns/
    List all returns for a specific order.
    """
    permission_classes = [IsAuthenticated]
 
    def get(self, request, order_pk):
        try:
            order = Order.objects.get(pk=order_pk, user=request.user)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)
 
        returns = Return.objects.filter(order=order).prefetch_related('items')
        return Response(ReturnSerializer(returns, many=True).data)


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
    if not STRIPE_ENABLED:
        return HttpResponse('Stripe not configured.', status=400)

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
    elif event['type'] == 'charge.refunded':
        _handle_refund(event['data']['object'])

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

def _handle_refund(charge):
    """
    Updates order status to REFUNDED when a refund is processed in Stripe.
    Note: Metadata is passed from the PaymentIntent to the Charge object.
    """
    order_id = charge.get('metadata', {}).get('order_id')
    if not order_id:
        return

    try:
        order = Order.objects.get(id=order_id)
        if order.status != 'refunded':
            order.status = 'refunded'
            order.save()
    except Order.DoesNotExist:
        pass
