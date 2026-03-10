
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from products.models import Product
from .models import Cart
from .serializers import CartItemSerializer

class CartDetailView(APIView):
    """
    GET /api/cart/
    Returns all cart items for the authenticated user, plus a total.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart_items = Cart.objects.filter(user=request.user).select_related('product')
        serializer = CartItemSerializer(cart_items, many=True)
        total = sum(item.product.price * item.quantity for item in cart_items)
        return Response({
            'items': serializer.data,
            'total': total,
        })


class AddToCartView(APIView):
    """
    POST /api/cart/add/
    Body: { "product_id": 1, "quantity": 2 }
    Adds a product to the cart. If it already exists, increments quantity.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))

        if not product_id:
            return Response(
                {'detail': 'product_id is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            return Response(
                {'detail': 'Product not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if quantity < 1:
            return Response(
                {'detail': 'Quantity must be at least 1.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if product.stock < quantity:
            return Response(
                {'detail': f'Only {product.stock} item(s) in stock.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart_item, created = Cart.objects.get_or_create(
            user=request.user,
            product=product,
            defaults={'quantity': quantity},
        )

        if not created:
            cart_item.quantity += quantity
            cart_item.save()

        serializer = CartItemSerializer(cart_item)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RemoveFromCartView(APIView):
    """
    DELETE /api/cart/remove/<cart_item_id>/
    Removes a cart item entirely.

    POST /api/cart/remove/<cart_item_id>/   (with { "quantity": 1 })
    Decrements quantity by the given amount; removes item if quantity hits 0.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, cart_item_id):
        try:
            cart_item = Cart.objects.get(pk=cart_item_id, user=request.user)
        except Cart.DoesNotExist:
            return Response(
                {'detail': 'Cart item not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        cart_item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def post(self, request, cart_item_id):
        """Decrement quantity rather than removing entirely."""
        try:
            cart_item = Cart.objects.get(pk=cart_item_id, user=request.user)
        except Cart.DoesNotExist:
            return Response(
                {'detail': 'Cart item not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        quantity = int(request.data.get('quantity', 1))
        cart_item.quantity -= quantity

        if cart_item.quantity <= 0:
            cart_item.delete()
            return Response({'detail': 'Item removed from cart.'}, status=status.HTTP_200_OK)

        cart_item.save()
        serializer = CartItemSerializer(cart_item)
        return Response(serializer.data, status=status.HTTP_200_OK)

