Backend Django project for the WMS system.

Quick start (dev):

1. Create a virtualenv and install requirements:

   python -m venv .venv
   source .venv/bin/activate
   pip install -r backend/requirements.txt

2. Create a `.env` from `.env.example` and configure DB credentials.

3. Run migrations and create a superuser:

   python backend/manage.py makemigrations
   python backend/manage.py migrate
   python backend/manage.py createsuperuser

4. Run the development server:

   python backend/manage.py runserver
