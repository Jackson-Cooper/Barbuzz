# Base 347 Example

cookie cutter for 347

[![Built with Cookiecutter Django](https://img.shields.io/badge/built%20with-Cookiecutter%20Django-ff69b4.svg?logo=cookiecutter)](https://github.com/cookiecutter/cookiecutter-django/)
[![Ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json)](https://github.com/astral-sh/ruff)


## Prereqs

## Getting Started
1. If you are view the source code for this file, it's written in markdown syntax.
    * So when copying the code through these steps, you should be aware that backticks are used in markdown to denote inline code blocks and triple backticks are used to denote larger code blocks. (So you are not intended to include those backticks when copying the code into your project)
        * Sometimes the larger code blocks have an optional syntax hint (e.g. the step about the venv below has `bash` as the syntax hint, but this doesn't mean that you have to be in bash, it just means on the command line).
    * It might be easier to follow these instructions as rendered in your browser at your repo's github URL. If you're using vscode you may be able to ask it to render a preview of the markdown file, but this won't be as nice as the github.com rendering where it provides the convenient 1-click copy button.
1. If you don't have it already because of another class or project, install [postgres](https://www.postgresql.org/) (it's a database server).  
    1. After installing postgres, restart your computer.
    1. after restarting, check if `pg_config` is on your path by running the following command in your terminal. The desired outcome of running the following command is that a path to `pg_config` is printed to the terminal. If there is no output, or an error message is printed, you will need to add the path to `pg_config` to your path.
        * windows (in powershell): `where pg_config`
        * NOT windows: `which pg_config`
    1. if you need to add the path to `pg_config` to your path:
        * windows:
            1. open the start menu and search for "environment variables"
            1. click on "Edit the system environment variables"
            1. click on "Environment Variables..."
            1. in the "System variables" section, find the variable called "Path" and click on it
            1. click "Edit..."
            1. click "New"
            1. paste the path to the directory containing `pg_config` (e.g. please don't paste this until you confirm it is correct on your computer! `C:\Program Files\PostgreSQL\17\bin`)
            1. click "OK" on all the windows you've opened
            1. restart your computer
        * not windows:
            * edit your shell's profile file (e.g. `~/.bashrc` or `~/.zshrc`, if you're not sure which shell you're using run `echo $0` to find out) and add the following line to the end of the file (I edit this file with vscode by running `code ~/.zshrc`):
                ```bash
                export PATH=$PATH:/path/to/directory/containing/pg_config
                ```
1. Make sure you have an environment variable called `DJANGO_READ_DOT_ENV_FILE` set to `True` (Search up how to set an environment variable on your OS).
    1. I can't tell that this is working as I'd hoped for all students' environments. If your `base.py` has `READ_DOT_ENV_FILE = env.bool("DJANGO_READ_DOT_ENV_FILE", default=False)`, consider changing it to `True`.
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
2. activate your `venv` (don't forget, how to do this varies depending on your OS and shell)
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
        2. Provider ID: whatever you want, I put `CanvasJMU` in mine.
        2. Name: `Canvas` (or whatever you want)
        3. Client id: whatever value you have been told is your canvas "key id", see e.g. [Temporary Canvas API info](https://canvas.jmu.edu/courses/2071285/pages/temporary-canvas-api-info)
        4. Secret key: whatever value you have been told is your canvas "key", see e.g. [Temporary Canvas API info](https://canvas.jmu.edu/courses/2071285/pages/temporary-canvas-api-info)
        5. Key: your canvas instance's base URL, e.g. `https://canvas.jmu.edu`
        6. Sites: `localhost`
            * note: (I have already done this for now, but in case someone's doing this on their own...) you will have had to tell your Canvas administrators your site's callback URL so that they can associate it with your key and secret. consider telling them both of the following for testing:
                1. `http://localhost:8000/accounts/canvas/login/callback/`
                1. `http://127.0.0.1:8000/accounts/canvas/login/callback/`
10. You're done setting up! 🏆 run the server and try to login via Canvas, try to login to the django admin site, build your project!

## EVERYTHING BELOW HERE IS RATHER GENERIC AND JUST KEPT FOR YOUR REFERENCE FROM THE COOKIE CUTTER DJANGO REFERENCE


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