# Production multi-stage Dockerfile for Digital Ocean App Platform

ARG APP=backend

# Backend build stage
FROM python:3.13.1 as backend-build

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY backend/ .

# Frontend build stage
FROM node:18 as frontend-build

WORKDIR /code/
COPY frontend/package*.json ./
RUN npm install
COPY frontend/src ./src
COPY frontend/public ./public
RUN npm run build

# Final stage for backend
FROM python:3.13.1 as backend

WORKDIR /app

COPY --from=backend-build /app /app

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate && gunicorn backend.wsgi:application --bind 0.0.0.0:8000"]

# Final stage for frontend
FROM node:18-alpine as frontend

WORKDIR /app
RUN npm install -g serve
COPY --from=frontend-build /code/build ./build

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]

# Select final stage based on build argument
FROM ${APP}
