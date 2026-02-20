from django.shortcuts import render, redirect
from .models import Product, Cart
from django.contrib.auth.decorators import login_required

def product_list(request):
    products = Product.objects.all()
    return render(request, 'shopping_cart/product_list.html', {'products': products})

@login_required
def add_to_cart(request, product_id):
    product = Product.objects.get(id=product_id)
    cart_item, created = Cart.objects.get_or_create(
        user=request.user, product=product,
        defaults={'quantity': 1}
    )
    if not created:
        cart_item.quantity += 1
        cart_item.save()
    return redirect('product_list')

@login_required
def cart_detail(request):
    cart_items = Cart.objects.filter(user=request.user)
    return render(request, 'shopping_cart/cart_detail.html', {'cart_items': cart_items})
