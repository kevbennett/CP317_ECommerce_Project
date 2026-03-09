from rest_framework import serializers
from .models import Order, OrderItem


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