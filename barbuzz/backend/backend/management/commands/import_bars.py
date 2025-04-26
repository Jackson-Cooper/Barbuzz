import googlemaps
import time
from django.core.management.base import BaseCommand
from django.conf import settings
from backend.models import Bar

class Command(BaseCommand):
    help = 'Import bars from Google Places API'

    def add_arguments(self, parser):
        parser.add_argument('--location', type=str, default='30.267153,-97.743057', 
                          help='Latitude,longitude coordinates e.g. "30.267153,-97.743057" for Austin')
        parser.add_argument('--radius', type=int, default=5000, 
                          help='Radius in meters (max 50000)')
        parser.add_argument('--limit', type=int, default=100, 
                          help='Maximum number of places to import')

    def handle(self, *args, **options):
        model_fields = [f.name for f in Bar._meta.get_fields()]
        self.stdout.write(f"Available model fields: {model_fields}")
        
        client = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)
        location = options['location']
        radius = min(options['radius'], 50000)
        limit = options['limit']
        
        lat, lng = map(float, location.split(','))
        
        self.stdout.write(f"Searching for bars near {lat}, {lng} within {radius}m")
        
        existing_bars = {bar.place_id: bar for bar in Bar.objects.all() if bar.place_id}
        
        response = client.places_nearby(
            location=(lat, lng),
            radius=radius,
            type='bar'
        )
        
        places_result = response.get('results', [])
        count = 0
        
        self.stdout.write(f"Found {len(places_result)} bars")
        
        for place in places_result:
            place_id = place['place_id']
            
            if place_id in existing_bars:
                self.stdout.write(f"Updating existing bar: {place['name']}")
                bar = existing_bars[place_id]
            else:
                self.stdout.write(f"Creating new bar: {place['name']}")
                bar = Bar(
                    place_id=place_id,
                    name=place['name'],
                    address=place.get('vicinity', ''),
                    latitude=place['geometry']['location']['lat'],
                    longitude=place['geometry']['location']['lng']
                )
            
            # Set rating if available
            if 'rating' in place and 'rating' in model_fields:
                bar.rating = place['rating']
                
            # Set price level if available
            if 'price_level' in place and 'price_level' in model_fields:
                bar.price_level = place['price_level']
                
            try:
                bar.save()
                count += 1
                self.stdout.write(f"Saved bar: {bar.name}")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error saving bar {place['name']}: {str(e)}"))
        
        self.stdout.write(self.style.SUCCESS(f"Successfully imported {count} bars"))