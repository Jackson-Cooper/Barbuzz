"""
API views for the BarBuzz application.
Organized by function: Authentication, User Management, Bar Data, and Favorites.
"""

#------------------------------------------------------
# Imports
import logging

# Django imports
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db.models import F, ExpressionWrapper, FloatField
from django.db.models.functions import Sin, Cos, ACos, Radians

# REST Framework imports
from django.conf import settings
from rest_framework import viewsets, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken

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
import googlemaps
from googleapiclient.discovery import build
import traceback
from math import radians, sin, cos, sqrt, asin

#------------------------------------------------------
# Logging setup
logger = logging.getLogger(__name__)
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

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({'token': token.key})

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
    queryset = Bar.objects.all()
    serializer_class = BarSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = (TokenAuthentication,)
    
    def list(self, request):
        """Get bars with location-based filtering and enhanced details"""
        try:
            # Get location parameters
            lat = request.query_params.get('lat')
            lng = request.query_params.get('lng')
            radius = int(request.query_params.get('radius', 10)) * 1609  # Convert miles to meters
            limit = int(request.query_params.get('limit', 12))
            
            if lat and lng:
                # Get bars from local database first
                local_bars = self.get_bars_from_database(float(lat), float(lng), radius, limit)
                
                # Initialize Google Maps client
                gmaps = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)
                
                # Update existing bars with missing details
                self.update_bar_details(local_bars, gmaps)
                
                # If not enough results, fetch new bars from Google Places API
                if len(local_bars) < limit:
                    new_bars = self.fetch_new_bars_from_places(float(lat), float(lng), radius, limit - len(local_bars), gmaps)
                    # logger.debug(f"Fetched {len(new_bars)} new bars from Google Places API")
                    local_bars.extend(new_bars)
                    
                    # Sort all bars by distance
                    local_bars.sort(key=lambda x: getattr(x, 'distance', float('inf')))
                
                # Serialize and return results (limit to requested number)
                serializer = self.get_serializer(local_bars[:limit], many=True)
                return Response(serializer.data)
                
            # If no location provided, return standard queryset
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
                
        except Exception as e:
            print(f"Error in BarViewSet.list: {str(e)}")
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_bars_from_database(self, lat, lng, radius_meters, limit):
        """Get bars from local database within radius"""
        # Convert meters to degrees (approximate)
        radius_degrees = radius_meters / 111000  # ~111km per degree
        
        # Simple bounding box query for performance
        bars = Bar.objects.filter(
            type='bar',
            latitude__gte=lat - radius_degrees,
            latitude__lte=lat + radius_degrees,
            longitude__gte=lng - radius_degrees,
            longitude__lte=lng + radius_degrees
        )
        
        # Filter to exact radius and sort by distance
        result = []
        for bar in bars:
            # Calculate distance using Haversine formula
            distance = self.haversine_distance(lat, lng, bar.latitude, bar.longitude)
            if distance <= radius_meters / 1000:  # Convert meters to km
                bar.distance = distance  # Add distance as attribute (not saved to DB)
                result.append(bar)
        
        # Sort by distance
        result.sort(key=lambda x: x.distance)
        return result[:limit]
    
    def update_bar_details(self, bars, gmaps_client):
        """Update bars with missing details from Google Places API"""
        for bar in bars:
            # Only update if details are missing
            if not bar.hours or not bar.photo_reference or not bar.website:
                try:
                    # Fetch additional details for this bar
                    place_details = gmaps_client.place(
                        place_id=bar.place_id,
                        fields=['name', 'formatted_phone_number', 'website', 
                               'opening_hours', 'photo', 'price_level', 'rating']
                    ).get('result', {})
                    
                    print(f"Updating details for {bar.name}")
                    
                    # Update photo reference
                    if 'photo' in place_details and place_details['photo']:
                        bar.photo_reference = place_details['photo'][0].get('photo_reference')
                        print(f"  Added photo for {bar.name}")
                    
                    # Update hours
                    if 'opening_hours' in place_details:
                        bar.hours = place_details['opening_hours'].get('weekday_text')
                        bar.is_open = place_details['opening_hours'].get('open_now')
                        print(f"  Added hours for {bar.name}: {bar.hours}")
                    
                    # Update other fields
                    if 'formatted_phone_number' in place_details:
                        bar.phone_number = place_details['formatted_phone_number']
                    
                    if 'website' in place_details:
                        bar.website = place_details['website']
                    
                    # Save the updated bar
                    bar.save()
                    
                except Exception as e:
                    print(f"  Error updating {bar.name}: {e}")
    
    def fetch_new_bars_from_places(self, lat, lng, radius_meters, limit, gmaps_client):
        """Fetch new bars from Google Places API"""
        try:
            # Query Google Places API
            places_result = gmaps_client.places_nearby(
                location=(lat, lng),
                radius=radius_meters,
                type='bar'
            )
            # Process and save new bars
            new_bars = []
            for place in places_result.get('results', [])[:limit*2]:  # Fetch extra to filter
                try:
                    # Skip if bar already exists
                    if Bar.objects.filter(place_id=place['place_id']).exists():
                        continue
                    
                    # Fetch additional details
                    place_details = gmaps_client.place(
                        place_id=place['place_id'],
                        fields=['name', 'formatted_phone_number', 'website', 
                               'opening_hours', 'photo', 'price_level', 'rating', 'type']
                    ).get('result', {})

                    place_types = place.get('types', [])
                    is_bar = 'bar' in place_types or 'night_club' in place_types
                    if not is_bar:
                        print(f"Skipping {place.get('name')} - not a bar (types: {place_types})")
                        continue
                    
                    # Extract photo reference
                    photo_reference = None
                    if 'photo' in place_details and place_details['photo']:
                        photo_reference = place_details['photo'][0].get('photo_reference')
                    elif 'photo' in place and place['photo']:
                        photo_reference = place['photo'][0].get('photo_reference')
                    
                    # Extract opening hours data
                    hours_data = None
                    is_open = None
                    if 'opening_hours' in place_details:
                        hours_data = place_details['opening_hours'].get('weekday_text')
                        is_open = place_details['opening_hours'].get('open_now')
                    
                    # Create new bar
                    bar = Bar(
                        place_id=place['place_id'],
                        name=place['name'],
                        address=place.get('vicinity', ''),
                        latitude=place['geometry']['location']['lat'],
                        longitude=place['geometry']['location']['lng'],
                        rating=place_details.get('rating', place.get('rating')),
                        price_level=place_details.get('price_level', place.get('price_level')),
                        phone_number=place_details.get('formatted_phone_number', ''),
                        website=place_details.get('website', ''),
                        hours=hours_data,
                        # is_open=is_open, Fix Bar model to handle this
                        photo_reference=photo_reference or '',
                        type='bar'
                    )
                    
                    # Save the new bar
                    bar.save()
                    # logger.debug(f"Added new bar: {bar.name}")
                    
                    # Calculate and store distance
                    distance = self.haversine_distance(lat, lng, bar.latitude, bar.longitude)
                    bar.distance = distance
                    
                    # Add to result list
                    new_bars.append(bar)
                    
                    # Break if we have enough new bars
                    if len(new_bars) >= limit:
                        break
                        
                except Exception as e:
                    logger.debug(f"Error processing place {place.get('name', 'unknown')}: {e}")
            
            return new_bars
            
        except Exception as e:
            logger.debug(f"Error fetching places: {e}")
            return []
    
    def haversine_distance(self, lat1, lon1, lat2, lon2):
        """Calculate the great circle distance between two points in kilometers"""
        # Convert decimal degrees to radians
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        r = 6371  # Radius of earth in kilometers
        return c * r

class WaitTimeViewSet(viewsets.ModelViewSet):
    """ViewSet for reporting and retrieving bar wait times"""
    queryset = WaitTime.objects.all()
    serializer_class = WaitTimeSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = (TokenAuthentication,)

#------------------------------------------------------
# Favorites Views
#------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_favorites(request):
    """
    Get all favorite bars for the current user.
    Returns serialized bar data for favorited bars.
    """
    try:
        favorites = Favorite.objects.filter(user=request.user)
        favorite_bars = [favorite.bar for favorite in favorites]
        serializer = BarSerializer(favorite_bars, many=True)
        return Response(serializer.data)
    
    except Exception as e:
        logging.error(f"Error fetching favorites: {str(e)}")
        return Response(
            {"error": "Failed to load favorites."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
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