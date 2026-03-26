from django.db import models
from django.contrib.auth.models import User


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        CANCELLED = "cancelled", "Cancelled"
        RETURNED = "returned", "Returned"
        PARTIALLY_RETURNED = "partially_returned", "Partially Returned"

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="orders")
    email = models.EmailField()

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    # Stripe
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)
    stripe_client_secret = models.CharField(max_length=255, blank=True)

    # Snapshot of shipping address at time of order
    # Pre-populated from UserProfile but stored independently so
    # changes to the profile don't alter historical orders
    shipping_address = models.TextField(blank=True)
    shipping_city = models.CharField(max_length=100, blank=True)
    shipping_province = models.CharField(max_length=100, blank=True)
    shipping_postal = models.CharField(max_length=10, blank=True)
    shipping_country = models.CharField(max_length=100, blank=True)

    # Total stored in cents to avoid floating point issues
    total_price_cents = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.pk} — {self.email} ({self.status})"

    @property
    def total_price(self):
        return self.total_price_cents / 100

    def calculate_total(self):
        self.total_price_cents = sum(item.subtotal_cents for item in self.items.all())
        self.save(update_fields=["total_price_cents"])


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product_id = models.PositiveIntegerField()
    product_name = models.CharField(max_length=200)
    unit_price_cents = models.PositiveIntegerField()
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity} × {self.product_name}"

    @property
    def unit_price(self):
        return self.unit_price_cents / 100

    @property
    def subtotal_cents(self):
        return self.unit_price_cents * self.quantity

    @property
    def subtotal(self):
        return self.subtotal_cents / 100
    

class Return(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending",'Pending'
        APPROVED = "approved","Approved"
        REFUNDED = "refunded","Refunded"
        FAILED = "failed","Failed"

    order = models.ForeignKey(Order, on_delete=models.CASCADE,
                              related_name="returns")
    user = models.ForeignKey(User, on_delete=models.SET_NULL,
                             null=True)
    status = models.CharField(max_length=20,choices=Status.choices,
                              default=Status.PENDING)
    reason = models.TextField(blank=True)

    stripe_refund_id = models.CharField(max_length=255,
                                        blank=True)
    refund_amount_cents = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"Return #{self.pk} for Order #{self.order_id} ({self.status})"
    
    @property
    def refund_amount(self):
        return self.refund_amount_cents/100
    

class ReturnItem(models.Model):
    return_request = models.ForeignKey(Return, on_delete=models.CASCADE,
                                       related_name="items")
    order_item = models.ForeignKey(OrderItem, on_delete=models.CASCADE,
                                   related_name="return_items")
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity} x {self.order_item.product_name} (Return #{self.return_request_id})"
    
    @property
    def refund_amount_cents(self):
        return self.order_item.unit_price_cents*self.quantity
    
    @property
    def refund_amount(self):
        return self.refund_amount_cents/100