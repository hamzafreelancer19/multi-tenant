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
            "school": user.school.name if user.school else None,
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

