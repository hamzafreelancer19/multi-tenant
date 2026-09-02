from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import Attendance, TeacherAttendance
from .serializers import AttendanceSerializer, TeacherAttendanceSerializer
from students.models import Student
from teachers.models import Teacher
from core.models import ActivityLog
from core.utils import get_current_school
from core.mixins import SchoolOpsMixin
from teachers.scoping import apply_teacher_incharge_scope, ensure_incharge_can_access_student


def _marker(request):
    return getattr(request.user, "username", "") or "Admin"


class AttendanceViewSet(SchoolOpsMixin, viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer

    def get_queryset(self):
        school = get_current_school(self.request)
        if not school:
            return Attendance.objects.none()
        qs = apply_teacher_incharge_scope(
            self.request,
            Attendance.objects.filter(school=school).select_related("student"),
            field="student__class_name",
        )
        date = self.request.query_params.get("date")
        if date:
            qs = qs.filter(date=date)
        class_name = self.request.query_params.get("class_name")
        if class_name:
            qs = qs.filter(student__class_name=class_name)
        return qs.order_by("-date")

    def perform_create(self, serializer):
        school = get_current_school(self.request)
        student = serializer.validated_data.get("student")
        if student:
            ensure_incharge_can_access_student(self.request, student)
        serializer.save(
            school=school,
            marked_by=_marker(self.request),
        )

    @action(detail=False, methods=["post"], url_path="bulk")
    def bulk_create(self, request):
        records = request.data.get("records", [])
        if not records:
            return Response({"error": "No records provided."}, status=status.HTTP_400_BAD_REQUEST)

        school = get_current_school(request)
        created_count = 0
        updated_count = 0
        marker = _marker(request)

        for record in records:
            student_id = record.get("student_id")
            rec_status = record.get("status") or "Present"
            date = record.get("date")
            remarks = (record.get("remarks") or "")[:255]

            if not student_id or not date:
                continue
            if rec_status not in dict(Attendance.STATUS_CHOICES):
                continue
            student = Student.objects.filter(id=student_id, school=school).first()
            if not student:
                continue
            try:
                ensure_incharge_can_access_student(request, student)
            except Exception:
                continue

            _, created = Attendance.objects.update_or_create(
                school=school,
                student_id=student_id,
                date=date,
                defaults={
                    "status": rec_status,
                    "remarks": remarks,
                    "marked_by": marker,
                },
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        ActivityLog.objects.create(
            school=school,
            name=marker.capitalize() if marker else "Admin",
            action=f"marked attendance for {created_count + updated_count} students",
            avatar=(marker[:1] or "A").upper(),
        )

        return Response({
            "message": f"Saved {created_count} new and updated {updated_count} existing attendance records.",
            "created": created_count,
            "updated": updated_count,
        }, status=status.HTTP_200_OK)


class TeacherAttendanceViewSet(SchoolOpsMixin, viewsets.ModelViewSet):
    serializer_class = TeacherAttendanceSerializer

    def check_permissions(self, request):
        super().check_permissions(request)
        role = getattr(getattr(request, "user", None), "role", None)
        if role != "admin":
            raise PermissionDenied("Only school admin can mark teacher attendance.")

    def get_queryset(self):
        school = get_current_school(self.request)
        if not school:
            return TeacherAttendance.objects.none()
        qs = TeacherAttendance.objects.filter(school=school).select_related("teacher")
        date = self.request.query_params.get("date")
        if date:
            qs = qs.filter(date=date)
        return qs.order_by("-date")

    def perform_create(self, serializer):
        school = get_current_school(self.request)
        serializer.save(school=school, marked_by=_marker(self.request))

    @action(detail=False, methods=["post"], url_path="bulk")
    def bulk_create(self, request):
        records = request.data.get("records", [])
        if not records:
            return Response({"error": "No records provided."}, status=status.HTTP_400_BAD_REQUEST)

        school = get_current_school(request)
        created_count = 0
        updated_count = 0
        marker = _marker(request)

        for record in records:
            teacher_id = record.get("teacher_id")
            rec_status = record.get("status") or "Present"
            date = record.get("date")
            remarks = (record.get("remarks") or "")[:255]

            if not teacher_id or not date:
                continue
            if rec_status not in dict(TeacherAttendance.STATUS_CHOICES):
                continue
            teacher = Teacher.objects.filter(id=teacher_id, school=school).first()
            if not teacher:
                continue

            _, created = TeacherAttendance.objects.update_or_create(
                school=school,
                teacher_id=teacher_id,
                date=date,
                defaults={
                    "status": rec_status,
                    "remarks": remarks,
                    "marked_by": marker,
                },
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        ActivityLog.objects.create(
            school=school,
            name=marker.capitalize() if marker else "Admin",
            action=f"marked attendance for {created_count + updated_count} teachers",
            avatar=(marker[:1] or "A").upper(),
        )

        return Response({
            "message": f"Saved {created_count} new and updated {updated_count} existing teacher attendance records.",
            "created": created_count,
            "updated": updated_count,
        }, status=status.HTTP_200_OK)
