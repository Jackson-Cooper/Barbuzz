.PHONY: up
up:
	docker-compose up -d

.PHONY: down
down:
	docker-compose down

.PHONY: runserver
runserver:
	docker-compose exec backend sh -c 'python manage.py runserver 0.0.0.0:8000'

.PHONY: migrate
migrate:
	docker-compose exec backend sh -c 'python manage.py migrate'

.PHONY: makemigrations
makemigrations:
	docker-compose exec backend sh -c 'python manage.py makemigrations'

.PHONY: createsuperuser
createsuperuser:
	docker-compose exec backend sh -c 'python manage.py createsuperuser'

.PHONY: shell
shell:
	docker-compose exec backend sh -c 'python manage.py shell'

.PHONY: test
test:
	docker-compose exec backend sh -c 'python manage.py test'

.PHONY: logs
logs:
	docker-compose logs -f

.PHONY: clean
clean:
	docker-compose down -v
