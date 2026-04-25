import requests
import random
import string

def random_string(length=6):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def test_signup_domain():
    url = "http://localhost:8000/api/signup/"
    school_name = f"Test School {random_string()}"
    payload = {
        "school_name": school_name,
        "username": f"admin_{random_string()}",
        "password": "password123"
    }
    
    response = requests.post(url, json=payload)
    print(f"Signup Response: {response.status_code}")
    print(response.json())
    
    # Verify in DB
    import os
    import django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_saas.settings')
    django.setup()
    from schools.models import School
    
    school = School.objects.filter(name=school_name).first()
    if school:
        print(f"Created School: {school.name}")
        print(f"Assigned Domain: {school.domain}")
    else:
        print("School not found in DB")

if __name__ == "__main__":
    test_signup_domain()
