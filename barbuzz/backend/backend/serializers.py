"""
Serializers for the BarBuzz application.

This module defines the serializers that convert complex data types
(like model instances) to Python data types that can be easily rendered
into JSON for the REST API.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Bar, WaitTime, UserProfile
from .settings import GOOGLE_MAPS_API_KEY

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    
    Handles validation and creation of new user accounts with
    email, username and password.
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    username = serializers.CharField(required=True)

    class Meta:
        model = get_user_model()
        fields = ('username', 'email', 'password')
    
    def create(self, validated_data):
        """
        Create and return a new user instance with encrypted password.
        
        Args:
            validated_data (dict): Data validated by the serializer
            
        Returns:
            User: The newly created user instance
        """
        user = get_user_model().objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class BarSerializer(serializers.ModelSerializer):
    """
    Serializer for Bar model.
    
    Includes calculated fields like distance and image URL
    generated from the bar's photo reference.
    """
    distance = serializers.FloatField(read_only=True, required=False)
    image = serializers.SerializerMethodField()

    class Meta:
        model = Bar
        fields = '__all__'

    def get_image(self, obj):
        """
        Generate a Google Places photo URL from the bar's photo reference.
        
        Args:
            obj (Bar): Bar instance being serialized
            
        Returns:
            str: Complete Google Places photo URL or None if no reference exists
        """
        if obj.photo_reference:
            api_key = GOOGLE_MAPS_API_KEY
            return f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={obj.photo_reference}&key={api_key}"
        return None

    def to_representation(self, instance):
        """Expose the Google place ID as the primary identifier."""
        data = super().to_representation(instance)
        data["id"] = data.get("place_id") or data.get("id")
        return data

class WaitTimeSerializer(serializers.ModelSerializer):
    """
    Serializer for wait time data reported by users.
    
    Includes the associated bar's name for convenience.
    """
    bar_name = serializers.CharField(source='bar.name', read_only=True)
    
    class Meta:
        model = WaitTime
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profiles.
    
    Includes nested serialization of the user's favorite bars.
    """
    favorite_bars = BarSerializer(many=True, read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['user', 'favorite_bars']