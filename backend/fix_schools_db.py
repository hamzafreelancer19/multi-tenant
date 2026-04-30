import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_saas.settings')
django.setup()

from schools.models import School
from core.tenant_db_creator import create_tenant_database

def fix_all_schools():
    schools = School.objects.all()
    print(f"Found {len(schools)} schools. Checking databases...")
    for school in schools:
        print(f"Processing School: {school.name} (DB: {school.database_name})")
        success = create_tenant_database(school)
        if success:
            print(f"SUCCESS: Database for {school.name} is ready.")
        else:
            print(f"FAILED: Could not prepare database for {school.name}.")

if __name__ == "__main__":
    fix_all_schools()
