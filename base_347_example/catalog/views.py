from django.shortcuts import render

def catalog_view(request):
    return render(request, "catalog/catalog.html")  # Render a template for the catalog
