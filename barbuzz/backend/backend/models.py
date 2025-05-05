from django.db import models
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import F, ExpressionWrapper, FloatField
import math
from math import radians, sin, cos, sqrt, asin


class BarManager(models.Manager):
    def get_only_bars(self):
        """Returns only establishments that are actual bars or nightclubs"""
        return self.filter(
            models.Q(type='bar') | 
            models.Q(type='nightclub') | 
            models.Q(type='bar+nightclub')
        )
    
    def search_by_query(self, query):
        """Search bars with text filtering and type filtering combined"""
        return self.get_only_bars().filter(
            models.Q(name__icontains=query) | 
            models.Q(address__icontains=query) | 
            models.Q(description__icontains=query)
        )
    
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
    
    def nearby(self, lat, lng, radius=5000):
        """Get bars near a location with Python-based distance calculation"""
        try:
            # First, check if we have valid coordinates
            if not (lat and lng):
                return self.none()  # Return empty queryset
                
            # Convert radius from meters to kilometers
            radius_km = radius / 1000
            
            # For efficient initial filtering, use a bounding box
            lat_range = radius_km / 111  # 1 degree ~ 111km
            lng_range = radius_km / (111 * math.cos(math.radians(lat)))
            
            # Get bars within the bounding box
            queryset = self.get_only_bars().filter(
                latitude__gte=lat - lat_range,
                latitude__lte=lat + lat_range,
                longitude__gte=lng - lng_range,
                longitude__lte=lng + lng_range
            )
            
            # Calculate actual distances in Python instead of trying to do it in the database
            bars_with_distance = []
            for bar in queryset:
                distance = self.haversine_distance(lat, lng, bar.latitude, bar.longitude)
                
                # Convert to kilometers for comparison
                if distance <= radius_km:
                    # Store the distance in miles for display
                    bar.distance = distance * 0.621371  # km to miles
                    bars_with_distance.append(bar)
            
            # Sort by distance
            return sorted(bars_with_distance, key=lambda x: x.distance)
            
        except Exception as e:
            # Log the error and return empty queryset
            print(f"Error in nearby calculation: {str(e)}")
            return self.none()
            
        except Exception as e:
            # Log the error and return empty queryset
            print(f"Error in nearby calculation: {str(e)}")
            return self.none()
    
class Bar(models.Model):
    place_id = models.CharField(max_length=100, unique=True)  # From Google Places
    name = models.CharField(max_length=100)
    address = models.CharField(max_length=200)
    latitude = models.FloatField()
    longitude = models.FloatField()
    
    phone_number = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    description = models.TextField(blank=True)
    hours = models.JSONField(blank=True, null=True)  # Store hours as structured data
    photo_reference = models.CharField(max_length=1000, blank=True, help_text="Reference token for retrieving a photo via Google Places API")
    price_level = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Price level from 0 (free) to 4 (very expensive)")
    rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True, help_text="Average rating from Google (e.g., 4.3)")
    type = models.CharField(max_length=50, default='bar')

    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    objects = BarManager()

    def __str__(self):
        return self.name
    
    @property
    def current_wait(self):
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
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=get_user_model())
def save_user_profile(sender, instance, **kwargs):
    instance.userprofile.save()
