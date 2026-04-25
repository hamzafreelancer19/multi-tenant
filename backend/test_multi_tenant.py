import os
import django
from django.test import RequestFactory

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_saas.settings')
django.setup()

from schools.models import School
from core.middleware import TenantMiddleware
from core.utils import get_current_school
from django.contrib.auth import get_user_model

User = get_user_model()

def test_tenant_resolution():
    factory = RequestFactory()
    middleware = TenantMiddleware(lambda r: None)

    # Create dummy data
    school1, _ = School.objects.get_or_create(name="School 1", domain="school1.localhost")
    school1.status = 'Approved'
    school1.save()
    
    school2, _ = School.objects.get_or_create(name="School 2", domain="school2.localhost")
    school2.status = 'Approved'
    school2.save()
    
    user1, _ = User.objects.get_or_create(username="user1", school=school1)
    user2, _ = User.objects.get_or_create(username="user2", school=school2)

    print("\n--- Testing Clean Architecture Tenant Resolution ---")
    
    # 1. Test domain detection (school1.localhost)
    request = factory.get('/')
    request.META['HTTP_HOST'] = 'school1.localhost'
    request.user = User() # Anonymous user
    middleware(request)
    resolved_school = get_current_school(request)
    print(f"Domain: school1.localhost -> Resolved: {resolved_school.name if resolved_school else 'None'}")
    assert resolved_school == school1

    # 2. Test fallback to user school (no domain match)
    request = factory.get('/')
    request.META['HTTP_HOST'] = 'localhost'
    request.user = user1
    middleware(request)
    resolved_school = get_current_school(request)
    print(f"Domain: localhost, User: user1 (School 1) -> Resolved: {resolved_school.name if resolved_school else 'None'}")
    assert resolved_school == school1
    # Verify NO stealth override
    print(f"No Override Check: request.user.school -> {request.user.school.name}")
    assert request.user.school == school1

    # 3. Test domain priority over user school
    request = factory.get('/')
    request.META['HTTP_HOST'] = 'school2.localhost'
    request.user = user1 # User from School 1 on School 2 domain
    middleware(request)
    resolved_school = get_current_school(request)
    print(f"Domain: school2.localhost, User: user1 (School 1) -> Resolved: {resolved_school.name if resolved_school else 'None'}")
    assert resolved_school == school2
    # Verify NO stealth override
    print(f"No Override Check: request.user.school -> {request.user.school.name}")
    assert request.user.school == school1

    print("\nClean Architecture Tests Passed!")

if __name__ == "__main__":
    try:
        test_tenant_resolution()
    except Exception as e:
        print(f"\nTest Failed: {e}")
        import traceback
        traceback.print_exc()
