# Multi-stage Dockerfile for Digital Ocean App Platform at root directory

ARG APP=backend

# Backend build and final stage combined
FROM python:3.13.1 as backend

WORKDIR /app

COPY barbuzz/backend/requirements.txt .
RUN pip install -r requirements.txt

COPY barbuzz/backend/ .

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate && gunicorn backend.wsgi:application --bind 0.0.0.0:8080"]

# Frontend build stage
FROM node:18 as frontend-build

WORKDIR /code/
COPY barbuzz/frontend/package*.json ./
RUN npm install
COPY barbuzz/frontend/src ./src
COPY barbuzz/frontend/public ./public
RUN npm run build

# Removed final backend stage since combined with build stage

# Final stage for frontend
FROM node:18-alpine as frontend

WORKDIR /app
RUN npm install -g serve
COPY --from=frontend-build /code/build ./build

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]

# Select final stage based on build argument
FROM ${APP}
