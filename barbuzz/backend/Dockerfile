FROM python:3.13.1

WORKDIR /app

COPY barbuzz/backend/requirements.txt .
RUN pip install -r requirements.txt

COPY barbuzz/backend/ .

EXPOSE 8080

CMD ["sh", "-c", "python manage.py migrate && gunicorn backend.wsgi:application --bind 0.0.0.0:8080"]
