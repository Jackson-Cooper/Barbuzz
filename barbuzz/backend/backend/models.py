from django.db import models
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

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
    photo_reference = models.CharField(max_length=255, blank=True, help_text="Reference token for retrieving a photo via Google Places API")
    price_level = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Price level from 0 (free) to 4 (very expensive)")
    rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True, help_text="Average rating from Google (e.g., 4.3)")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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
    favorite_bars = models.ManyToManyField(Bar, blank=True)

    def __str__(self):
        return self.user.username
    
class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    bar = models.ForeignKey(Bar, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'bar')

@receiver(post_save, sender=get_user_model())
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=get_user_model())
def save_user_profile(sender, instance, **kwargs):
    instance.userprofile.save()
