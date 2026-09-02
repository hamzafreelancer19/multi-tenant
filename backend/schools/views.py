from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import School
from .serializers import SchoolSerializer

from rest_framework.decorators import action
from rest_framework.response import Response
from datetime import date, timedelta

from core.utils import get_current_school
from core.mixins import SchoolOpsMixin

ADMIN_SCHOOL_FIELDS = {
    "name",
    "landing_contact_email",
    "landing_contact_phone",
    "dashboard_primary_color",
    "dashboard_secondary_color",
    "dashboard_accent_color",
    "logo",
    "favicon",
}


PLAN_AMOUNTS = {
    "Basic": 1500,
    "Business": 3500,
    "Pro": 6000,
}


class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.all().order_by('-created_at')
    serializer_class = SchoolSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        if getattr(request.user, "role", None) != "superadmin":
            return self.partial_update(request, *args, **kwargs)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if getattr(request.user, "role", None) != "superadmin":
            payload = {}
            for key in ADMIN_SCHOOL_FIELDS:
                if key in request.data:
                    payload[key] = request.data.get(key)
                if key in request.FILES:
                    payload[key] = request.FILES[key]
            if payload.get("landing_contact_email") == "":
                payload["landing_contact_email"] = None
            serializer = self.get_serializer(self.get_object(), data=payload, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        return super().partial_update(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        school = self.get_object()
        data = self.get_serializer(school).data
        if getattr(request.user, "role", None) == "superadmin":
            data = self._with_profile_extras(school, data)
        return Response(data)

    def _with_profile_extras(self, school, data):
        key = data.get("ai_api_key") or ""
        data["ai_api_key_set"] = bool(key)
        data["ai_api_key"] = f"••••{key[-4:]}" if len(key) >= 4 else ("" if not key else "••••")
        stats = {
            "students": 0,
            "teachers": 0,
            "parents": 0,
            "admins": 0,
            "accountants": 0,
            "users": 0,
            "enrollments": 0,
            "classes": 0,
            "enrollments_by_status": {},
        }
        users = []
        try:
            from django.contrib.auth import get_user_model
            from django.db.models import Count
            from students.models import Student
            from teachers.models import Teacher
            from classes.models import SchoolClass

            User = get_user_model()
            stats["students"] = Student.objects.filter(school=school).count()
            stats["teachers"] = Teacher.objects.filter(school=school).count()
            stats["classes"] = SchoolClass.objects.filter(school=school).count()
            stats["enrollments"] = school.enrollments.count()
            stats["enrollments_by_status"] = {
                row["status"]: row["n"]
                for row in school.enrollments.values("status").annotate(n=Count("id"))
            }
            qs = User.objects.filter(school=school).order_by("role", "username")
            stats["users"] = qs.count()
            stats["admins"] = qs.filter(role="admin").count()
            stats["parents"] = qs.filter(role="parent").count()
            stats["accountants"] = qs.filter(role="accountant").count()
            users = [
                {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email or "",
                    "first_name": user.first_name or "",
                    "last_name": user.last_name or "",
                    "phone": getattr(user, "phone", "") or "",
                    "role": user.role,
                    "is_active": user.is_active,
                    "date_joined": user.date_joined,
                    "last_login": user.last_login,
                }
                for user in qs[:300]
            ]
        except Exception:
            pass
        data["stats"] = stats
        data["users"] = users
        return data

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
        from django.contrib.auth import get_user_model
        User = get_user_model()
        User.objects.filter(school=school).update(is_active=True)
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
        from django.contrib.auth import get_user_model
        User = get_user_model()
        User.objects.filter(school=school).update(is_active=False)
        from core.models import ActivityLog
        ActivityLog.objects.create(
            school=None,
            name=request.user.username,
            action=f"rejected school '{school.name}' and disabled its users",
            avatar="R"
        )
        return Response({"message": f"School {school.name} has been rejected."})

    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        if request.user.role != 'superadmin':
            return Response({"error": "Unauthorized"}, status=403)
        school = self.get_object()
        school.status = 'Rejected'
        school.save()
        from django.contrib.auth import get_user_model
        User = get_user_model()
        User.objects.filter(school=school).update(is_active=False)
        from core.models import ActivityLog
        ActivityLog.objects.create(
            school=None,
            name=request.user.username,
            action=f"suspended school '{school.name}' and disabled its users",
            avatar="S"
        )
        return Response({"message": f"School {school.name} suspended. All school users are disabled."})

    @action(detail=True, methods=['post'])
    def buy_plan(self, request, pk=None):
        school = self.get_object()
        plan_type = request.data.get('plan_type')
        transaction_id = request.data.get('transaction_id')

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

    @action(detail=True, methods=["get"])
    def profile(self, request, pk=None):
        if getattr(request.user, "role", None) != "superadmin":
            return Response({"error": "Unauthorized"}, status=403)
        school = self.get_object()
        data = self._with_profile_extras(school, self.get_serializer(school).data)
        return Response(data)

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
from .enrollment_services import resolve_enrollment_class
from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.utils import timezone


INCHARGE_REVIEW = ("Pending", "PendingIncharge")


class EnrollmentPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if view.action == "create":
            return True
        return request.user and request.user.is_authenticated


class EnrollmentViewSet(SchoolOpsMixin, viewsets.ModelViewSet):
    queryset = Enrollment.objects.all().order_by("-created_at")
    serializer_class = EnrollmentSerializer
    permission_classes = [EnrollmentPermission]

    def get_queryset(self):
        school = get_current_school(self.request)
        if not school:
            return Enrollment.objects.none()
        qs = Enrollment.objects.filter(school=school).select_related("assigned_incharge", "school_class").order_by("-created_at")
        role = getattr(getattr(self.request, "user", None), "role", None)
        if role == "teacher":
            from teachers.scoping import class_name_allowed, get_teacher_for_request, teacher_incharge_labels
            teacher = get_teacher_for_request(self.request)
            labels = teacher_incharge_labels(teacher)
            ids = [
                row.id for row in qs
                if (teacher and row.assigned_incharge_id == teacher.id)
                or class_name_allowed(row.class_applying, labels)
            ]
            return qs.filter(id__in=ids)
        return qs

    def check_permissions(self, request):
        super().check_permissions(request)
        role = getattr(getattr(request, "user", None), "role", None)
        action = getattr(self, "action", None)
        if action == "create":
            return
        if role == "student":
            raise PermissionDenied("Students cannot access admission requests.")
        if action in ("accept", "destroy", "update", "partial_update") and role != "admin":
            raise PermissionDenied("Only school admin can do this.")

    def perform_create(self, serializer):
        school = serializer.validated_data.get("school") or get_current_school(self.request)
        if not school:
            raise ValidationError({"school": "School is required."})
        instance = serializer.save(school=school)
        school_class, incharge = resolve_enrollment_class(instance.school, instance.class_applying)
        instance.school_class = school_class
        instance.assigned_incharge = incharge
        instance.status = "PendingIncharge" if incharge else "PendingAdmin"
        instance.save(update_fields=["school_class", "assigned_incharge", "status"])

        from core.models import ActivityLog, Notification
        ActivityLog.objects.create(
            school=instance.school,
            name="Website",
            action=f"new enrollment request: {instance.student_name}",
            avatar=(instance.student_name[:1] or "A").upper(),
        )
        class_bit = f" for {instance.class_applying}" if instance.class_applying else ""
        if incharge:
            Notification.objects.create(
                school=instance.school,
                audience="Teacher",
                teacher=incharge,
                link_path="/teacher/admissions",
                message=f"New admission for your class: {instance.student_name}{class_bit}. Take the class test, then send it to admin.",
            )
        else:
            Notification.objects.create(
                school=instance.school,
                audience="Admin",
                link_path="/enrollments",
                message=f"New admission request: {instance.student_name}{class_bit}. No class incharge is set, so it is waiting for admin.",
            )

    @action(detail=True, methods=["post"], url_path="submit-test")
    def submit_test(self, request, pk=None):
        enrollment = self.get_object()
        role = getattr(request.user, "role", None)
        from teachers.scoping import class_name_allowed, get_teacher_for_request, teacher_incharge_labels
        if role == "teacher":
            teacher = get_teacher_for_request(request)
            labels = teacher_incharge_labels(teacher)
            allowed = teacher and (
                enrollment.assigned_incharge_id == teacher.id
                or class_name_allowed(enrollment.class_applying, labels)
            )
            if not allowed:
                raise PermissionDenied("Only this class incharge can submit the admission test.")
        elif role != "admin":
            raise PermissionDenied("Only the class incharge can submit the admission test.")

        if enrollment.status not in INCHARGE_REVIEW:
            raise ValidationError("This request is not waiting for a class test.")

        score = request.data.get("test_score")
        if score in (None, ""):
            raise ValidationError({"test_score": "Enter the test marks."})
        try:
            score = float(score)
        except (TypeError, ValueError):
            raise ValidationError({"test_score": "Enter valid test marks."})
        total = request.data.get("test_total") or enrollment.test_total or 100
        try:
            total = int(total)
        except (TypeError, ValueError):
            total = 100
        if total <= 0:
            total = 100

        enrollment.test_score = score
        enrollment.test_total = total
        enrollment.test_notes = (request.data.get("test_notes") or "")[:2000]
        enrollment.test_date = request.data.get("test_date") or timezone.now().date()
        enrollment.incharge_submitted_at = timezone.now()
        enrollment.status = "PendingAdmin"
        enrollment.save()

        from core.models import ActivityLog, Notification
        ActivityLog.objects.create(
            school=enrollment.school,
            name=getattr(request.user, "username", "Teacher"),
            action=f"submitted admission test for {enrollment.student_name} ({score}/{total})",
            avatar="T",
        )
        Notification.objects.create(
            school=enrollment.school,
            audience="Admin",
            link_path="/enrollments",
            message=f"Admission ready: {enrollment.student_name} ({enrollment.class_applying or 'class'}) scored {score}/{total}. Register the student if you approve.",
        )
        return Response(self.get_serializer(enrollment).data)

    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        enrollment = self.get_object()
        if getattr(request.user, "role", None) != "admin":
            raise PermissionDenied("Only school admin can register the student.")
        ready = enrollment.status == "PendingAdmin" or (
            enrollment.status in INCHARGE_REVIEW and not enrollment.assigned_incharge_id
        )
        if not ready:
            if enrollment.status in INCHARGE_REVIEW:
                raise ValidationError("Wait for the class incharge to take the test and submit this request.")
            raise ValidationError("This request cannot be registered.")

        from students.models import Student
        from students.services import ensure_portal_user, next_roll_no
        from core.plan_limits import check_student_limit
        from core.models import ActivityLog

        check_student_limit(enrollment.school)

        enrollment.status = "Accepted"
        enrollment.save(update_fields=["status"])

        student = Student.objects.create(
            school=enrollment.school,
            name=enrollment.student_name,
            class_name=enrollment.class_applying or "Pending Assignment",
            roll_no=next_roll_no(enrollment.school),
            phone=enrollment.father_phone or enrollment.mother_phone or "",
            email=enrollment.email or None,
            status="Active",
            gender=enrollment.gender or "",
            date_of_birth=enrollment.date_of_birth,
            bform_cnic=enrollment.bform_cnic or "",
            previous_school=enrollment.previous_school or "",
            address=enrollment.address or "",
            city=enrollment.city or "",
            father_name=enrollment.father_name or "",
            father_phone=enrollment.father_phone or "",
            father_cnic=enrollment.father_cnic or "",
            father_occupation=enrollment.father_occupation or "",
            mother_name=enrollment.mother_name or "",
            mother_phone=enrollment.mother_phone or "",
            emergency_phone=enrollment.emergency_phone or "",
            notes=enrollment.notes or "",
        )

        login_hint = ""
        parent_username = ""
        student_username = ""
        try:
            student_username = ensure_portal_user(student)
            login_hint = f" Login: {student_username}"
        except Exception as e:
            print(f"[Warning] Could not create student user from admission: {e}")
        try:
            from students.services import ensure_parent_user
            parent_username, _ = ensure_parent_user(student)
        except Exception as e:
            print(f"[Warning] Could not create parent user from admission: {e}")

        ActivityLog.objects.create(
            school=enrollment.school,
            name=request.user.username,
            action=f"accepted admission and created student: {enrollment.student_name}{login_hint}",
            avatar="A",
        )
        return Response({
            "message": f"Enrollment for {enrollment.student_name} accepted and student record created.",
            "student_username": student_username,
            "student_password": "Student@123" if student_username else "",
            "parent_username": parent_username,
            "parent_password": parent_username,
        })

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        enrollment = self.get_object()
        role = getattr(request.user, "role", None)
        if role == "teacher":
            from teachers.scoping import class_name_allowed, get_teacher_for_request, teacher_incharge_labels
            teacher = get_teacher_for_request(request)
            labels = teacher_incharge_labels(teacher)
            allowed = teacher and (
                enrollment.assigned_incharge_id == teacher.id
                or class_name_allowed(enrollment.class_applying, labels)
            )
            if not allowed:
                raise PermissionDenied("Only this class incharge can reject the request.")
            if enrollment.status not in INCHARGE_REVIEW:
                raise ValidationError("This request is already with school admin.")
        elif role != "admin":
            raise PermissionDenied("You cannot reject this request.")

        enrollment.status = "Rejected"
        enrollment.save(update_fields=["status"])

        from core.models import ActivityLog
        ActivityLog.objects.create(
            school=enrollment.school,
            name=request.user.username,
            action=f"rejected enrollment: {enrollment.student_name}",
            avatar="R",
        )
        return Response({"message": f"Enrollment for {enrollment.student_name} rejected."})
