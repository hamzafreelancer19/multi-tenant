from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        school = get_current_school(request)
        return Response({
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "school": school.id if school else None,
            "user_school_id": user.school.id if user.school else None,
        })

from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from schools.models import School

User = get_user_model()

from core.models import Notification
from core.utils import get_current_school

class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        school_name = request.data.get("school_name")
        username = request.data.get("username")
        password = request.data.get("password")

        if not school_name or not username or not password:
            return Response({"error": "Missing school_name, username, or password"}, status=400)

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already taken"}, status=400)

        # Dynamic Domain Detection
        current_host = request.headers.get('X-Tenant-Domain') or request.get_host().split(':')[0]
        if 'localhost' in current_host or '127.0.0.1' in current_host:
            base_domain = 'localhost'
        else:
            # If on Vercel or Custom Domain, use the main host as the base
            base_domain = current_host

        domain_slug = slugify(school_name)
        school = School.objects.create(
            name=school_name,
            domain=f"{domain_slug}.{base_domain}"
        )

        # SaaS: Auto-create dedicated database if enabled
        from django.conf import settings
        from core.tenant_db_creator import create_tenant_database
        if getattr(settings, 'ENABLE_TENANT_DB_CREATION', False):
            create_tenant_database(school)

        # Create the School Admin
        user = User.objects.create(
            username=username,
            role="admin",
            school=school
        )
        user.set_password(password)
        user.save()

        # Log Activity (Platform level - set school=None so Super Admin can see it)
        from core.models import ActivityLog
        ActivityLog.objects.create(
            school=None,
            name=username,
            action=f"registered '{school_name}' for approval",
            avatar=username[0].upper() if username else "S"
        )

        # Notify Super Admins (System-wide notification with school=None)
        Notification.objects.create(
            school=None, 
            message=f"New school registration: {school_name}. Awaiting approval."
        )

        return Response({
            "message": "Registration successful! Your school is now pending approval by the platform administrator. You will be able to log in once approved."
        }, status=201)

from rest_framework import viewsets
from .serializers import UserSerializer

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only superadmin manages all users
        if self.request.user.role == 'superadmin':
            return User.objects.all().order_by('-date_joined')
        # School context admins can manage users within their school
        school = get_current_school(self.request)
        if school:
            return User.objects.filter(school=school).order_by('-date_joined')
        return User.objects.none()

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from .auth import MyTokenObtainPairSerializer

class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('access_token')
        if not token:
            return Response({"error": "No access token provided"}, status=400)

        try:
            import requests
            response = requests.get(f"https://www.googleapis.com/oauth2/v3/userinfo", headers={"Authorization": f"Bearer {token}"})
            
            if not response.ok:
                return Response({"error": "Failed to authenticate with Google"}, status=400)
            
            idinfo = response.json()
            email = idinfo.get('email')
            
            if not email:
                return Response({"error": "No email found in Google profile"}, status=400)

            # Look up the user
            user = User.objects.filter(username=email).first()
            
            if not user:
                provided_school_name = request.data.get('school_name', '').strip()
                
                # If they try to log in via Google on the Login page but an account doesn't exist
                if not provided_school_name:
                    return Response({"error": "No account found for this Google email. Please register your school first."}, status=404)

                # Dynamic Domain Detection
                current_host = request.headers.get('X-Tenant-Domain') or request.get_host().split(':')[0]
                if 'localhost' in current_host or '127.0.0.1' in current_host:
                    base_domain = 'localhost'
                else:
                    base_domain = current_host

                domain_slug = slugify(school_name)
                school = School.objects.create(
                    name=school_name,
                    domain=f"{domain_slug}.{base_domain}"
                ) # Default is 'Pending'
                
                # SaaS: Auto-create dedicated database if enabled
                from django.conf import settings
                from core.tenant_db_creator import create_tenant_database
                if getattr(settings, 'ENABLE_TENANT_DB_CREATION', False):
                    create_tenant_database(school)

                user = User.objects.create(
                    username=email,
                    role="admin",
                    school=school
                )
                user.set_unusable_password()
                user.save()
                
                from core.models import ActivityLog, Notification
                ActivityLog.objects.create(
                    school=None,
                    name=email,
                    action=f"registered '{school_name}' via Google Login for approval",
                    avatar=email[0].upper()
                )

                # Notify Super Admins
                Notification.objects.create(
                    school=None, 
                    message=f"New school registration via Google: {school_name}. Awaiting approval."
                )

            # Check if user can login (from MyTokenObtainPairSerializer validation logic)
            if user.role != 'superadmin':
                if not user.school:
                    return Response({"error": "No school assigned to this user."}, status=403)
                if user.school.status != 'Approved':
                    return Response({
                        "error": f"Your school '{user.school.name}' is {user.school.status}. Please wait for approval."
                    }, status=403)

            # Generate tokens
            refresh = MyTokenObtainPairSerializer.get_token(user)
            
            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            })
            
        except ValueError as e:
            return Response({"error": f"Invalid token: {str(e)}"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class TenantInfoView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        school = get_current_school(request)
        if school:
            from students.models import Student
            from teachers.models import Teacher
            
            student_count = Student.objects.filter(school=school).count()
            teacher_count = Teacher.objects.filter(school=school).count()
            course_count = Student.objects.filter(school=school).values('class_name').distinct().count()
            
            return Response({
                "school_id": school.id,
                "school_name": school.name,
                "landing": {
                    "hero_title": school.landing_hero_title or f"Welcome to {school.name}",
                    "hero_subtitle": school.landing_hero_subtitle or "Providing quality education for a brighter future.",
                    "about": school.landing_about_text or f"{school.name} is dedicated to excellence in education.",
                    "primary_color": school.landing_primary_color,
                    "contact_email": school.landing_contact_email or "info@school.com",
                    "contact_phone": school.landing_contact_phone or "+123456789",
                    "show_stats": school.landing_show_stats,
                    "hero_image_url": school.landing_hero_image_url,
                    "center_image_url": school.landing_center_image_url,
                    "features": school.landing_features,
                    "testimonials": school.landing_testimonials,
                    "programs": school.landing_programs,
                    "languages": school.landing_languages,
                    "stats": {
                        "students": student_count,
                        "teachers": teacher_count,
                        "courses": course_count,
                    }
                }
            })
        return Response({
            "school_id": None,
            "school_name": None,
            "detail": "No tenant detected"
        }, status=200)

class SchoolLandingUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        if request.user.role != 'admin':
            return Response({"error": "Only school admins can update landing page settings."}, status=403)
        
        school = get_current_school(request)
        if not school:
            return Response({"error": "No school context found."}, status=400)
            
        school.landing_hero_title = request.data.get('hero_title', school.landing_hero_title)
        school.landing_hero_subtitle = request.data.get('hero_subtitle', school.landing_hero_subtitle)
        school.landing_about_text = request.data.get('about', school.landing_about_text)
        school.landing_primary_color = request.data.get('primary_color', school.landing_primary_color)
        school.landing_contact_email = request.data.get('contact_email', school.landing_contact_email)
        school.landing_contact_phone = request.data.get('contact_phone', school.landing_contact_phone)
        school.landing_show_stats = request.data.get('show_stats', school.landing_show_stats)
        school.landing_hero_image_url = request.data.get('hero_image_url', school.landing_hero_image_url)
        school.landing_center_image_url = request.data.get('center_image_url', school.landing_center_image_url)
        school.landing_features = request.data.get('features', school.landing_features)
        school.landing_testimonials = request.data.get('testimonials', school.landing_testimonials)
        school.landing_programs = request.data.get('programs', school.landing_programs)
        school.landing_languages = request.data.get('languages', school.landing_languages)
        school.save()
        
        return Response({"message": "Landing page settings updated successfully!"})

