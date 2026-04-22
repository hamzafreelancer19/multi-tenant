from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "school": user.school.id if user.school else None,
        })

from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from schools.models import School

User = get_user_model()

from core.models import Notification

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

        # Create the tenant (School) - Default status is 'Pending'
        school = School.objects.create(name=school_name)

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
        # School admins can manage users within their school
        if hasattr(self.request.user, 'school') and self.request.user.school:
            return User.objects.filter(school=self.request.user.school).order_by('-date_joined')
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

                # If they are on the Signup page, they provided a school name
                school_name = provided_school_name
                school = School.objects.create(name=school_name) # Default is 'Pending'
                
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

