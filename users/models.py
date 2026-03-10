from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20,blank=True)

    # Shipping Address
    shipping_address = models.TextField(blank=True)
    shipping_city = models.CharField(max_length=100, blank=True)
    shipping_province = models.CharField(max_length=100, blank=True)
    shipping_postal = models.CharField(max_length=10,blank=True)
    shipping_country = models.CharField(max_length=100,blank=True)
    
    # Billing Address
    billing_address = models.TextField(blank=True)
    billing_city = models.CharField(max_length=100, blank=True)
    billing_province = models.CharField(max_length=100, blank=True)
    billing_postal = models.CharField(max_length=10,blank=True)
    billing_country = models.CharField(max_length=100,blank=True)

    def __str__(self):
        return f"{self.user.username}'s profile"