"""
API views for the BarBuzz application.
Organized by function: Authentication, User Management, Bar Data, and Favorites.
"""

# Django imports
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db.models import F, ExpressionWrapper, FloatField
from django.db.models.functions import Sin, Cos, ACos, Radians

# REST Framework imports
from rest_framework import viewsets, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token

# Local imports
from .models import Bar, Favorite, WaitTime, UserProfile
from .serializers import (
    BarSerializer, 
    WaitTimeSerializer, 
    UserProfileSerializer, 
    UserRegistrationSerializer
)

# API imports
import json
from googleapiclient.discovery import build
#------------------------------------------------------
# Authentication Views
#------------------------------------------------------

class UserSerializer(serializers.ModelSerializer):
    """Serializer for the Django User model - used for authentication responses"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class UserRegistrationAPIView(APIView):
    """API endpoint for user registration"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Register a new user"""
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """Get information about the currently authenticated user"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

class LogoutAPIView(APIView):
    """API endpoint for user logout"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Delete the user's authentication token to log them out"""
        Token.objects.filter(user=request.user).delete()
        return Response({"message": "Successfully logged out"})

#------------------------------------------------------
# User Profile Views
#------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """Get the profile of the current authenticated user"""
    profile = UserProfile.objects.get(user=request.user)
    serializer = UserProfileSerializer(profile)
    return Response(serializer.data)

class UserProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing user profiles (admin access to all profiles)"""
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

#------------------------------------------------------
# Bar and Wait Time Views
#------------------------------------------------------

class BarViewSet(viewsets.ModelViewSet):
    """ViewSet for CRUD operations on bars"""
    queryset = Bar.objects.all()
    serializer_class = BarSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['get'], url_path='nearby-bars', permission_classes=[permissions.IsAuthenticated])
    def get_nearby_bars(self, request):
        """Get bars within a specified radius of a location"""

        # Get location parameters
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        radius = request.query_params.get('radius')
        limit = request.query_params.get('limit')

        # google credentials for Google Places API
        with open('api_keys.json') as f:
            credentials = json.load(f)
        places_api = build('places', 'v1', developerKey=credentials['google_api_key'])
        request = places_api.nearbysearch(
            location=f'{lat},{lng}',
            radius=radius,
            type='bar',
        )
        response = request.execute()
        bars = response.get('results', [])
        return Response(bars)

    def get_queryset(self):
        """
        Override to support filtering by location and other parameters.
        Allows finding bars within a specified radius of a location.
        """
        queryset = Bar.objects.all()
        
        # Get location parameters
        lat = self.request.query_params.get('lat')
        lng = self.request.query_params.get('lng')
        radius = self.request.query_params.get('radius')
        limit = self.request.query_params.get('limit')
        
        # If we have location, filter by distance
        if lat and lng and radius:
            # Convert to float
            lat = float(lat)
            lng = float(lng)
            radius = float(radius)
            
            # Calculate distance using the Haversine formula
            earth_radius = 3958.8  # miles
            
            # Annotate each bar with its distance from the provided coordinates
            queryset = queryset.annotate(
                distance=ExpressionWrapper(
                    earth_radius * ACos(
                        Cos(Radians(lat)) * 
                        Cos(Radians(F('latitude'))) * 
                        Cos(Radians(F('longitude')) - Radians(lng)) + 
                        Sin(Radians(lat)) * 
                        Sin(Radians(F('latitude')))
                    ),
                    output_field=FloatField()
                )
            ).filter(distance__lte=radius).order_by('distance')
        
        # Apply limit if provided
        if limit:
            queryset = queryset[:int(limit)]
            
        return queryset

class WaitTimeViewSet(viewsets.ModelViewSet):
    """ViewSet for reporting and retrieving bar wait times"""
    queryset = WaitTime.objects.all()
    serializer_class = WaitTimeSerializer
    permission_classes = [permissions.IsAuthenticated]

#------------------------------------------------------
# Favorites Views
#------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_favorites(request):
    """Get all favorite bars for the current user"""
    favorites = Favorite.objects.filter(user=request.user)
    bars = [favorite.bar for favorite in favorites]
    serializer = BarSerializer(bars, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_favorite(request, bar_id):
    """Toggle a bar as favorite/unfavorite for the current user"""
    try:
        bar = Bar.objects.get(pk=bar_id)
        favorite, created = Favorite.objects.get_or_create(user=request.user, bar=bar)
        
        if not created:  # If it existed already, then remove it
            favorite.delete()
            return Response({"status": "unfavorited"})
        
        return Response({"status": "favorited"})
    except Bar.DoesNotExist:
        return Response({"error": "Bar not found"}, status=status.HTTP_404_NOT_FOUND)