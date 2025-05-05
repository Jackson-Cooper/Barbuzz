import googlemaps
import time
from django.core.management.base import BaseCommand
from django.conf import settings
from ...models import Bar

class Command(BaseCommand):
    help = 'Clean up database - remove or mark restaurants and update bar types'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Show what would be done without making changes')
        parser.add_argument('--delete', action='store_true', help='Delete restaurants instead of just marking them')
        parser.add_argument('--limit', type=int, default=0, help='Limit number of bars to process (0 for all)')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        delete_restaurants = options['delete']
        limit = options['limit']
        
        api_key = settings.GOOGLE_MAPS_API_KEY
        if not api_key:
            self.stderr.write('Google Maps API key not found in settings')
            return
            
        gmaps = googlemaps.Client(key=api_key)
        
        # Get all bars or a limited subset
        bars = Bar.objects.all()
        if limit > 0:
            bars = bars[:limit]
            
        total_count = bars.count()
        self.stdout.write(f"Processing {total_count} establishments...")
        
        # Track results
        bar_count = 0
        nightclub_count = 0
        restaurant_count = 0
        error_count = 0
        api_calls = 0
        
        # Process each bar
        for bar in bars:
            try:
                self.stdout.write(f"Checking: {bar.name}")
                
                # If no place_id, we can't verify with Google
                if not bar.place_id:
                    self.stdout.write(f"  - No place_id, skipping")
                    error_count += 1
                    continue
                    
                # Get details from Google Places API
                place_details = gmaps.place(place_id=bar.place_id).get('result', {})
                api_calls += 1
                
                types = place_details.get('types', [])
                self.stdout.write(f"  - Types: {types}")
                
                # Determine if it's a bar, nightclub or restaurant
                is_bar = 'bar' in types
                is_nightclub = 'night_club' in types
                
                # Set the appropriate type
                if is_bar and is_nightclub:
                    new_type = 'bar+nightclub'
                    bar_count += 1
                    nightclub_count += 1
                elif is_bar:
                    new_type = 'bar'
                    bar_count += 1
                elif is_nightclub:
                    new_type = 'nightclub'
                    nightclub_count += 1
                else:
                    new_type = 'restaurant'
                    restaurant_count += 1
                
                # Update or delete as appropriate
                if new_type == 'restaurant':
                    if delete_restaurants:
                        if not dry_run:
                            self.stdout.write(f"  - DELETING: {bar.name} (not a bar/nightclub)")
                            bar.delete()
                        else:
                            self.stdout.write(f"  - Would delete: {bar.name}")
                    else:
                        if not dry_run:
                            bar.type = 'restaurant'
                            bar.save()
                            self.stdout.write(f"  - Marked as restaurant: {bar.name}")
                        else:
                            self.stdout.write(f"  - Would mark as restaurant: {bar.name}")
                else:
                    # It's a bar or nightclub
                    if bar.type != new_type:
                        if not dry_run:
                            bar.type = new_type
                            bar.save()
                            self.stdout.write(f"  - Updated type to {new_type}: {bar.name}")
                        else:
                            self.stdout.write(f"  - Would update type to {new_type}: {bar.name}")
                    else:
                        self.stdout.write(f"  - Already correct type ({new_type}): {bar.name}")
                
                # Don't hit API rate limits
                time.sleep(0.2)
                
            except Exception as e:
                self.stderr.write(f"Error processing {bar.name}: {str(e)}")
                error_count += 1
        
        # Display summary
        self.stdout.write("\nSummary:")
        self.stdout.write(f"Processed {total_count} establishments")
        self.stdout.write(f"Found {bar_count} bars, {nightclub_count} nightclubs, {restaurant_count} restaurants")
        self.stdout.write(f"Encountered {error_count} errors")
        self.stdout.write(f"Made {api_calls} API calls")
        
        estimated_cost = api_calls * 0.0017  # $0.0017 per Details request
        self.stdout.write(f"Estimated API cost: ${estimated_cost:.4f}")
        
        if dry_run:
            self.stdout.write("\nThis was a dry run. No changes were made.")
            self.stdout.write("Run without --dry-run to apply changes.")