# Barbuzz

Barbuzz is an application for discovering local bars, checking wait times, and finding information about venues near you.

# Structure

barbuzz/
├── backend/               # Django project
│   ├── backend/           # Main app
│   │   ├── __init__.py
│   │   ├── asgi.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── views.py
│   │   └── wsgi.py
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/              # React app
│   ├── public/
│   │   ├── index.html
│   │   └── assets/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   ├── package-lock.json
│   └── Dockerfile
├── docker-compose.yml     # Docker configuration
└── README.md              

## Installation

Backend Setup:
cd backend
pip install -r requirements.txt
docker-compose up -d
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py runserver

Frontend Setup:
cd frontend
npm install

Docker Setup:
docker-compose build
docker-compose up

API Endpoints:
Bars: /api/bars/
Wait Times: /api/wait-times/
User Profiles: /api/user-profiles/
Authentication: /auth/

## Features

Bar Search: Find bars near your location with advanced filtering options
Real-time Wait Times: See how busy a bar is before you go
Favorites: Save your favorite bars for quick access
Bar Details: View hours, ratings, prices, and other information

Tech Stack:
Frontend: React, TailwindCSS
Backend: Django, Django REST Framework
Database: PostgreSQL
API Integration: Google Places API, Best Time API
Authentication: Token-based authentication