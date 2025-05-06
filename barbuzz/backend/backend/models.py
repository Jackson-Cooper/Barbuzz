import logging
from django.db import models
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import F, ExpressionWrapper, FloatField
import math
from math import radians, sin, cos, sqrt, asin
from .utils import haversine_distance

logger = logging.getLogger(__name__)


class BarManager(models.Manager):
    def get_only_bars(self):
        """
        Returns only establishments that are actual bars or nightclubs.
        """
        return self.filter(
            models.Q(type='bar') | 
            models.Q(type='nightclub') | 
            models.Q(type='bar+nightclub')
        )
    
    def search_by_query(self, query):
        """
        Search bars with text filtering and type filtering combined.
        """
        return self.get_only_bars().filter(
            models.Q(name__icontains=query) | 
            models.Q(address__icontains=query) | 
            models.Q(description__icontains=query)
        )
    
    def nearby(self, lat, lng, radius=5000):
        """
        Get bars near a location with Python-based distance calculation.
        
        Args:
            lat (float): Latitude of the location.
            lng (float): Longitude of the location.
            radius (int, optional): Radius in meters to search within. Defaults to 5000.
        
        Returns:
            list: Sorted list of bars within the radius, each with a 'distance' attribute in miles.
        """
        try:
            # Validate coordinates
            if not (lat and lng):
                return self.none() 
                
            # Convert radius from meters to kilometers
            radius_km = radius / 1000
            
            # Calculate bounding box for initial filtering
            lat_range = radius_km / 111  
            lng_range = radius_km / (111 * math.cos(math.radians(lat)))
            
            # Filter bars within bounding box
            queryset = self.get_only_bars().filter(
                latitude__gte=lat - lat_range,
                latitude__lte=lat + lat_range,
                longitude__gte=lng - lng_range,
                longitude__lte=lng + lng_range
            )
            
            bars_with_distance = []
            for bar in queryset:
                distance = haversine_distance(lat, lng, bar.latitude, bar.longitude)
                
                # Check if bar is within radius
                if distance <= radius_km:
                    # Store distance in miles for display
                    bar.distance = distance * 0.621371  
                    bars_with_distance.append(bar)
            
            # Sort bars by distance
            return sorted(bars_with_distance, key=lambda x: x.distance)
            
        except Exception as e:
            logger.error(f"Error in nearby calculation: {str(e)}")
            return self.none()
    
class Bar(models.Model):
    place_id = models.CharField(max_length=100, unique=True) 
    name = models.CharField(max_length=100)
    address = models.CharField(max_length=200)
    latitude = models.FloatField()
    longitude = models.FloatField()
    
    phone_number = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    description = models.TextField(blank=True)
    hours = models.JSONField(blank=True, null=True) 
    photo_reference = models.CharField(max_length=1000, blank=True, help_text="Reference token for retrieving a photo via Google Places API")
    price_level = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Price level from 0 (free) to 4 (very expensive)")
    rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True, help_text="Average rating from Google (e.g., 4.3)")
    type = models.CharField(max_length=50, default='bar')
    is_open = models.BooleanField(default=False, help_text="Is the bar currently open?")

    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    objects = BarManager()

    def __str__(self):
        return self.name
    
    @property
    def current_wait(self):
        """
        Returns the latest estimated wait time for the bar.
        """
        latest_wait = self.wait_times.order_by('-timestamp').first()
        return latest_wait.estimated_wait if latest_wait else None

class WaitTime(models.Model):
    bar = models.ForeignKey(Bar, on_delete=models.CASCADE, related_name='wait_times')
    timestamp = models.DateTimeField(auto_now_add=True)
    estimated_wait = models.PositiveIntegerField(help_text="Estimated wait time in minutes")

    def __str__(self):
        return f"{self.bar.name} - {self.timestamp}"

class UserProfile(models.Model):
    user = models.OneToOneField(get_user_model(), on_delete=models.CASCADE)

    def __str__(self):
        return self.user.username
    
class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    bar = models.ForeignKey(Bar, on_delete=models.CASCADE, related_name='favorited_by')
    
    class Meta:
        unique_together = ('user', 'bar')

@receiver(post_save, sender=get_user_model())
def create_user_profile(sender, instance, created, **kwargs):
    """
    Signal to create a UserProfile instance when a new user is created.
    """
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=get_user_model())
def save_user_profile(sender, instance, **kwargs):
    """
    Signal to save the UserProfile instance when the user is saved.
    """
    instance.userprofile.save()
