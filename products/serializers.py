from rest_framework import serializers
from .models import Product, Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id','name','slug']

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
<<<<<<< HEAD

=======
    
>>>>>>> a77800a (saving local changes before sync)
    class Meta:
        model = Product
        fields = ['id','name','price','description','image','category','category_name']
