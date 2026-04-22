"""
WSGI config for school_saas project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_saas.settings')

# Run migrations automatically for Vercel SQLite
from django.core.management import call_command
from django.core.wsgi import get_wsgi_application
import django

django.setup()
try:
    call_command('migrate', interactive=False)
except Exception as e:
    print(f"Migration failed: {e}")

application = get_wsgi_application()
