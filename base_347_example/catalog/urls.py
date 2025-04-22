from django.urls import path
from . import views

urlpatterns = [
    path("", views.catalog_view, name="catalog"),  # Add a view for the catalog
]
