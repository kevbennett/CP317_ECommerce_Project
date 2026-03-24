from django.urls import path
from . import views

urlpatterns = [
    path('', views.OrderListView.as_view(), name='order_list'),
    path('<int:pk>/', views.OrderDetailView.as_view(), name='order_detail'),
    path('checkout/', views.CheckoutView.as_view(), name='checkout'),
    path('<int:order_pk>/return/', views.ReturnView.as_view(),name='order_return'),
    path('<int:order_pk>/returns/', views.ReturnListView.as_view(),name='order_return_list'),
    path('webhook/stripe/', views.stripe_webhook, name='stripe_webhook'),
]