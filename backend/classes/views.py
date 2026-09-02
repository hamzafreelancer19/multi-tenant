from collections import Counter

from rest_framework import viewsets

from .models import SchoolClass
from .serializers import SchoolClassSerializer
from students.models import Student
from core.utils import get_current_school, school_queryset
from core.mixins import SchoolOpsMixin
from core.models import ActivityLog
from teachers.scoping import apply_teacher_school_class_scope, deny_teacher_writes


class SchoolClassViewSet(SchoolOpsMixin, viewsets.ModelViewSet):
    serializer_class = SchoolClassSerializer

    def check_permissions(self, request):
        super().check_permissions(request)
        deny_teacher_writes(request, "Only school admin can create or edit classes.")

    def get_queryset(self):
        qs = school_queryset(self.request, SchoolClass).select_related("class_teacher")
        return apply_teacher_school_class_scope(self.request, qs)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        school = get_current_school(self.request)
        counts = {}
        if school:
            names = Student.objects.filter(school=school).values_list("class_name", flat=True)
            counts = dict(Counter(names))
        ctx["student_counts"] = counts
        return ctx

    def perform_create(self, serializer):
        school = get_current_school(self.request)
        instance = serializer.save(school=school)
        ActivityLog.objects.create(
            school=school,
            name=getattr(self.request.user, "username", "Admin"),
            action=f"created class {instance.label()}",
            avatar="C",
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        ActivityLog.objects.create(
            school=instance.school,
            name=getattr(self.request.user, "username", "Admin"),
            action=f"updated class {instance.label()}",
            avatar="C",
        )
