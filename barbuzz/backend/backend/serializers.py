from rest_framework import serializers
from django.contrib.auth import get_user_model
from allauth.account.models import EmailAddress
from .models import Bar, WaitTime, UserProfile

# Serializer for User Registration
class UserRegistrationSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    username = serializers.CharField(required=True)

    class Meta:
        model = get_user_model()
        fields = ('username', 'email', 'password')
    
    def create(self, validated_data):
        user = get_user_model().objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class BarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bar
        fields = '__all__'

class WaitTimeSerializer(serializers.ModelSerializer):
    bar_name = serializers.CharField(source='bar.name', read_only=True)
    
    class Meta:
        model = WaitTime
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    favorite_bars = BarSerializer(many=True, read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['user', 'favorite_bars']
