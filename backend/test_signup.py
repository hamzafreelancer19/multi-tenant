import os
import django
from django.test import Client
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_saas.settings')
django.setup()

def test_signup():
    client = Client()
    # Unique username for test
    import random
    username = f"testuser_{random.randint(1000, 9999)}"
    
    payload = {
        "school_name": "Test School",
        "username": username,
        "password": "testpassword123"
    }
    
    print(f"Testing signup with username: {username}")
    response = client.post('/api/signup/', data=json.dumps(payload), content_type='application/json')
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.content.decode()}")
    
    assert response.status_code == 201

if __name__ == "__main__":
    try:
        test_signup()
        print("\n✅ Signup test passed!")
    except Exception as e:
        print(f"\n❌ Signup test failed: {e}")
