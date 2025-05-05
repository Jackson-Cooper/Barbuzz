"""
API views for the BarBuzz application.
Organized by function: Authentication, User Management, Bar Data, and Favorites.
"""

#------------------------------------------------------
# Imports
import logging
from datetime import datetime, timedelta
from math import sin, cos, sqrt, atan2, radians

# Django imports
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db.models import F, ExpressionWrapper, FloatField
from django.db.models.functions import Sin, Cos, ACos, Radians
from django.db.models import Q

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
import requests
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
        """Get bars with properly calculated distances"""
        try:
            # Check for global search mode
            query = request.query_params.get('query')
            is_global = request.query_params.get('global', 'false').lower() == 'true'
            
            # Process global search
            if is_global and query:
                bars = Bar.objects.search_by_query(query)
                serializer = self.get_serializer(bars, many=True)
                return Response(serializer.data)
            
            # Get location parameters
            try:
                lat = float(request.query_params.get('lat', 0))
                lng = float(request.query_params.get('lng', 0))
                radius = int(request.query_params.get('radius', 5000))
                limit = int(request.query_params.get('limit', 12))
            except (ValueError, TypeError):
                return Response({"error": "Invalid location parameters"}, status=400)
                
            # Return error if no location provided
            if lat == 0 and lng == 0:
                return Response({"error": "Location parameters required"}, status=400)
            
            # Get nearby bars using the manager method
            bars = Bar.objects.nearby(lat, lng, radius)
            
            # Apply price and rating filters if needed
            if request.query_params.get('price_level'):
                bars = [b for b in bars if b.price_level == int(request.query_params.get('price_level'))]
                
            if request.query_params.get('rating'):
                bars = [b for b in bars if b.rating and b.rating >= float(request.query_params.get('rating'))]
            
            # Apply limit
            bars = bars[:limit]
            
            # Serialize results - need to manually include distance
            serializer = self.get_serializer(bars, many=True)
            data = serializer.data
            
            # Add the distance to each bar's data
            for i, bar in enumerate(bars):
                data[i]['distance'] = round(bar.distance, 1)  # Round to 1 decimal place
            
            return Response(data)
                
        except Exception as e:
            logger.error(f"Error in bar list: {str(e)}")
            return Response({"error": str(e)}, status=500)
        
    def handle_global_search(self, request, query):
        """Handle global search using the centralized bar manager"""
        try:
            logger.info(f"Global search request received - Query: '{query}'")
            
            try:
                limit = int(request.query_params.get('limit', 12))
            except (ValueError, TypeError):
                limit = 12
            
            # Use the custom manager method - all filtering is handled there
            bars = Bar.objects.search_by_query(query)
            
            # Apply additional filters if specified
            if request.query_params.get('price_level'):
                bars = bars.filter(price_level=int(request.query_params.get('price_level')))
                
            if request.query_params.get('rating'):
                bars = bars.filter(rating__gte=float(request.query_params.get('rating')))
            
            # Limit results
            bars = bars[:limit]
            
            # Return results
            serializer = self.get_serializer(bars, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error in global search: {str(e)}")
            return Response(
                {"error": "An error occurred while searching."},
                status=500
            )
    
    def get_bars_from_database(self, lat, lng, radius, limit):
        """Get bars from database within given radius"""
        # Calculate approximate bounding box to improve query performance
        lat_range = radius / 111000  # 1 degree latitude is approximately 111km
        lng_range = radius / (111000 * cos(radians(lat)))
        
        # Query within bounding box first for performance
        bars_in_box = Bar.objects.filter(
            latitude__range=(lat - lat_range, lat + lat_range),
            longitude__range=(lng - lng_range, lng + lng_range)
        )
        
        # Filter by actual distance
        result_bars = []
        for bar in bars_in_box:
            distance = self.calculate_distance(lat, lng, bar.latitude, bar.longitude)
            if distance <= radius:
                bar_data = BarSerializer(bar).data
                bar_data['distance'] = round(distance / 1609, 1)  # Convert meters to miles and round
                result_bars.append(bar_data)
        
        # Sort by distance
        result_bars.sort(key=lambda x: x['distance'])
        
        return result_bars[:limit]
    
    def fetch_new_bars_from_places(self, lat, lng, radius, limit, gmaps):
        """Fetch new bars from Google Places API"""
        # Places API search
        places_result = gmaps.places_nearby(
            location=(lat, lng),
            radius=radius,
            type='bar',
            rank_by='distance'
        )
        
        results = places_result.get('results', [])
    
        # Also search for nightclubs and combine results
        nightclub_results = gmaps.places_nearby(
            location=(lat, lng),
            radius=radius,
            type='night_club',
            rank_by='distance'
        ).get('results', [])
    
        # Combine and deduplicate results
        place_ids = set()
        combined_results = []
    
        for place in results + nightclub_results:
            if place['place_id'] not in place_ids:
                place_ids.add(place['place_id'])
                combined_results.append(place)
        
        new_bars = []
        existing_bar_ids = set(Bar.objects.values_list('place_id', flat=True))
            
        for place in combined_results:
            if len(new_bars) >= limit:
                break
                
            place_id = place.get('place_id')
            
            # Skip if we already have this bar in our database
            if place_id in existing_bar_ids:
                continue
            
            # Verify this is actually a bar or nightclub
            types = place.get('types', [])
            if 'bar' not in types and 'night_club' not in types:
                continue
            
            # Get more details about the place
            place_details = gmaps.place(place_id=place_id).get('result', {})
            
            # Create a new bar object
            new_bar = self.create_bar_from_place_details(place_details, lat, lng)
            
            if new_bar:
                new_bars.append(new_bar)
        
        return new_bars
    
    def create_bar_from_place_details(self, place_details, origin_lat, origin_lng):
        """Create a new bar from Google Places API details using only existing fields"""
        try:
            # Extract essential information
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
            
            # Extract address (without breaking it down to city/state/postal_code)
            address = place_details.get('formatted_address', '')
            phone = place_details.get('formatted_phone_number', '')
            website = place_details.get('website', '')
            
            # Get operating hours
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
            else:
                hours = None
            
            # Get price level and rating if available
            price_level = place_details.get('price_level')
            rating = place_details.get('rating')
            
            # Calculate distance
            distance = self.calculate_distance(origin_lat, origin_lng, latitude, longitude)
            
            # Create and save the new bar - use only fields that exist in your model
            new_bar = Bar(
                place_id=place_id,      # Use this as your primary identifier
                name=name,
                address=address,
                latitude=latitude,
                longitude=longitude,
                phone_number=phone,
                website=website,
                hours=hours,
                price_level=price_level,
                rating=rating,
                type=types
            )
            new_bar.save()
            
            # Return serialized data
            bar_data = BarSerializer(new_bar).data
            bar_data['distance'] = round(distance / 1609, 1)  # Convert meters to miles and round
            return bar_data
            
        except Exception as e:
            logger.error(f"Error creating bar from place details: {str(e)}")
            return None
        
    def update_bar_details(self, bars_list, gmaps):
        """Update bar details from Google Places API where needed"""
        for bar_data in bars_list:
            if 'google_place_id' not in bar_data or not bar_data['google_place_id']:
                continue
                
            # Check if we need to update details (no hours, no website, etc.)
            needs_update = (not bar_data.get('hours') or 
                           not bar_data.get('website') or 
                           not bar_data.get('phone'))
            
            if needs_update:
                try:
                    place_details = gmaps.place(place_id=bar_data['google_place_id']).get('result', {})
                    
                    # Update bar object
                    bar = Bar.objects.get(id=bar_data['id'])
                    
                    if not bar.hours and 'opening_hours' in place_details:
                        hours_data = place_details['opening_hours'].get('periods', [])
                        bar.hours = json.dumps(hours_data)
                        
                    if not bar.website and 'website' in place_details:
                        bar.website = place_details['website']
                        
                    if not bar.phone and 'formatted_phone_number' in place_details:
                        bar.phone = place_details['formatted_phone_number']
                    
                    bar.save()
                    
                    # Update the data in our results list
                    bar_data['hours'] = bar.hours
                    bar_data['website'] = bar.website
                    bar_data['phone'] = bar.phone
                    
                except Exception as e:
                    logger.error(f"Error updating bar details: {str(e)}")
        
    def calculate_distance(self, lat1, lon1, lat2, lon2):
        """Calculate distance between two points using Haversine formula"""
        # Radius of the Earth in meters
        R = 6371000
        
        # Convert coordinates to radians
        lat1_rad = radians(lat1)
        lon1_rad = radians(lon1)
        lat2_rad = radians(lat2)
        lon2_rad = radians(lon2)
        
        # Differences
        dlon = lon2_rad - lon1_rad
        dlat = lat2_rad - lat1_rad
        
        # Haversine formula
        a = sin(dlat/2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        distance = R * c
        
        return distance

class WaitTimeViewSet(viewsets.ModelViewSet):
    """ViewSet for reporting and retrieving bar wait times"""
    queryset = WaitTime.objects.all()
    serializer_class = WaitTimeSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = (TokenAuthentication,)

    def list(self, request, *args, **kwargs):
        """
        Override list method to fetch wait times from the external "best time" API
        and return them in the response.
        """
        bar_id = request.query_params.get('bar')
        if not bar_id:
            return Response({"error": "Bar ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Fetch the bar instance by ID
            bar = Bar.objects.get(pk=bar_id)
        except Bar.DoesNotExist:
            return Response({"error": "Bar not found"}, status=status.HTTP_404_NOT_FOUND)

        # TODO: Implement the actual call to the "best time" API here
        try:
            wait_time_data = {
                "bar": {
                    "id": bar_id,
                    "name": bar.name,
                    "address": bar.address
                },
            }

            venue_id = self.create_besttime_forecast(bar)
            wait_time_data['venue_id'] = venue_id
            hour_raw = self.fetch_current_busyness_pct(wait_time_data['venue_id'])
            wait_time_data['current_wait_time'] = self.pct_to_minutes(hour_raw)

            logger.debug(f"Wait time data: {wait_time_data}")

            return Response([wait_time_data['current_wait_time']], status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    def create_besttime_forecast(self, bar):
        """
        Create a new forecast for the given bar using the "best time" API and
        return the new venue ID.
        
        :param bar: The Bar instance to create a forecast for
        :return: The venue ID returned by the "best time" API
        """
        url = "https://besttime.app/api/v1/forecasts"
        resp = requests.post(url, params={
            'api_key_private': settings.BEST_TIME_API_KEY_PRIVATE,
            'venue_name':    bar.name,
            'venue_address': bar.address,
        })
        resp.raise_for_status()
        data = resp.json()
        return data['venue_info']['venue_id']
    
    def fetch_current_busyness_pct(self, venue_id):
        """
        Fetch the current busyness percentage for a given venue using the "best time" API.

        :param venue_id: The ID of the venue for which to fetch the current busyness percentage.
        :return: An integer representing the current busyness percentage (0-100).
        :raises: HTTPError if the request to the API fails.
        """
        url = "https://besttime.app/api/v1/forecasts/now/raw"
        resp = requests.get(url, params={
            'api_key_public': settings.BEST_TIME_API_KEY_PUBLIC,
            'venue_id':       venue_id,
        })
        resp.raise_for_status()
        return resp.json()['analysis']['hour_raw']   # e.g. 0–100
    
    @staticmethod
    def pct_to_minutes(pct, max_wait=60):
        return round(pct/100 * max_wait)



    

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
