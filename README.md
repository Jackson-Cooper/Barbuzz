[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/UNHBYOsR)
# Base 347 Example

cookie cutter for 347

[![Built with Cookiecutter Django](https://img.shields.io/badge/built%20with-Cookiecutter%20Django-ff69b4.svg?logo=cookiecutter)](https://github.com/cookiecutter/cookiecutter-django/)
[![Ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json)](https://github.com/astral-sh/ruff)


## Prereqs

## Getting Started
1. Make sure you have an environment variable called `DJANGO_READ_DOT_ENV_FILE` set to `True` (Search up how to set an environment variable on your OS).
1. create a `.env` file in the root of the project (sibling to this file) and add the following:
    ```env
    DJANGO_SUPERUSER_USERNAME="me"
    DJANGO_SUPERUSER_PASSWORD="me"
    DJANGO_SUPERUSER_EMAIL="me@me.me"
    DATABASE_URL="sqlite:///local.sqlite3"
    ```
1. create a `venv` for this project.
    1. This project's `.gitignore` is set up to ignore the `venv/` folder, so you could put it there as follows, but...
        ```bash
        python -m venv venv
        ```
    2. Dr. Stewart doesn't like `venv`s living in the repos, so his are all elsewhere (e.g. `~/dev/venv-all`)
        ```bash
        python -m venv ~/dev/venv-all/base_347_example
        ```
2. activate your `venv` (don't forget, this varies depending on your OS and shell)
3. if you are running the cookiecutter generator yourself, you may want to do the following (_both of which are already done in the current repo_):
    1. [edit the migration to work with sqlite](https://blog.tafkas.net/2024/04/17/using-cookiecutter-django-with-sqlite/)
    2. add this little cheat where you make a `requirements.txt` in the project root with the following so that the sort of conventional python way of doing requirements (having a requirements.txt file) applies to this project, despite it also following the cookiecutter-django way of doing things where you break the requirements up into different files depending on the environment.
        ```txt
        -r requirements/local.txt

        ```
4. install the requirements for this repo
    ```bash
    pip install -r requirements.txt
    ```
5. run the migrations (because the cookiecutter generator that I ran to help create this repo [or that you ran on your own] already created them)
    ```bash
    python manage.py migrate
    ```
6. create a superuser using the boring values in the `.env` file (we won't use these in "prod")
    ```bash
    python manage.py createsuperuser --no-input
    ```
7. run the server
    ```bash
    python manage.py runserver
    ```
8. go to the admin page and log in with the superuser credentials you just created
    1. http://localhost:8000/admin
9. add a new Social application in the admin interface
    1. for Canvas:
        1. Provider: `Canvas`
        2. Name: `Canvas` (or whatever you want)
        3. Client id: `whatever value you have been told is your canvas "key id"`
        4. Secret key: `whatever value you have been told is your canvas "key"`
        5. Key: `your canvas instance's base URL, e.g. https://canvas.jmu.edu`
        6. Sites: `localhost`
            * note: you will have had to tell your Canvas administrators your site's URL so that they can associate it with your key and secret. consider telling them both of the following for testing:
                1. `http://localhost:8000/accounts/canvas/login/callback/`
                1. `http://127.0.0.1:8000/accounts/canvas/login/callback/`



License: MIT

## Settings

Moved to [settings](https://cookiecutter-django.readthedocs.io/en/latest/1-getting-started/settings.html).

## Basic Commands

### Setting Up Your Users

- To create a **normal user account**, just go to Sign Up and fill out the form. Once you submit it, you'll see a "Verify Your E-mail Address" page. Go to your console to see a simulated email verification message. Copy the link into your browser. Now the user's email should be verified and ready to go.

- To create a **superuser account**, use this command:

      $ python manage.py createsuperuser

For convenience, you can keep your normal user logged in on Chrome and your superuser logged in on Firefox (or similar), so that you can see how the site behaves for both kinds of users.

### Type checks

Running type checks with mypy:

    $ mypy base_347_example

### Test coverage

To run the tests, check your test coverage, and generate an HTML coverage report:

    $ coverage run -m pytest
    $ coverage html
    $ open htmlcov/index.html

#### Running tests with pytest

    $ pytest

### Live reloading and Sass CSS compilation

Moved to [Live reloading and SASS compilation](https://cookiecutter-django.readthedocs.io/en/latest/2-local-development/developing-locally.html#using-webpack-or-gulp).

### Email Server

In development, it is often nice to be able to see emails that are being sent from your application. If you choose to use [Mailpit](https://github.com/axllent/mailpit) when generating the project a local SMTP server with a web interface will be available.

1.  [Download the latest Mailpit release](https://github.com/axllent/mailpit/releases) for your OS.

2.  Copy the binary file to the project root.

3.  Make it executable:

        $ chmod +x mailpit

4.  Spin up another terminal window and start it there:

        ./mailpit

5.  Check out <http://127.0.0.1:8025/> to see how it goes.

Now you have your own mail server running locally, ready to receive whatever you send it.

### Sentry

Sentry is an error logging aggregator service. You can sign up for a free account at <https://sentry.io/signup/?code=cookiecutter> or download and host it yourself.
The system is set up with reasonable defaults, including 404 logging and integration with the WSGI application.

You must set the DSN url in production.

## Deployment

The following details how to deploy this application.
