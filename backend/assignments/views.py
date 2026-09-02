from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from .models import Assignment
from .serializers import AssignmentSerializer
from core.utils import get_current_school, school_queryset
from core.mixins import SchoolOpsMixin
from core.models import ActivityLog
from teachers.scoping import apply_teacher_class_scope, ensure_teacher_can_access_class, get_teacher_for_request, is_teacher_request


class AssignmentViewSet(SchoolOpsMixin, viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer

    def check_permissions(self, request):
        super().check_permissions(request)
        if request.method not in ("GET", "HEAD", "OPTIONS") and getattr(request.user, "role", None) == "student":
            raise PermissionDenied("Students can view homework only.")

    def get_queryset(self):
        qs = apply_teacher_class_scope(
            self.request,
            school_queryset(self.request, Assignment).select_related("teacher").order_by("due_date", "-id"),
        )
        class_name = self.request.query_params.get("class_name")
        if class_name:
            qs = qs.filter(class_name=class_name)
        teacher_id = self.request.query_params.get("teacher")
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        return qs

    def perform_create(self, serializer):
        school = get_current_school(self.request)
        ensure_teacher_can_access_class(self.request, serializer.validated_data.get("class_name"))
        extra = {}
        if is_teacher_request(self.request):
            teacher = get_teacher_for_request(self.request)
            if teacher:
                extra["teacher"] = teacher
        item = serializer.save(
            school=school,
            posted_by=getattr(self.request.user, "username", "") or "",
            **extra,
        )
        ActivityLog.objects.create(
            school=school,
            name=item.posted_by or "Admin",
            action=f"assigned {item.title} to {item.class_name}",
            avatar="H",
        )

    def perform_update(self, serializer):
        serializer.save()
