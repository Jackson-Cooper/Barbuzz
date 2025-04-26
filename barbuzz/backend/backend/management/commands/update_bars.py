from django.core.management.base import BaseCommand
import googlemaps
from django.conf import settings
from backend.models import Bar
import time

class Command(BaseCommand):
    help = 'Update all bars with details from Google Places API'
    
    def handle(self, *args, **options):
        # Initialize Google Maps client
        gmaps = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)
        
        # Get all bars
        bars = Bar.objects.all()
        self.stdout.write(f"Updating details for {bars.count()} bars...")
        
        # Update each bar
        updated = 0
        for bar in bars:
            try:
                # Fetch details from Google Places API
                place_details = gmaps.place(
                    place_id=bar.place_id,
                    fields=['name', 'formatted_phone_number', 'website', 
                           'opening_hours', 'photo', 'price_level', 'rating']
                ).get('result', {})
                
                # Update photo reference
                if 'photo' in place_details and place_details['photo']:
                    bar.photo_reference = place_details['photo'][0].get('photo_reference')
                
                # Update hours
                if 'opening_hours' in place_details:
                    bar.hours = place_details['opening_hours'].get('weekday_text', [])
                    bar.is_open = place_details['opening_hours'].get('open_now')
                
                # Update other fields
                if 'formatted_phone_number' in place_details:
                    bar.phone_number = place_details['formatted_phone_number']
                
                if 'website' in place_details:
                    bar.website = place_details['website']
                    
                # Save updates
                bar.save()
                updated += 1
                
                # Report progress
                self.stdout.write(f"Updated {bar.name} ({updated}/{bars.count()})")
                
                # Avoid hitting API rate limits
                time.sleep(0.2)
                
            except Exception as e:
                self.stderr.write(f"Error updating {bar.name}: {e}")
        
        self.stdout.write(self.style.SUCCESS(f"Successfully updated {updated} bars"))