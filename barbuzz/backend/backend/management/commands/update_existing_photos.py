import googlemaps
import time
from django.core.management.base import BaseCommand
from django.conf import settings
from ...models import Bar

class Command(BaseCommand):
    help = 'Update photo references for bars that do not have them'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Show what would be updated without making changes')
        parser.add_argument('--limit', type=int, default=20, help='Maximum number of bars to update')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        limit = options['limit']
        
        # Initialize Google Maps client
        gmaps = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)
        
        # Get bars without photo references but with place IDs
        bars_to_update = Bar.objects.filter(
            photo_reference='',
            place_id__isnull=False
        ).exclude(place_id='')[:limit]
        
        count = bars_to_update.count()
        self.stdout.write(f"Found {count} bars without photos")
        
        updated = 0
        for bar in bars_to_update:
            self.stdout.write(f"Processing: {bar.name}")
            
            try:
                # Get place details including photos
                place_details = gmaps.place(place_id=bar.place_id).get('result', {})
                
                # Extract photo reference
                photos = place_details.get('photos', [])
                if photos and len(photos) > 0:
                    photo_reference = photos[0].get('photo_reference')
                    
                    if photo_reference:
                        self.stdout.write(f"  Found photo for: {bar.name}")
                        
                        if not dry_run:
                            bar.photo_reference = photo_reference
                            bar.save()
                            updated += 1
                        else:
                            self.stdout.write(f"  Would update: {bar.name}")
                            updated += 1
                else:
                    self.stdout.write(f"  No photos found for: {bar.name}")
                
                # Be nice to the API
                time.sleep(0.2)
                
            except Exception as e:
                self.stderr.write(f"  Error updating {bar.name}: {str(e)}")
        
        if dry_run:
            self.stdout.write(self.style.SUCCESS(f"Would update {updated} bars (dry run)"))
        else:
            self.stdout.write(self.style.SUCCESS(f"Updated {updated} bars"))