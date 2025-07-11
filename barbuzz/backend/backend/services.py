"""
Service classes for external API interactions.
"""

import logging
import requests
import googlemaps
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

class PlacesService:
    """
    Handles interactions with Google Places API.
    """
    
    def __init__(self):
        """Initialize the service with Google Maps API client."""
        logger.debug(
            "Initializing PlacesService with Google Maps API key: %s",
            settings.GOOGLE_MAPS_API_KEY,
        )
        self.client = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)

    def search_nearby(self, lat, lng, radius=5000, limit=12):
        """Search for bars near a location with caching."""
        cache_key = f"nearby_{lat}_{lng}_{radius}_{limit}"
        cached = cache.get(cache_key)
        if cached is not None:
            logger.info("Cache hit for %s", cache_key)
            return cached
        try:
            resp = self.client.places_nearby(
                location=(lat, lng), radius=radius, type="bar"
            )
            results = resp.get("results", [])[:limit]
            cache.set(cache_key, results, timeout=900)
            logger.info(
                "Fetched %d nearby bars from API and cached under %s",
                len(results),
                cache_key,
            )
            return results
        except Exception as e:
            logger.error("Error fetching nearby bars: %s", e)
            return []

    def search_text(self, query, limit=12):
        """Search for bars by text using Google Places."""
        cache_key = f"text_{query}_{limit}"
        cached = cache.get(cache_key)
        if cached is not None:
            logger.info("Cache hit for %s", cache_key)
            return cached
        try:
            resp = self.client.places(query=query, type="bar")
            results = resp.get("results", [])[:limit]
            cache.set(cache_key, results, timeout=900)
            logger.info(
                "Fetched %d bars by text from API and cached under %s",
                len(results),
                cache_key,
            )
            return results
        except Exception as e:
            logger.error("Error fetching bars by text: %s", e)
            return []
    
    def get_place_details(self, place_id):
        """
        Fetch detailed information about a place from Google Places API.
        
        Args:
            place_id (str): Google Places ID
            
        Returns:
            dict: Place details
        """
        cache_key = f"place_details_{place_id}"
        cached_data = cache.get(cache_key)
        if cached_data:
            logger.info("Cache hit for place details %s", place_id)
            return cached_data
        try:
            data = self.client.place(place_id=place_id).get("result", {})
            cache.set(cache_key, data, timeout=600)  # Cache for 10 minutes
            logger.info("Fetched place details for %s from API and cached", place_id)
            return data
        except Exception as e:
            logger.error("Error fetching place details: %s", e)
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
        try:
            resp = requests.post(
                url,
                params={
                    "api_key_private": settings.BEST_TIME_API_KEY_PRIVATE,
                    "venue_name": bar.name,
                    "venue_address": bar.address,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            logger.info("Created forecast for bar '%s'", bar.name)
            return data["venue_info"]["venue_id"]
        except Exception as e:
            logger.error("Failed to create forecast: %s", e)
            return None
    
    @staticmethod
    def get_current_busyness(venue_id):
        """
        Get current busyness percentage for a venue.
        
        Args:
            venue_id (str): Best Time venue ID
            
        Returns:
            float: Current busyness percentage
        """
        cache_key = f"busyness_{venue_id}"
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            logger.info(f"Cache hit for busyness data for venue_id: {venue_id}")
            return cached_data
        logger.info(f"Cache miss for busyness data for venue_id: {venue_id}. Fetching from API.")
        url = "https://besttime.app/api/v1/forecasts/now/raw"
        try:
            resp = requests.get(
                url,
                params={
                    "api_key_public": settings.BEST_TIME_API_KEY_PUBLIC,
                    "venue_id": venue_id,
                },
            )
            resp.raise_for_status()
            data = resp.json()["analysis"]["hour_raw"]
            cache.set(cache_key, data, timeout=300)  # Cache for 5 minutes
            logger.info("Fetched busyness for venue_id %s and cached", venue_id)
            return data
        except Exception as e:
            logger.error("Error fetching current busyness: %s", e)
            return None
    
    @staticmethod
    def convert_percentage_to_minutes(percentage, max_wait=90):
        """
        Convert busyness percentage to estimated wait time.
        
        Args:
            percentage (float): Busyness percentage (0-100)
            max_wait (int): Maximum possible wait time in minutes
            
        Returns:
            int: Estimated wait time in minutes
        """
        return round(percentage / 100 * max_wait)
