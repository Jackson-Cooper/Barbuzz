from django.core.management.base import BaseCommand
import googlemaps
from django.conf import settings
from backend.models import Bar
import time

class Command(BaseCommand):
    help = 'Remove establishments that are not actual bars'
    
    def handle(self, *args, **options):
        # Initialize Google Maps client
        gmaps = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)
        
        # Get all bars
        establishments = Bar.objects.all()
        self.stdout.write(f"Checking {establishments.count()} establishments...")
        
        # Check each establishment
        non_bars_removed = 0
        for establishment in establishments:
            try:
                # Fetch place details from Google
                place_details = gmaps.place(
                    place_id=establishment.place_id,
                    fields=['types']
                ).get('result', {})
                
                # Get place types
                place_types = place_details.get('types', [])
                establishment.place_types = place_types  # Store types in the model
                
                # Check if it's a bar
                is_bar = 'bar' in place_types or 'night_club' in place_types
                
                if not is_bar:
                    self.stdout.write(f"Removing non-bar: {establishment.name} (types: {place_types})")
                    establishment.delete()
                    non_bars_removed += 1
                else:
                    establishment.establishment_type = 'bar'
                    establishment.save()
                
                # Avoid rate limits
                time.sleep(0.2)
                
            except Exception as e:
                self.stderr.write(f"Error checking {establishment.name}: {e}")
        
        self.stdout.write(self.style.SUCCESS(f"Removed {non_bars_removed} non-bar establishments"))