from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Student
from .serializers import StudentSerializer
from users.presence import touch_presence
from .services import (
    backfill_missing_logins,
    ensure_parent_user,
    ensure_portal_user,
    get_child_for_parent,
    next_roll_no,
    parent_portal_payload,
)
from core.models import ActivityLog, Notification
from core.utils import get_current_school
from core.mixins import SchoolOpsMixin
from core.plan_limits import check_student_limit
from teachers.scoping import apply_teacher_class_scope, deny_teacher_writes


class StudentViewSet(SchoolOpsMixin, viewsets.ModelViewSet):
    serializer_class = StudentSerializer

    def check_permissions(self, request):
        super().check_permissions(request)
        action = getattr(self, "action", None)
        if action != "my_child":
            deny_teacher_writes(request, "Teachers can view their class students. Adding or removing students is for school admin.")

    def get_queryset(self):
        school = get_current_school(self.request)
        role = getattr(getattr(self.request, "user", None), "role", None)
        if role == "parent":
            child = get_child_for_parent(self.request)
            return Student.objects.filter(pk=child.pk) if child else Student.objects.none()
        if not school:
            return Student.objects.none()
        return apply_teacher_class_scope(self.request, Student.objects.filter(school=school).select_related("parent_user"))

    def list(self, request, *args, **kwargs):
        role = getattr(getattr(request, "user", None), "role", None)
        if role in ("admin", "teacher"):
            school = get_current_school(request)
            if school:
                missing = Student.objects.filter(school=school, parent_user__isnull=True)
                if missing.exists():
                    backfill_missing_logins(missing)
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        school = get_current_school(request)
        check_student_limit(school)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = serializer.save(school=school, roll_no=next_roll_no(school))
        student_login = ""
        parent_username = ""
        parent_password = ""
        try:
            student_login = ensure_portal_user(student)
        except Exception as e:
            print(f"[Warning] Could not create student user: {e}")
        try:
            parent_username, parent_password = ensure_parent_user(student)
        except Exception as e:
            print(f"[Warning] Could not create parent user: {e}")

        ActivityLog.objects.create(
            school=school,
            name=student.name,
            action=f"enrolled in {student.class_name} (User: {student_login or student.email})",
            avatar=student.name[0].upper() if student.name else "S",
        )
        Notification.objects.create(
            school=school,
            audience="Admin",
            message=f"New student {student.name} was added to {student.class_name}. Parent login: {parent_username or 'pending'}",
        )
        data = self.get_serializer(student).data
        data["student_login"] = student_login
        data["student_username"] = student_login or data.get("student_username") or ""
        data["student_password"] = "Student@123" if student_login else ""
        data["parent_username"] = parent_username
        data["parent_password"] = parent_password
        return Response(data, status=status.HTTP_201_CREATED)

    def perform_destroy(self, instance):
        parent = instance.parent_user
        instance.delete()
        if parent and parent.role == "parent":
            parent.is_active = False
            parent.save(update_fields=["is_active"])

    @action(detail=True, methods=["post"], url_path="set-parent-login")
    def set_parent_login(self, request, pk=None):
        if getattr(request.user, "role", None) != "admin":
            return Response({"detail": "Only school admin can create parent login."}, status=403)
        student = self.get_object()
        username, password = ensure_parent_user(student, reset_password=True)
        return Response({
            "parent_username": username,
            "parent_password": password or username,
            "has_parent_login": True,
        })

    @action(detail=False, methods=["get"], url_path="my-child")
    def my_child(self, request):
        touch_presence(request.user)
        child = get_child_for_parent(request)
        if not child:
            return Response({"detail": "No student is linked to this parent login."}, status=404)
        return Response(parent_portal_payload(child, self.get_serializer(child).data))
