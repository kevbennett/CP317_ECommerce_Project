from django.urls import path
from . import views

urlpatterns = [
    path('', views.CartDetailView.as_view(), name='cart_detail'),
    path('add/', views.AddToCartView.as_view(), name='add_to_cart'),
    path('remove/<int:cart_item_id>/', views.RemoveFromCartView.as_view(), name='remove_from_cart'),
]