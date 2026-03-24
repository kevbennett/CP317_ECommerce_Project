from rest_framework import serializers
from .models import Order, OrderItem, Return, ReturnItem


class OrderItemSerializer(serializers.ModelSerializer):
    unit_price = serializers.FloatField(read_only=True)
    subtotal = serializers.FloatField(read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product_id', 'product_name', 'quantity', 'unit_price', 'subtotal']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    total_price = serializers.FloatField(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'email',
            'status',
            'stripe_client_secret',
            'shipping_address',
            'shipping_city',
            'shipping_province',
            'shipping_postal',
            'shipping_country',
            'total_price',
            'items',
            'created_at',
        ]
        read_only_fields = [
            'status',
            'stripe_client_secret',
            'total_price',
            'created_at',
        ]


class ReturnItemInputSerializer(serializers.Serializer):
    """Used when creating a return — validates each item in the request."""
    order_item_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
 
 
class ReturnItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='order_item.product_name', read_only=True)
    refund_amount = serializers.FloatField(read_only=True)
 
    class Meta:
        model = ReturnItem
        fields = ['id', 'order_item', 'product_name', 'quantity', 'refund_amount']
 
 
class ReturnSerializer(serializers.ModelSerializer):
    items = ReturnItemSerializer(many=True, read_only=True)
    refund_amount = serializers.FloatField(read_only=True)
 
    class Meta:
        model = Return
        fields = [
            'id',
            'order',
            'status',
            'reason',
            'refund_amount',
            'stripe_refund_id',
            'items',
            'created_at',
        ]
        read_only_fields = [
            'status',
            'refund_amount',
            'stripe_refund_id',
            'created_at',
        ]