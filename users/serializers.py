from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'phone',
            'shipping_address',
            'shipping_city',
            'shipping_province',
            'shipping_postal',
            'shipping_country',
            'billing_address',
            'billing_city',
            'billing_province',
            'billing_postal',
            'billing_country',
        ]


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    profile = UserProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'profile']
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def create(self, validated_data):
        profile_data = validated_data.pop('profile',None)

        # Creates user with hashed password
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email',''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name',''),
            last_name=validated_data.get('last_name','')
        )

        if profile_data:
            UserProfile.objects.create(user=user,**profile_data)
        else:
            UserProfile.objects.create(user=user)

        return user
    

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer()

    class Meta:
        model = User
        fields = ['id','username','email','first_name','last_name','profile']