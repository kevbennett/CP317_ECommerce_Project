from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from products.models import Product
from .models import Cart


def _serialize_cart_item(cart_item: Cart) -> dict:
    return {
        'id': cart_item.id,
        'product_id': cart_item.product_id,
        'name': cart_item.product.name,
        'price': str(cart_item.product.price),
        'qty': cart_item.quantity,
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cart_detail(request):
    cart_items = (
        Cart.objects.select_related('product')
        .filter(user=request.user)
        .order_by('id')
    )
    return Response([_serialize_cart_item(item) for item in cart_items])


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    product_id = request.data.get('product_id')
    qty = request.data.get('qty', 1)

    try:
        qty = int(qty)
    except (TypeError, ValueError):
        return Response({'error': 'qty must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

    if qty < 1:
        return Response({'error': 'qty must be at least 1'}, status=status.HTTP_400_BAD_REQUEST)

    product = get_object_or_404(Product, pk=product_id)
    cart_item, created = Cart.objects.get_or_create(
        user=request.user,
        product=product,
        defaults={'quantity': qty},
    )
    if not created:
        cart_item.quantity += qty
        cart_item.save(update_fields=['quantity'])

    return Response(_serialize_cart_item(cart_item), status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_cart_item(request):
    cart_item_id = request.data.get('cart_item_id')
    qty = request.data.get('qty')

    if cart_item_id is None or qty is None:
        return Response(
            {'error': 'cart_item_id and qty are required'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        qty = int(qty)
    except (TypeError, ValueError):
        return Response({'error': 'qty must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

    if qty < 1:
        return Response({'error': 'qty must be at least 1'}, status=status.HTTP_400_BAD_REQUEST)

    cart_item = get_object_or_404(Cart, pk=cart_item_id, user=request.user)
    cart_item.quantity = qty
    cart_item.save(update_fields=['quantity'])
    return Response(_serialize_cart_item(cart_item))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_cart_item(request):
    cart_item_id = request.data.get('cart_item_id')
    if cart_item_id is None:
        return Response({'error': 'cart_item_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    cart_item = get_object_or_404(Cart, pk=cart_item_id, user=request.user)
    cart_item.delete()
    return Response({'message': 'Item removed'})
