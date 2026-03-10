from django.urls import path
from . import views

urlpatterns = [
    path('', views.OrderListView.as_view(), name='order_list'),
    path('<int:pk>/', views.OrderDetailView.as_view(), name='order_detail'),
    path('checkout/', views.CheckoutView.as_view(), name='checkout'),
    path('webhook/stripe/', views.stripe_webhook, name='stripe_webhook'),
]

# Mount in your root urls.py:
# path("api/orders/", include("orders.urls", namespace="orders")),