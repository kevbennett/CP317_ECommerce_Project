"""
URL configuration for canadian_catalog project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
<<<<<<< HEAD
    path('shoppingCart/',include('shoppingCart.urls')),
    path("products/", include('products.urls')),
    path('admin/', admin.site.urls),
    path('api/', include('wishlist.urls')),
    path('wishlist/', include('wishlist.urls')),

=======
    path("products/", include("products.urls")),
    path('users/', include('users.urls')),
    path('shoppingCart/', include('shoppingCart.urls')),
    path('admin/', admin.site.urls),
    path('cart/', include('shoppingCart.urls')),
    path("orders/", include("orders.urls")),
>>>>>>> 0405a7c38b8aff73055f10802e461513e96d9769
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
