from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import School
from .serializers import SchoolSerializer

from rest_framework.decorators import action
from rest_framework.response import Response
from datetime import date, timedelta

from core.utils import get_current_school

class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.all().order_by('-created_at')
    serializer_class = SchoolSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        school = serializer.save()
        
        # SaaS: Auto-create dedicated database if enabled
        from django.conf import settings
        from core.tenant_db_creator import create_tenant_database
        if getattr(settings, 'ENABLE_TENANT_DB_CREATION', False):
            create_tenant_database(school)

    def get_queryset(self):
        if self.request.user.role == 'superadmin':
            return School.objects.all().order_by('-created_at')
        
        school = get_current_school(self.request)
        if school:
            return School.objects.filter(id=school.id)
        return School.objects.none()

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if request.user.role != 'superadmin':
            return Response({"error": "Unauthorized"}, status=403)
        school = self.get_object()
        school.status = 'Approved'
        school.save()
        from core.models import ActivityLog
        ActivityLog.objects.create(
            school=None,
            name=request.user.username,
            action=f"approved school '{school.name}'",
            avatar="A"
        )
        return Response({"message": f"School {school.name} has been approved."})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        if request.user.role != 'superadmin':
            return Response({"error": "Unauthorized"}, status=403)
        school = self.get_object()
        school.status = 'Rejected'
        school.save()
        from core.models import ActivityLog
        ActivityLog.objects.create(
            school=None,
            name=request.user.username,
            action=f"rejected school '{school.name}'",
            avatar="R"
        )
        return Response({"message": f"School {school.name} has been rejected."})

    @action(detail=True, methods=['post'])
    def buy_plan(self, request, pk=None):
        school = self.get_object()
        plan_type = request.data.get('plan_type')
        transaction_id = request.data.get('transaction_id')

        PLAN_AMOUNTS = {
            'Basic': 1000,
            'Business': 3000,
            'Pro': 5000,
        }

        if plan_type not in PLAN_AMOUNTS:
            return Response({"error": "Invalid plan type."}, status=400)
        if not transaction_id:
            return Response({"error": "Transaction ID is required."}, status=400)

        school.plan_type = plan_type
        school.plan_amount = PLAN_AMOUNTS[plan_type]
        school.transaction_id = transaction_id
        school.plan_status = 'Pending'
        school.save()

        from core.models import ActivityLog
        ActivityLog.objects.create(
            school=school,
            name=request.user.username,
            action=f"submitted plan '{plan_type}' with transaction ID '{transaction_id}'",
            avatar=request.user.username[0].upper()
        )

        return Response({"message": f"Plan '{plan_type}' submitted for approval."})

    @action(detail=True, methods=['post'])
    def approve_plan(self, request, pk=None):
        if request.user.role != 'superadmin':
            return Response({"error": "Unauthorized"}, status=403)
        school = self.get_object()
        school.plan_status = 'Active'
        school.plan_start_date = date.today()
        school.plan_expiry_date = date.today() + timedelta(days=30)
        school.save()

        from core.models import ActivityLog
        ActivityLog.objects.create(
            school=None,
            name=request.user.username,
            action=f"approved '{school.plan_type}' plan for school '{school.name}'",
            avatar="A"
        )
        return Response({"message": f"Plan approved for {school.name}."})

    @action(detail=True, methods=['post'])
    def reject_plan(self, request, pk=None):
        if request.user.role != 'superadmin':
            return Response({"error": "Unauthorized"}, status=403)
        school = self.get_object()
        school.plan_status = 'Inactive'
        school.plan_type = 'None'
        school.transaction_id = ''
        school.save()

        from core.models import ActivityLog
        ActivityLog.objects.create(
            school=None,
            name=request.user.username,
            action=f"rejected plan request for school '{school.name}'",
            avatar="R"
        )
        return Response({"message": f"Plan rejected for {school.name}."})

from .models import Enrollment
from .serializers import EnrollmentSerializer
from rest_framework import permissions

class EnrollmentPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if view.action == 'create':
            return True
        return request.user and request.user.is_authenticated

class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all().order_by('-created_at')
    serializer_class = EnrollmentSerializer
    permission_classes = [EnrollmentPermission]

    def get_queryset(self):
        if self.request.user.role == 'superadmin':
            return Enrollment.objects.all().order_by('-created_at')
        
        school = get_current_school(self.request)
        if school:
            return Enrollment.objects.filter(school=school).order_by('-created_at')
        return Enrollment.objects.none()

    def perform_create(self, serializer):
        # On landing page, we might not have a user, but we should have a school context
        # The school ID should be passed in the request data
        serializer.save()
        
        # Log activity
        instance = serializer.instance
        from core.models import ActivityLog
        ActivityLog.objects.create(
            school=instance.school,
            name="Landing Page",
            action=f"new enrollment request: {instance.student_name}",
            avatar=instance.student_name[0].upper()
        )

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        enrollment = self.get_object()
        enrollment.status = 'Accepted'
        enrollment.save()
        
        # Automatically create a Student record
        from students.models import Student
        import uuid
        
        # Auto-generate a roll number
        roll_no = f"ADM-{str(uuid.uuid4())[:4].upper()}"
        
        Student.objects.create(
            school=enrollment.school,
            name=enrollment.student_name,
            class_name="Pending Assignment", # School admin can change this later
            roll_no=roll_no,
            phone=enrollment.father_phone,
            status='Active'
        )
        
        from core.models import ActivityLog
        ActivityLog.objects.create(
            school=enrollment.school,
            name=request.user.username,
            action=f"accepted admission and created student: {enrollment.student_name}",
            avatar="A"
        )
        return Response({"message": f"Enrollment for {enrollment.student_name} accepted and student record created."})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        enrollment = self.get_object()
        enrollment.status = 'Rejected'
        enrollment.save()
        
        from core.models import ActivityLog
        ActivityLog.objects.create(
            school=enrollment.school,
            name=request.user.username,
            action=f"rejected enrollment: {enrollment.student_name}",
            avatar="R"
        )
        return Response({"message": f"Enrollment for {enrollment.student_name} rejected."})
