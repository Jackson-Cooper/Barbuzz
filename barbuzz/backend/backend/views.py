"""
API views for the BarBuzz application.

This module contains all the API endpoints for the BarBuzz application,
organized by functionality: Authentication, User Management, Bar Data, and Favorites.
"""

import logging
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.db import transaction


from rest_framework import viewsets, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken

from .models import Bar, Favorite, WaitTime, UserProfile
from .serializers import (
    BarSerializer, 
    WaitTimeSerializer, 
    UserProfileSerializer, 
    UserRegistrationSerializer
)
from .utils import haversine_distance
from .services import PlacesService, WaitTimeService

import json

logger = logging.getLogger(__name__)

# Authentication and User Views

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the Django User model - used for authentication responses.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class UserRegistrationAPIView(APIView):
    """
    API endpoint for user registration.
    """
    permission_classes = [AllowAny]
    def post(self, request):
        try:
            # Extract data from request
            username = request.data.get('username')
            email = request.data.get('email')
            password = request.data.get('password')
            
            # Basic validation
            if not username or not email or not password:
                return Response({
                    'error': 'Username, email, and password are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if user exists
            if User.objects.filter(username=username).exists():
                return Response({
                    'error': 'Username already exists'
                }, status=status.HTTP_400_BAD_REQUEST)
                
            if User.objects.filter(email=email).exists():
                return Response({
                    'error': 'Email already exists'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Use atomic transaction to ensure consistency
            with transaction.atomic():
                # Create user
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password
                )
                
                # Create user profile
                # Use get_or_create to handle the case where a profile might already exist
                profile, created = UserProfile.objects.get_or_create(
                    user=user,
                    defaults={'is_over_21': True}
                )
                
                if not created:
                    # If a profile already exists, update it
                    profile.is_over_21 = True
                    profile.save()
            
            return Response({
                'success': 'User registered successfully',
                'username': username
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error in registration: {str(e)}")
            return Response({
                'error': f'Registration failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """
    Get information about the currently authenticated user.
    
    Args:
        request: HTTP request with authentication
        
    Returns:
        Response: Serialized user data
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

class CustomAuthToken(ObtainAuthToken):
    """
    Custom token authentication endpoint with enhanced responses.
    """
    
    def post(self, request, *args, **kwargs):
        """
        Authenticate user and provide an access token.
        
        Args:
            request: HTTP request containing credentials
            
        Returns:
            Response: Authentication token or error message
        """
        serializer = self.serializer_class(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({'token': token.key})

class LogoutAPIView(APIView):
    """
    API endpoint for user logout.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Delete the user's authentication token to log them out.
        
        Args:
            request: HTTP request with authentication
            
        Returns:
            Response: Success message
        """
        Token.objects.filter(user=request.user).delete()
        return Response({"message": "Successfully logged out"})

# User Profile Views

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """
    Get the profile of the current authenticated user.
    
    Args:
        request: HTTP request with authentication
        
    Returns:
        Response: Serialized user profile data
    """
    profile = UserProfile.objects.get(user=request.user)
    serializer = UserProfileSerializer(profile)
    return Response(serializer.data)

class UserProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing user profiles (admin access to all profiles).
    """
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

# Bar Views

class BarViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing bars and related data.
    
    Provides endpoints for creating, retrieving, updating, and deleting bars,
    as well as searching for nearby bars.
    """
    queryset = Bar.objects.all()
    serializer_class = BarSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = (TokenAuthentication,)
    
    def list(self, request):
        """
        Get bars with properly calculated distances based on query parameters.
        
        Supports filtering by:
        - lat, lng: User location coordinates
        - radius: Search radius in meters
        - limit: Maximum number of results
        - price_level: Filter by price level
        - rating: Minimum rating threshold
        - query: Search text (when global=true)
        - global: Whether to perform a global search
        
        Args:
            request: HTTP request with query parameters
            
        Returns:
            Response: Serialized bar data with distances
        """
        try:
            query = request.query_params.get('query')
            is_global = request.query_params.get('global', 'false').lower() == 'true'
            
            if is_global and query:
                return self._handle_global_search(request, query)
            
            try:
                lat = float(request.query_params.get('lat', 0))
                lng = float(request.query_params.get('lng', 0))
                radius = int(request.query_params.get('radius', 5000))
                limit = int(request.query_params.get('limit', 12))
            except (ValueError, TypeError):
                return Response({"error": "Invalid location parameters"}, status=400)
                
            if lat == 0 and lng == 0:
                return Response({"error": "Location parameters required"}, status=400)
            
            bars = Bar.objects.nearby(lat, lng, radius)
            
            if request.query_params.get('price_level'):
                bars = [b for b in bars if b.price_level == int(request.query_params.get('price_level'))]
                
            if request.query_params.get('rating'):
                bars = [b for b in bars if b.rating and b.rating >= float(request.query_params.get('rating'))]
            
            bars = bars[:limit]
            
            serializer = self.get_serializer(bars, many=True)
            data = serializer.data
            
            for i, bar in enumerate(bars):
                data[i]['distance'] = round(bar.distance, 1)
            
            return Response(data)
                
        except Exception as e:
            logger.error(f"Error in bar list: {str(e)}")
            return Response({"error": str(e)}, status=500)
    
    def _handle_global_search(self, request, query):
        """
        Handle global search using the centralized bar manager.
        
        Args:
            request: HTTP request
            query (str): Search query
            
        Returns:
            Response: Serialized bar data matching the query
        """
        try:
            logger.info(f"Global search request received - Query: '{query}'")
            
            try:
                limit = int(request.query_params.get('limit', 12))
            except (ValueError, TypeError):
                limit = 12
            
            bars = Bar.objects.search_by_query(query)
            
            if request.query_params.get('price_level'):
                bars = bars.filter(price_level=int(request.query_params.get('price_level')))
                
            if request.query_params.get('rating'):
                bars = bars.filter(rating__gte=float(request.query_params.get('rating')))
            
            bars = bars[:limit]
            
            serializer = self.get_serializer(bars, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error in global search: {str(e)}")
            return Response(
                {"error": "An error occurred while searching."},
                status=500
            )
    
    def create_bar_from_place_details(self, place_details, origin_lat, origin_lng):
        """
        Create a new bar from Google Places API details.
        
        Args:
            place_details (dict): Details from Google Places API
            origin_lat (float): Latitude of reference point for distance calculation
            origin_lng (float): Longitude of reference point for distance calculation
            
        Returns:
            dict: Serialized bar data with distance or None if creation fails
        """
        try:
            place_id = place_details.get('place_id')
            name = place_details.get('name', 'Unknown Bar')

            types = place_details.get('types', [])
            if 'bar' not in types and 'night_club' not in types:
                return None
            
            location = place_details.get('geometry', {}).get('location', {})
            latitude = location.get('lat')
            longitude = location.get('lng')
            
            if not (place_id and latitude and longitude):
                return None
            
            address = place_details.get('formatted_address', '')
            phone = place_details.get('formatted_phone_number', '')
            website = place_details.get('website', '')
            is_open = place_details.get('opening_hours', {}).get('open_now', False)
            # logger.debug(f"Place is open: {is_open}")
            
            hours_data = place_details.get('opening_hours', {}).get('periods', [])
            if hours_data:
                cleaned_hours = []
                for period in hours_data:
                    if isinstance(period, dict):
                        cleaned_period = {}
                        if 'open' in period and isinstance(period['open'], dict):
                            cleaned_period['open'] = {
                                'day': period['open'].get('day'),
                                'time': period['open'].get('time')
                            }
                        if 'close' in period and isinstance(period['close'], dict):
                            cleaned_period['close'] = {
                                'day': period['close'].get('day'),
                                'time': period['close'].get('time')
                            }
                        if 'open' in cleaned_period:
                            cleaned_hours.append(cleaned_period)
                
                hours = json.dumps(cleaned_hours)
            
            price_level = place_details.get('price_level')
            rating = place_details.get('rating')
            
            distance = haversine_distance(origin_lat, origin_lng, latitude, longitude)
            
            new_bar = Bar(
                place_id=place_id,
                name=name,
                address=address,
                latitude=latitude,
                longitude=longitude,
                phone_number=phone,
                website=website,
                # photo_reference=photo_reference,
                hours=hours,
                price_level=price_level,
                rating=rating,
                type=types,
                is_open=is_open
            )
            new_bar.save()
            
            bar_data = BarSerializer(new_bar).data
            bar_data['distance'] = round(distance / 1609, 1)  
            return bar_data
            
        except Exception as e:
            logger.error(f"Error creating bar from place details: {str(e)}")
            return None

# Wait Time Views

class WaitTimeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for reporting and retrieving bar wait times.
    
    Integrates with Best Time API to provide wait time estimates for bars.
    """
    queryset = WaitTime.objects.all()
    serializer_class = WaitTimeSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = (TokenAuthentication,)

    def list(self, request, *args, **kwargs):
        """
        Override list method to fetch wait times from the Best Time API.
        
        Args:
            request: HTTP request with 'bar' query parameter
            
        Returns:
            Response: Current wait time in minutes
        """
        bar_id = request.query_params.get('bar')
        if not bar_id:
            return Response({"error": "Bar ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            bar = Bar.objects.get(pk=bar_id)
        except Bar.DoesNotExist:
            return Response({"error": "Bar not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            # logger.debug(f"Bar is open? {bar.is_open}")
            # if not bar.is_open:
            #     return Response({0}, status=status.HTTP_200_OK)
            # else:
            service = WaitTimeService()
            venue_id = service.create_forecast(bar)
            busyness_pct = service.get_current_busyness(venue_id)
            wait_time = service.convert_percentage_to_minutes(busyness_pct)

            wait_time_data = {
                "bar": {
                    "id": bar_id,
                    "name": bar.name,
                    "address": bar.address
                },
                "wait_time": wait_time
            }

            logger.debug(f"Wait time data: {wait_time_data}")
            return Response([wait_time], status=status.HTTP_200_OK)
                
        except Exception as e:
            logger.error(f"Error fetching wait time: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Favorites Views

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_favorites(request):
    """
    Get all favorite bars for the current user.
    
    Args:
        request: HTTP request with authentication
        
    Returns:
        Response: Serialized favorite bar data
    """
    try:
        favorites = Favorite.objects.filter(user=request.user).select_related('bar')
        favorite_bars = [favorite.bar for favorite in favorites]
        serializer = BarSerializer(favorite_bars, many=True)
        return Response(serializer.data)
    
    except Exception as e:
        logger.error(f"Error fetching favorites: {str(e)}")
        return Response(
            {"error": "Failed to load favorites."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_favorite(request, bar_id):
    """
    Toggle a bar as favorite/unfavorite for the current user.
    
    Args:
        request: HTTP request with authentication
        bar_id (int): ID of the bar to toggle
        
    Returns:
        Response: Status message indicating favorited or unfavorited
    """
    try:
        bar = Bar.objects.get(pk=bar_id)
        favorite, created = Favorite.objects.get_or_create(user=request.user, bar=bar)
        
        if not created:
            favorite.delete()
            return Response({"status": "unfavorited"})
        
        return Response({"status": "favorited"})
    except Bar.DoesNotExist:
        return Response({"error": "Bar not found"}, status=status.HTTP_404_NOT_FOUND)
