import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_saas.settings')
django.setup()

from schools.models import School

print("--- Existing Schools ---")
for school in School.objects.all():
    print(f"ID: {school.id}, Name: {school.name}, Domain: {school.domain}, Status: {school.status}")
