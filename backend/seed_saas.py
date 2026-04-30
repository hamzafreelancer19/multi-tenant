import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_saas.settings')
django.setup()

from schools.models import School
from users.models import User
from students.models import Student
from teachers.models import Teacher
from core.tenant_db_creator import create_tenant_database

def seed_data():
    # 1. Create a School
    school, created = School.objects.get_or_create(
        code="BFA001",
        defaults={
            "name": "Bright Future Academy",
            "status": "Approved",
            "plan_status": "Active"
        }
    )
    
    # Ensure dedicated database exists
    create_tenant_database(school)
    if created:
        print(f"Created School: {school.name}")
    else:
        school.status = "Approved"
        school.plan_status = "Active"
        school.save()
        print(f"School already exists and was set to Approved: {school.name}")

    # 2. Create Super Admin User (Hamza)
    if not User.objects.filter(username="hamza").exists():
        user = User.objects.create_superuser(
            username="hamza",
            password="hamza123",
            email="hamza@admin.com",
            role="superadmin"
        )
        print(f"Created Super Admin: {user.username} (Password: hamza123)")
    else:
        user = User.objects.get(username="hamza")
        user.is_superuser = True
        user.is_staff = True
        user.role = "superadmin"
        user.set_password("hamza123")
        user.save()
        print("Updated Super Admin 'hamza' credentials.")

    # 2b. Create Teacher User
    if not User.objects.filter(username="teacher").exists():
        User.objects.create_user(
            username="teacher",
            password="teacherpassword",
            email="teacher@bfa.com",
            role="teacher",
            school=school
        )
        print("Created Teacher User: teacher (Password: teacherpassword)")

    # 2c. Create Accountant User
    if not User.objects.filter(username="accountant").exists():
        User.objects.create_user(
            username="accountant",
            password="accountantpassword",
            email="accountant@bfa.com",
            role="accountant",
            school=school
        )
        print("Created Accountant User: accountant (Password: accountantpassword)")

    # 3. Create dummy students with new fields
    Student.objects.filter(school=school).delete()
    Student.objects.create(
        name="Ali Hassan", 
        school=school, 
        class_name="10-A", 
        roll_no="S-101",
        email="ali.h@example.com",
        phone="0300-1112223",
        status="Active"
    )
    Student.objects.create(
        name="Sara Khan", 
        school=school, 
        class_name="9-B", 
        roll_no="S-901",
        email="sara.k@example.com",
        phone="0300-4445556",
        status="Active"
    )
    print("Created/Reset students with full profile fields.")

    # 4. Create dummy teachers with new fields
    Teacher.objects.filter(school=school).delete()
    Teacher.objects.create(
        name="Mr. Ahmed Raza",
        school=school,
        subject="Mathematics",
        email="a.raza@school.edu",
        experience="8 yrs",
        rating=4.9,
        classes=["10-A", "11-B"]
    )
    Teacher.objects.create(
        name="Ms. Nadia Hussain",
        school=school,
        subject="English Literature",
        email="n.hussain@school.edu",
        experience="5 yrs",
        rating=4.7,
        classes=["9-A"]
    )
    print("Created/Reset teachers with full profile fields.")

if __name__ == "__main__":
    seed_data()
