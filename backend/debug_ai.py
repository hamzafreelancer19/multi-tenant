import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_saas.settings')
django.setup()

from core.ai_agent import process_ai_message
from schools.models import School

def test_ai():
    try:
        school = School.objects.first()
        if not school:
            print("No school found")
            return
            
        print(f"Testing AI for School: {school.name}")
        response = process_ai_message("Hello", school.id)
        
        # Print without emojis to avoid Windows console errors
        safe_response = response.encode('ascii', 'ignore').decode('ascii')
        print("AI Response (Safe):", safe_response)
        
    except Exception as e:
        print("SYSTEM CRASH:", str(e))

if __name__ == "__main__":
    test_ai()
