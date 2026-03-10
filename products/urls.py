from django.urls import path

from . import views

urlpatterns = [
    path("", views.product_list, name="product_list"),
    path("<int:pk>/",views.product_detail, name="product_detail"),
    path('search/', views.product_search, name='product_search'),
    path('categories/', views.category_list, name='category_list'),
    path('category/<int:category_id>/', views.products_by_category, name='products_by_category')
]