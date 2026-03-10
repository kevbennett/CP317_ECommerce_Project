from django.test import TestCase
from django.contrib.auth.models import User
from products.models import Product
from .models import WishlistItem

class WishlistTest(TestCase):
    def setUp(self):
       
        self.user = User.objects.create_user(username='testuser', password='12345')

        self.product = Product.objects.create(name='Test Product', price=100)

    def test_add_to_wishlist(self):
        
        WishlistItem.objects.create(user=self.user, product=self.product)
        
        item = WishlistItem.objects.get(user=self.user, product=self.product)
        self.assertEqual(item.user, self.user)
        self.assertEqual(item.product, self.product)