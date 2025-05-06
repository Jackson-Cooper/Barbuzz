"""
Service classes for external API interactions.
"""

import json
import logging
import requests
import googlemaps
from django.conf import settings

logger = logging.getLogger(__name__)

class PlacesService:
    """
    Handles interactions with Google Places API.
    """
    
    def __init__(self):
        """Initialize the service with Google Maps API client."""
        logger.debug("Initializing PlacesService with Google Maps API key: {settings.GOOGLE_MAPS_API_KEY}")
        self.client = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)
    
    def get_place_details(self, place_id):
        """
        Fetch detailed information about a place from Google Places API.
        
        Args:
            place_id (str): Google Places ID
            
        Returns:
            dict: Place details
        """
        try:
            return self.client.place(place_id=place_id).get('result', {})
        except Exception as e:
            logger.error(f"Error fetching place details: {str(e)}")
            return {}

class WaitTimeService:
    """
    Handles interactions with Best Time API for wait time predictions.
    """
    
    @staticmethod
    def create_forecast(bar):
        """
        Create a forecast for a bar using the Best Time API.
        
        Args:
            bar (Bar): Bar instance
            
        Returns:
            str: Venue ID from Best Time API or None if not found
        """
        url = "https://besttime.app/api/v1/forecasts"
        resp = requests.post(url, params={
            'api_key_private': settings.BEST_TIME_API_KEY_PRIVATE,
            'venue_name': bar.name,
            'venue_address': bar.address,
        })
        resp.raise_for_status()
        data = resp.json()
        return data['venue_info']['venue_id']
    
    @staticmethod
    def get_current_busyness(venue_id):
        """
        Get current busyness percentage for a venue.
        
        Args:
            venue_id (str): Best Time venue ID
            
        Returns:
            float: Current busyness percentage
        """
        url = "https://besttime.app/api/v1/forecasts/now/raw"
        resp = requests.get(url, params={
            'api_key_public': settings.BEST_TIME_API_KEY_PUBLIC,
            'venue_id': venue_id,
        })
        resp.raise_for_status()
        return resp.json()['analysis']['hour_raw']
    
    @staticmethod
    def convert_percentage_to_minutes(percentage, max_wait=60):
        """
        Convert busyness percentage to estimated wait time.
        
        Args:
            percentage (float): Busyness percentage (0-100)
            max_wait (int): Maximum possible wait time in minutes
            
        Returns:
            int: Estimated wait time in minutes
        """
        return round(percentage / 100 * max_wait)