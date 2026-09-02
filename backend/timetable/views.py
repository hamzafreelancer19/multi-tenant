from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from .models import PeriodCover, Timetable
from .serializers import TimetableSerializer
from .services import (
    free_teachers_for_period,
    parse_cover_date,
    serialize_period,
    weekday_name,
)
from core.utils import get_current_school, school_queryset
from core.mixins import SchoolOpsMixin
from core.models import ActivityLog
from teachers.models import Teacher
from teachers.scoping import (
    apply_teacher_class_scope,
    class_name_allowed,
    ensure_incharge_or_admin,
    ensure_teacher_can_access_class,
    get_teacher_for_request,
    request_role,
    teacher_incharge_labels,
)


class TimetableViewSet(SchoolOpsMixin, viewsets.ModelViewSet):
    serializer_class = TimetableSerializer

    def check_permissions(self, request):
        super().check_permissions(request)
        if request.method not in ("GET", "HEAD", "OPTIONS") and getattr(request.user, "role", None) == "student":
            raise PermissionDenied("Students can view the timetable only.")

    def get_queryset(self):
        qs = apply_teacher_class_scope(
            self.request,
            school_queryset(self.request, Timetable).select_related("teacher").order_by("day", "start_time"),
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
        slot = serializer.save(school=school)
        ActivityLog.objects.create(
            school=school,
            name=getattr(self.request.user, "username", "Admin"),
            action=f"added {slot.subject} period for {slot.class_name} on {slot.day}",
            avatar="T",
        )

    @action(detail=False, methods=["get"], url_path="cover-board")
    def cover_board(self, request):
        school = get_current_school(request)
        if not school:
            return Response({"date": "", "day": "", "classes": []})
        cover_date = parse_cover_date(request.query_params.get("date"))
        day = weekday_name(cover_date)
        class_name = (request.query_params.get("class_name") or "").strip()
        role = request_role(request)
        teacher = get_teacher_for_request(request)
        incharge_labels = teacher_incharge_labels(teacher) if teacher else set()

        if role == "admin":
            if class_name:
                slots = Timetable.objects.filter(school=school, day=day)
                view_names = {row.class_name for row in slots if class_name_allowed(row.class_name, {class_name})}
            else:
                view_names = set(
                    Timetable.objects.filter(school=school, day=day).values_list("class_name", flat=True)
                )
        else:
            allowed = {class_name} if class_name else incharge_labels
            if class_name:
                ensure_teacher_can_access_class(request, class_name)
            slots = Timetable.objects.filter(school=school, day=day)
            view_names = {row.class_name for row in slots if class_name_allowed(row.class_name, allowed)}

        periods = list(
            Timetable.objects.filter(school=school, day=day, class_name__in=view_names or [""])
            .select_related("teacher")
            .order_by("class_name", "start_time")
        )
        covers = {
            row.period_id: row
            for row in PeriodCover.objects.filter(school=school, date=cover_date, period__in=periods)
            .select_related("cover_teacher")
        }
        grouped = {}
        for period in periods:
            grouped.setdefault(period.class_name, []).append(serialize_period(period, covers.get(period.id)))

        classes = []
        for label in sorted(grouped.keys(), key=lambda item: item.lower()):
            classes.append({
                "label": label,
                "can_cover": role == "admin" or class_name_allowed(label, incharge_labels),
                "periods": grouped[label],
            })
        return Response({
            "date": cover_date.isoformat(),
            "day": day,
            "classes": classes,
        })

    @action(detail=True, methods=["get"], url_path="free-teachers")
    def free_teachers(self, request, pk=None):
        period = self.get_object()
        ensure_incharge_or_admin(request, period.class_name)
        cover_date = parse_cover_date(request.query_params.get("date"))
        if weekday_name(cover_date) != period.day:
            return Response({"date": cover_date.isoformat(), "teachers": []})
        return Response({
            "date": cover_date.isoformat(),
            "period": serialize_period(period),
            "teachers": free_teachers_for_period(period, cover_date),
        })

    @action(detail=True, methods=["post", "delete"], url_path="cover")
    def cover(self, request, pk=None):
        period = self.get_object()
        ensure_incharge_or_admin(request, period.class_name)
        if period.period_type == "Break":
            raise ValidationError("Break periods do not need a cover teacher.")
        cover_date = parse_cover_date(request.data.get("date") or request.query_params.get("date"))
        if weekday_name(cover_date) != period.day:
            raise ValidationError({"date": f"This period is on {period.day}."})

        if request.method == "DELETE":
            deleted, _ = PeriodCover.objects.filter(period=period, date=cover_date).delete()
            return Response({"removed": bool(deleted), "date": cover_date.isoformat()})

        teacher_id = request.data.get("teacher") or request.data.get("teacher_id")
        cover_teacher = Teacher.objects.filter(id=teacher_id, school=period.school).exclude(status="Inactive").first()
        if not cover_teacher:
            raise ValidationError({"teacher": "Choose a teacher who is free in this period."})
        if period.teacher_id and cover_teacher.id == period.teacher_id:
            raise ValidationError({"teacher": "Pick a different teacher. This is already the regular teacher."})

        free_ids = {row["id"] for row in free_teachers_for_period(period, cover_date)}
        if cover_teacher.id not in free_ids:
            raise ValidationError({"teacher": f"{cover_teacher.name} already has a class at this time."})

        cover, _created = PeriodCover.objects.update_or_create(
            period=period,
            date=cover_date,
            defaults={
                "school": period.school,
                "cover_teacher": cover_teacher,
                "reason": (request.data.get("reason") or "")[:255],
                "created_by": getattr(request.user, "username", "") or "",
            },
        )
        ActivityLog.objects.create(
            school=period.school,
            name=getattr(request.user, "username", "Admin"),
            action=f"assigned {cover_teacher.name} to cover {period.subject} for {period.class_name} on {cover_date}",
            avatar="T",
        )
        return Response(serialize_period(period, cover), status=status.HTTP_200_OK)
