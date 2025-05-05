import json
import googlemaps
import time
from django.core.management.base import BaseCommand
from django.conf import settings
from ...models import Bar

class Command(BaseCommand):
    help = 'Fix hours data format for existing bars'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Show what would be changed without making changes')
        parser.add_argument('--limit', type=int, default=0, help='Maximum bars to process (0 for all)')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        limit = options['limit']
        
        # Get all bars or limited subset
        bars = Bar.objects.all()
        if limit > 0:
            bars = bars[:limit]
            
        total = bars.count()
        fixed = 0
        errors = 0
        api_calls = 0
        
        self.stdout.write(f"Checking hours data for {total} bars...")
        
        # Set up Google Maps client
        gmaps = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)
        
        for bar in bars:
            try:
                # Check if hours field needs fixing
                needs_fixing = False
                try:
                    if bar.hours:
                        json.loads(bar.hours)
                    else:
                        needs_fixing = True  # Empty or null hours
                except (json.JSONDecodeError, TypeError):
                    needs_fixing = True  # Invalid JSON
                
                if needs_fixing:
                    self.stdout.write(f"Fixing hours for: {bar.name}")
                    
                    # Get fresh hours data from Google Places API
                    if not dry_run:
                        try:
                            place_details = gmaps.place(place_id=bar.place_id).get('result', {})
                            api_calls += 1
                            
                            hours_data = place_details.get('opening_hours', {}).get('periods', [])
                            if hours_data:
                                bar.hours = json.dumps(hours_data)
                                bar.save()
                                fixed += 1
                                self.stdout.write(f"  - Fixed hours for {bar.name}")
                            else:
                                self.stdout.write(f"  - No hours data available for {bar.name}")
                                
                            # Be nice to the API
                            time.sleep(0.2)
                        except Exception as api_error:
                            self.stderr.write(f"  - API error for {bar.name}: {str(api_error)}")
                            errors += 1
                    else:
                        self.stdout.write(f"  - Would fix hours for {bar.name}")
                        fixed += 1
                
            except Exception as e:
                self.stderr.write(f"Error processing {bar.name}: {str(e)}")
                errors += 1
        
        self.stdout.write("\nSummary:")
        self.stdout.write(f"Checked {total} bars")
        self.stdout.write(f"Fixed (or would fix): {fixed} bars")
        self.stdout.write(f"Errors: {errors}")
        self.stdout.write(f"API calls: {api_calls}")
        
        if dry_run:
            self.stdout.write("\nThis was a dry run. Run without --dry-run to apply changes.")