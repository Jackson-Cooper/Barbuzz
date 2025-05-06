"""
Utility functions for the Barbuzz application.

Contains helper functions that are used across multiple parts of the application,
including geographic calculations and other shared functionality.
"""

import math

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Uses the Haversine formula to compute the distance between two
    geographic coordinates in kilometers.
    
    Args:
        lat1 (float): Latitude of the first point in decimal degrees
        lon1 (float): Longitude of the first point in decimal degrees
        lat2 (float): Latitude of the second point in decimal degrees
        lon2 (float): Longitude of the second point in decimal degrees
    
    Returns:
        float: Distance between the points in kilometers
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    r = 6371  
    
    return c * r