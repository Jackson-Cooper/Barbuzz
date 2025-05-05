import time
import json
import googlemaps
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone
from ...models import Bar

class Command(BaseCommand):
    help = 'Strategically import bars to minimize API usage'

    def add_arguments(self, parser):
        parser.add_argument('--city', type=str, help='City to import bars from')
        parser.add_argument('--limit', type=int, default=20, help='Number of bars to import')
        parser.add_argument('--estimate', action='store_true', help='Estimate API cost without importing')
        parser.add_argument('--strict-type', action='store_true', help='Only import true bars and nightclubs')


    def handle(self, *args, **options):
        city = options['city']
        limit = min(options['limit'], 20) 
        estimate_only = options['estimate']
        strict_type = options['strict_type']
        
        if not city:
            self.stderr.write('Please provide a city')
            return
            
        # Cost tracking
        places_search_calls = 0
        places_details_calls = 0
        
        self.stdout.write(f"{'Estimating cost for' if estimate_only else 'Importing'} up to {limit} bars from {city}")
        
        # For ANY operation, we need these API calls:
        # 1. One places text search call to find bars in the city
        places_search_calls += 1
        
        # 2. Up to 'limit' place details calls 
        if estimate_only:
            places_details_calls += limit
        else:
            # Get API key from Django settings
            api_key = settings.GOOGLE_MAPS_API_KEY
            
            # Verify API key is available
            if not api_key:
                self.stderr.write('Google Maps API key not found in settings')
                return
                
            # Actual implementation for importing
            try:
                gmaps = googlemaps.Client(key=api_key)
                
                # Direct text search for bars in the city - no geocoding needed!
                search_query = f"bars in {city}"
                self.stdout.write(f"Searching for: {search_query}")
                
                places_result = gmaps.places(query=f"bars in {city}", type="bar")
                places_search_calls += 1

                # Also search for nightclubs
                nightclub_result = gmaps.places(query=f"nightclubs in {city}", type="night_club")
                places_search_calls += 1

                # Combine and deduplicate results
                results = []
                place_ids = set()

                for place in places_result.get('results', []) + nightclub_result.get('results', []):
                    if place.get('place_id') not in place_ids:
                        place_ids.add(place.get('place_id'))
                        results.append(place)

                self.stdout.write(f"Found {len(results)} potential bars/nightclubs in {city}")
                
                from ...models import Bar
                processed_ids = set(Bar.objects.values_list('place_id', flat=True))
                imported_count = 0
                
                # Process results
                for place in results[:limit]:
                    place_id = place.get('place_id')
                    
                    if place_id in processed_ids:
                        self.stdout.write(f"Bar already exists: {place.get('name')}")
                        continue
                    
                    # Get details
                    place_details = gmaps.place(place_id=place_id).get('result', {})
                    places_details_calls += 1
                    
                    name = place_details.get('name', 'Unknown Bar')
                    
                    # Check if it's actually a bar or nightclub
                    types = place_details.get('types', [])
                    if strict_type:
                        if 'bar' not in types and 'night_club' not in types:
                            self.stdout.write(f"Skipping non-bar: {name}")
                            continue
                    
                    # Determine the correct bar type
                    bar_type = 'other'
                    if 'bar' in types and 'night_club' in types:
                        bar_type = 'bar+nightclub'
                    elif 'bar' in types:
                        bar_type = 'bar'
                    elif 'night_club' in types:
                        bar_type = 'nightclub'
                    else:
                        # Not a bar or nightclub, skip it
                        self.stdout.write(f"Skipping non-bar place: {name} (types: {types})")
                        continue
                    
                    location = place_details.get('geometry', {}).get('location', {})
                    latitude = location.get('lat')
                    longitude = location.get('lng')
                    
                    if not (name and latitude and longitude):
                        continue
                    
                    address = place_details.get('formatted_address', '')
                    phone = place_details.get('formatted_phone_number', '')
                    website = place_details.get('website', '')
                    
                    hours_data = place_details.get('opening_hours', {}).get('periods', [])
                    hours = json.dumps(hours_data) if hours_data else None
                    
                    rating = place_details.get('rating')
                    price_level = place_details.get('price_level')
                    
                    # Create bar with proper type
                    bar = Bar(
                        place_id=place_id,
                        name=name,
                        address=address,
                        latitude=latitude,
                        longitude=longitude,
                        phone_number=phone,
                        website=website,
                        hours=hours,
                        price_level=price_level,
                        rating=rating,
                        type=bar_type 
                    )
                    bar.save()
                    imported_count += 1
                    
                    self.stdout.write(f'Imported: {name}')
                    
                    # Be nice to the API
                    time.sleep(0.2)
                
                self.stdout.write(self.style.SUCCESS(f'Successfully imported {imported_count} bars'))
                
            except Exception as e:
                self.stderr.write(f'Error: {str(e)}')
        
        # Calculate and display cost - updated cost structure
        places_search_cost = places_search_calls * 0.0032  # Text Search costs $0.0032 per call
        places_details_cost = places_details_calls * 0.0017  # Details costs $0.0017 per call
        total_cost = places_search_cost + places_details_cost
        
        self.stdout.write("\nAPI Usage Estimate:")
        self.stdout.write(f"Places Text Search API calls: {places_search_calls} (${places_search_cost:.4f})")
        self.stdout.write(f"Places Details API calls: {places_details_calls} (${places_details_cost:.4f})")
        self.stdout.write(f"Total estimated cost: ${total_cost:.4f}")