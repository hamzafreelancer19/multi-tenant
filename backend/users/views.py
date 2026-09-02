from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth import get_user_model

from core.utils import get_current_school
from core.models import ActivityLog

from users.presence import avatar_of, is_online, mark_offline, mark_online, touch_presence

User = get_user_model()


def serialize_me(request):
    user = request.user
    school = get_current_school(request) or getattr(user, "school", None)
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email or "",
        "first_name": user.first_name or "",
        "last_name": user.last_name or "",
        "phone": getattr(user, "phone", "") or "",
        "avatar_url": avatar_of(user),
        "last_seen": user.last_seen.isoformat() if getattr(user, "last_seen", None) else None,
        "online": is_online(user),
        "role": user.role,
        "school": school.id if school else None,
        "school_id": school.id if school else None,
        "user_school_id": user.school.id if user.school else None,
        "school_name": school.name if school else (user.school.name if user.school else None),
        "is_active": user.is_active,
        "date_joined": user.date_joined,
        "last_login": user.last_login,
        "has_usable_password": user.has_usable_password(),
    }


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        touch_presence(request.user)
        return Response(serialize_me(request))

    def patch(self, request):
        user = request.user
        data = request.data
        fields = []

        if "email" in data:
            email = (data.get("email") or "").strip()
            current = (user.email or "").strip()
            if email.lower() != current.lower():
                if email and User.objects.filter(email__iexact=email).exclude(id=user.id).exists():
                    return Response({"email": ["This email is already in use."]}, status=400)
                user.email = email
                fields.append("email")
        if "first_name" in data:
            user.first_name = str(data.get("first_name") or "").strip()[:150]
            fields.append("first_name")
        if "last_name" in data:
            user.last_name = str(data.get("last_name") or "").strip()[:150]
            fields.append("last_name")
        if "phone" in data:
            user.phone = str(data.get("phone") or "").strip()[:20]
            fields.append("phone")
        if "avatar_url" in data:
            user.avatar_url = str(data.get("avatar_url") or "").strip()[:2000]
            fields.append("avatar_url")

        if fields:
            user.save(update_fields=fields)
            school = get_current_school(request) or getattr(user, "school", None)
            ActivityLog.objects.create(
                school=school,
                name=user.username,
                action="updated their profile",
                avatar=user.username[:1].upper() if user.username else "U",
            )
        return Response(serialize_me(request))


class PresenceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        flag = request.data.get("online", True)
        online = str(flag).lower() not in {"0", "false", "offline", "no"}
        if online:
            mark_online(request.user)
        else:
            mark_offline(request.user)
        return Response({"online": is_online(request.user)})


class MePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        current_password = request.data.get("current_password") or ""
        new_password = request.data.get("new_password") or ""

        if not new_password:
            return Response({"error": "New password is required."}, status=400)
        if user.has_usable_password() and not user.check_password(current_password):
            return Response({"error": "Current password is incorrect."}, status=400)
        try:
            validate_password(new_password, user)
        except DjangoValidationError as exc:
            return Response({"error": " ".join(exc.messages)}, status=400)

        user.set_password(new_password)
        user.save(update_fields=["password"])
        school = get_current_school(request) or getattr(user, "school", None)
        ActivityLog.objects.create(
            school=school,
            name=user.username,
            action="changed their password",
            avatar=user.username[:1].upper() if user.username else "U",
        )
        return Response({"message": "Password updated."})

from rest_framework.permissions import AllowAny
from schools.models import School

class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            from core.platform import SIGNUP_CLOSED_MESSAGE, get_global_setting
            if not get_global_setting().allow_signup:
                return Response({"error": SIGNUP_CLOSED_MESSAGE, "code": "signup_closed"}, status=403)
            school_name = request.data.get("school_name")
            username = request.data.get("username")
            email = request.data.get("email")
            password = request.data.get("password")

            if not school_name or not username or not email or not password:
                missing = [f for f in ["school_name", "username", "email", "password"] if not request.data.get(f)]
                print(f"Signup Error: Missing fields: {missing}")
                return Response({"error": f"Missing fields: {', '.join(missing)}"}, status=400)

            if User.objects.filter(username=username).exists():
                print(f"Signup Error: Username '{username}' already taken")
                return Response({"error": "Username already taken"}, status=400)
            
            if User.objects.filter(email=email).exists():
                print(f"Signup Error: Email '{email}' already registered")
                return Response({"error": "Email already registered"}, status=400)

            from django.utils.text import slugify
            # Dynamic Domain Detection
            current_host = request.headers.get('X-Tenant-Domain') or request.get_host().split(':')[0]
            if 'localhost' in current_host or '127.0.0.1' in current_host:
                base_domain = 'localhost'
            else:
                base_domain = current_host

            domain_slug = slugify(school_name)
            
            # Check if domain already exists
            domain_name = f"{domain_slug}.{base_domain}"
            if School.objects.filter(domain=domain_name).exists():
                return Response({"error": f"The domain '{domain_name}' is already taken. Please choose a different school name."}, status=400)

            school = School.objects.create(
                name=school_name,
                domain=domain_name
            )

            # SaaS: Auto-create dedicated database if enabled
            from django.conf import settings
            from core.tenant_db_creator import create_tenant_database
            if getattr(settings, 'ENABLE_TENANT_DB_CREATION', False):
                try:
                    create_tenant_database(school)
                except Exception as e:
                    # Log but don't fail signup if DB creation is blocked in prod
                    import logging
                    logger = logging.getLogger('tenant')
                    logger.error(f"Tenant DB creation failed for {school_name}: {str(e)}")

            # Create the School Admin
            user = User.objects.create(
                username=username,
                email=email,
                role="admin",
                school=school
            )
            user.set_password(password)
            user.save()

            # Log Activity
            from core.models import ActivityLog
            ActivityLog.objects.create(
                school=None,
                name=username,
                action=f"registered '{school_name}' for approval",
                avatar=username[0].upper() if username else "S"
            )

            # Notify Super Admins
            from core.models import Notification
            Notification.objects.create(
                school=None,
                audience="Admin",
                message=f"New school registration: {school_name}. Awaiting approval.",
            )

            return Response({
                "message": "Registration successful! Your school is now pending approval by the platform administrator."
            }, status=201)

        except Exception as e:
            return Response({"error": f"Signup Error: {str(e)}"}, status=500)

from rest_framework import viewsets
from .serializers import UserSerializer

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only superadmin manages all users
        if self.request.user.role == 'superadmin':
            qs = User.objects.all().order_by('-date_joined')
            if self.request.query_params.get('scope') != 'all':
                qs = qs.filter(role='admin', school__isnull=False)
            return qs
        # School context admins can manage users within their school
        school = get_current_school(self.request)
        if school:
            return User.objects.filter(school=school).order_by('-date_joined')
        return User.objects.none()

    def perform_create(self, serializer):
        from rest_framework.exceptions import PermissionDenied
        if self.request.user.role != 'superadmin' and serializer.validated_data.get('role') == 'superadmin':
            raise PermissionDenied("Only a superadmin can create another superadmin.")
        if self.request.user.role != 'superadmin':
            school = get_current_school(self.request)
            serializer.save(school=school)
        else:
            serializer.save()

    def perform_update(self, serializer):
        instance = serializer.instance
        want_active = serializer.validated_data.get("is_active", instance.is_active)
        if want_active and instance.school_id and getattr(instance.school, "status", None) == "Rejected":
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"is_active": "Restore the school first, then enable this account."})
        was_active = instance.is_active
        user = serializer.save()
        if getattr(self.request.user, "role", None) == "superadmin" and was_active != user.is_active:
            from core.models import ActivityLog
            ActivityLog.objects.create(
                school=user.school,
                name=self.request.user.username,
                action=f"{'enabled' if user.is_active else 'disabled'} account '{user.username}'",
                avatar="S",
            )

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

            # Dynamic School/Tenant Detection
            school = get_current_school(request)
            
            # Look up the user for THIS specific school
            user = User.objects.filter(username=email, school=school).first() if school else None
            
            from core.platform import (
                SIGNUP_CLOSED_MESSAGE,
                get_global_setting,
                maintenance_payload,
            )
            gs = get_global_setting()

            # If not found for THIS school, but we are on a specific school domain
            if not user and school:
                # Check if we should auto-register this user for this school
                # (Only if they are trying to access their own school or registering)
                provided_school_name = request.data.get('school_name', '').strip()
                if provided_school_name and not gs.allow_signup:
                    return Response({"error": SIGNUP_CLOSED_MESSAGE, "code": "signup_closed"}, status=403)
                
                # If they are on a school domain but no account exists yet
                if not provided_school_name:
                    # Check if this email exists ANYWHERE else to see if we should just create a new record
                    # Django usernames must be unique, so we'll use email + school_id if email is taken
                    base_username = email
                    if User.objects.filter(username=email).exists():
                        base_username = f"{email}_{school.id}"

                    user = User.objects.create(
                        username=base_username,
                        email=email,
                        role="admin",
                        school=school
                    )
                    user.set_unusable_password()
                    user.save()
                else:
                    # This is a new school registration
                    from django.utils.text import slugify
                    domain_slug = slugify(provided_school_name)
                    
                    # Create new school
                    new_school = School.objects.create(
                        name=provided_school_name,
                        domain=f"{domain_slug}.{request.get_host().split(':')[0]}"
                    )
                    
                    # Create user record (handling duplicate username across tenants)
                    base_username = email
                    if User.objects.filter(username=email).exists():
                        base_username = f"{email}_s{new_school.id}"

                    user = User.objects.create(
                        username=base_username,
                        email=email,
                        role="admin",
                        school=new_school
                    )
                    user.set_unusable_password()
                    user.save()
            
            # Final check: If still no user (e.g. no school detected)
            if not user:
                return Response({"error": "No school context detected. Please login from your school's unique URL."}, status=400)

            # Check if user can login
            if user.role != 'superadmin':
                if gs.maintenance_mode:
                    return Response(maintenance_payload(), status=503)
                if not user.school:
                    return Response({"error": "No school assigned to this user."}, status=403)
                if user.school.status != 'Approved' and user.school.status != 'Pending':
                    return Response({
                        "error": f"Your school '{user.school.name}' is {user.school.status}."
                    }, status=403)

            # Generate tokens
            refresh = MyTokenObtainPairSerializer.get_token(user)
            mark_online(user)

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

    def _school_classes(self, school):
        try:
            from classes.models import SchoolClass
            rows = SchoolClass.objects.filter(school=school).order_by('name', 'section')
            return [
                {"id": c.id, "label": f"{c.name}{f' - {c.section}' if c.section else ''}"}
                for c in rows
            ]
        except Exception:
            return []

    def get(self, request):
        from core.services import TenantResolver

        # Public landing must resolve from domain/slug even if a superadmin
        # JWT is sitting in localStorage from the platform dashboard.
        ident = request.query_params.get("domain") or request.query_params.get("slug")
        school = TenantResolver.resolve_from_identifier(ident) if ident else None
        if not school:
            school = TenantResolver.resolve_from_host(request)
        if school and not TenantResolver.validate_school(school, "tenant-info"):
            return Response({
                "school_id": None,
                "school_name": None,
                "detail": "This school is suspended.",
            }, status=200)

        if school:
            from students.models import Student
            from teachers.models import Teacher

            try:
                student_count = Student.objects.filter(school=school).count()
                teacher_count = Teacher.objects.filter(school=school).count()
                course_count = Student.objects.filter(school=school).values('class_name').distinct().count()
            except Exception:
                student_count = teacher_count = course_count = 0
            
            from django.utils.text import slugify
            from schools.landing_defaults import (
                default_features,
                default_programs,
                default_testimonials,
                merge_copy,
            )
            return Response({
                "school_id": school.id,
                "school_name": school.name,
                "school_domain": school.domain,
                "school_slug": slugify(school.name) or (school.code or "").lower(),
                "branding": {
                    "logo": request.build_absolute_uri(school.logo.url) if school.logo and hasattr(school.logo, 'url') and school.logo.name else None,
                    "favicon": request.build_absolute_uri(school.favicon.url) if school.favicon and hasattr(school.favicon, 'url') and school.favicon.name else None,
                    "dashboard": {
                        "primary_color": school.dashboard_primary_color,
                        "secondary_color": school.dashboard_secondary_color,
                        "accent_color": school.dashboard_accent_color,
                    },
                    "landing": {
                        "primary_color": school.landing_primary_color,
                        "secondary_color": school.landing_secondary_color,
                    }
                },
                "landing": {
                    "hero_title": school.landing_hero_title or f"A brighter future begins at {school.name}",
                    "hero_subtitle": school.landing_hero_subtitle or "Quality education, caring teachers, and a campus where every student is known, challenged, and celebrated.",
                    "about": school.landing_about_text or f"{school.name} is dedicated to excellence in education, character, and community.",
                    "primary_color": school.landing_primary_color,
                    "secondary_color": school.landing_secondary_color,
                    "contact_email": school.landing_contact_email or "",
                    "contact_phone": school.landing_contact_phone or "",
                    "show_stats": school.landing_show_stats,
                    "hero_image_url": school.landing_hero_image_url,
                    "center_image_url": school.landing_center_image_url,
                    "features": school.landing_features or default_features(),
                    "testimonials": school.landing_testimonials or default_testimonials(school.name),
                    "programs": school.landing_programs or default_programs(),
                    "languages": school.landing_languages or [],
                    "copy": merge_copy(school.landing_copy, school.name),
                    "classes": self._school_classes(school),
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
        school.landing_secondary_color = request.data.get('secondary_color', school.landing_secondary_color)
        school.landing_contact_email = request.data.get('contact_email', school.landing_contact_email)
        school.landing_contact_phone = request.data.get('contact_phone', school.landing_contact_phone)
        school.landing_show_stats = request.data.get('show_stats', school.landing_show_stats)
        school.landing_hero_image_url = request.data.get('hero_image_url', school.landing_hero_image_url)
        school.landing_center_image_url = request.data.get('center_image_url', school.landing_center_image_url)
        school.landing_features = request.data.get('features', school.landing_features)
        school.landing_testimonials = request.data.get('testimonials', school.landing_testimonials)
        school.landing_programs = request.data.get('programs', school.landing_programs)
        school.landing_languages = request.data.get('languages', school.landing_languages)
        if 'copy' in request.data:
            school.landing_copy = request.data.get('copy') or {}
        school.save()
        
        return Response({"message": "Landing page settings updated successfully!"})

