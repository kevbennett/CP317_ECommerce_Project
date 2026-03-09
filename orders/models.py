from django.db import models
from django.contrib.auth.models import User


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        CANCELLED = "cancelled", "Cancelled"

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