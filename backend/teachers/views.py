from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from rest_framework.exceptions import ValidationError
from .models import Teacher
from .serializers import TeacherSerializer
from .services import ensure_portal_user, next_employee_id
from .scoping import (
    build_classroom_scope,
    colleague_teacher_ids,
    deny_teacher_writes,
    get_teacher_for_request,
    is_teacher_request,
)
from core.models import ActivityLog, Notification
from core.utils import get_current_school, school_queryset
from core.mixins import SchoolOpsMixin
from core.plan_limits import check_teacher_limit


class TeacherViewSet(SchoolOpsMixin, viewsets.ModelViewSet):
    serializer_class = TeacherSerializer
    lookup_value_regex = r"[0-9]+"

    def check_permissions(self, request):
        super().check_permissions(request)
        if getattr(self, "action", None) != "me":
            deny_teacher_writes(request, "Only school admin can add or edit teachers.")

    def get_queryset(self):
        qs = school_queryset(self.request, Teacher).select_related("user")
        if is_teacher_request(self.request):
            ids = colleague_teacher_ids(get_teacher_for_request(self.request))
            return qs.filter(id__in=ids) if ids else qs.none()
        return qs

    def _sync_login(self, teacher, password=None):
        raw = password if password else None
        if not teacher.email and not raw:
            return None
        if not teacher.user_id and not raw:
            return None
        return ensure_portal_user(teacher, password=raw)

    def perform_create(self, serializer):
        school = get_current_school(self.request)
        check_teacher_limit(school)
        password = serializer.validated_data.pop("password", None)
        teacher = serializer.save(school=school, employee_id=next_employee_id(school))
        try:
            username = self._sync_login(teacher, password)
            initial = teacher.name[0].upper() if teacher.name else "T"
            ActivityLog.objects.create(
                school=school,
                name=teacher.name,
                action=f"joined as {teacher.subject} Teacher (Login: {username or teacher.email})",
                avatar=initial,
            )
            Notification.objects.create(
                school=school,
                audience="Admin",
                message=f"New teacher {teacher.name} added. They can log in with {teacher.email}.",
            )
        except ValueError as e:
            raise ValidationError({"password": str(e)})

    def perform_update(self, serializer):
        password = serializer.validated_data.pop("password", None)
        teacher = serializer.save()
        try:
            self._sync_login(teacher, password)
        except Exception as e:
            print(f"[Warning] Could not update teacher login: {e}")

    def perform_destroy(self, instance):
        user = instance.user
        instance.delete()
        if user and user.role == "teacher":
            user.is_active = False
            user.save(update_fields=["is_active"])

    @action(detail=False, methods=["get"])
    def me(self, request):
        teacher = get_teacher_for_request(request)
        if not teacher:
            return Response({})
        data = self.get_serializer(teacher).data
        data["classroom_scope"] = build_classroom_scope(teacher)
        return Response(data)

    @action(detail=True, methods=["post"], url_path="set-login")
    def set_login(self, request, pk=None):
        teacher = self.get_object()
        email = (request.data.get("email") or teacher.email or "").strip().lower()
        password = request.data.get("password") or ""
        if not email:
            return Response({"email": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not password or len(password) < 6:
            return Response({"password": "Password must be at least 6 characters."}, status=status.HTTP_400_BAD_REQUEST)
        teacher.email = email
        teacher.save(update_fields=["email"])
        username = ensure_portal_user(teacher, password=password, login_email=email)
        return Response({
            "message": "Teacher login saved.",
            "login_username": username,
            "email": email,
            "has_login": True,
        })
