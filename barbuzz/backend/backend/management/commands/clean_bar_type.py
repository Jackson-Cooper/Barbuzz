from django.core.management.base import BaseCommand
from backend.models import Bar

class Command(BaseCommand):
    help = 'Properly categorize establishments as bars or restaurants'
    
    def handle(self, *args, **options):
        # Restaurant keywords
        restaurant_keywords = [
            'qdoba', 'mexican', 'thai', 'chili', 'outback', 'steakhouse', 
            'grill', 'restaurant', 'food', 'eatery', 'diner', 'cafe', 
            'coffee', 'pizza', 'burger', 'steak'
        ]
        
        # Bar keywords
        bar_keywords = [
            'bar', 'pub', 'brewery', 'ale', 'beer', 'tavern', 'lounge',
            'drink', 'cocktail', 'wine', 'spirit', 'nightclub', 'hideaway',
            'brew', 'liquor', 'saloon'
        ]
        
        restaurants_found = 0
        bars_found = 0
        
        # Process each establishment
        for place in Bar.objects.all():
            name = place.name.lower()
            
            # Check if it's a restaurant
            if any(keyword in name for keyword in restaurant_keywords):
                place.type = 'restaurant'
                place.save()
                self.stdout.write(f"Categorized as restaurant: {place.name}")
                restaurants_found += 1
                continue
                
            # Check if it's a bar
            if any(keyword in name for keyword in bar_keywords):
                place.type = 'bar'
                place.save()
                self.stdout.write(f"Confirmed as bar: {place.name}")
                bars_found += 1
                continue
                
            # For uncertain places, check for specific restaurant names
            known_restaurants = ['QDOBA', 'Taste of Thai', "Chili's", 'Outback']
            if any(place.name.startswith(name) for name in known_restaurants):
                place.type = 'restaurant'
                place.save()
                self.stdout.write(f"Categorized as known restaurant: {place.name}")
                restaurants_found += 1
            
        self.stdout.write(self.style.SUCCESS(
            f"Categorized {restaurants_found} restaurants and confirmed {bars_found} bars"
        ))