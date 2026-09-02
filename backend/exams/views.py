from django.db.models import Count
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Subject, Exam, ExamResult
from .serializers import SubjectSerializer, ExamSerializer, ExamResultSerializer, letter_grade
from students.models import Student
from core.utils import get_current_school, school_queryset
from core.mixins import SchoolOpsMixin
from core.models import ActivityLog
from teachers.scoping import apply_teacher_class_scope, ensure_teacher_can_access_class, ensure_teacher_can_access_student


class SubjectViewSet(SchoolOpsMixin, viewsets.ModelViewSet):
    serializer_class = SubjectSerializer

    def get_queryset(self):
        return school_queryset(self.request, Subject)

    def perform_create(self, serializer):
        school = get_current_school(self.request)
        serializer.save(school=school)


class ExamViewSet(SchoolOpsMixin, viewsets.ModelViewSet):
    serializer_class = ExamSerializer

    def get_queryset(self):
        return apply_teacher_class_scope(
            self.request,
            school_queryset(self.request, Exam).annotate(result_count=Count("results")),
        )

    def perform_create(self, serializer):
        school = get_current_school(self.request)
        ensure_teacher_can_access_class(self.request, serializer.validated_data.get("class_name"))
        exam = serializer.save(school=school)
        ActivityLog.objects.create(
            school=school,
            name=getattr(self.request.user, "username", "Admin"),
            action=f"scheduled exam {exam.title}",
            avatar="E",
        )

    @action(detail=True, methods=["get", "post"], url_path="results")
    def exam_results(self, request, pk=None):
        exam = self.get_object()
        if request.method == "GET":
            rows = ExamResult.objects.filter(exam=exam).select_related("student", "subject")
            return Response(ExamResultSerializer(rows, many=True).data)

        school = exam.school
        subject_name = (request.data.get("subject") or exam.subject or "General").strip() or "General"
        subject = Subject.objects.filter(school=school, name=subject_name).first()
        if not subject:
            subject = Subject.objects.create(school=school, name=subject_name, code="")
        total = request.data.get("total_marks") or exam.total_marks or 100
        saved = 0

        for row in request.data.get("results") or []:
            student_id = row.get("student_id")
            marks = row.get("marks_obtained")
            if not student_id or marks in (None, ""):
                continue
            student = Student.objects.filter(id=student_id, school=school).first()
            if not student:
                continue
            try:
                ensure_teacher_can_access_student(request, student)
            except Exception:
                continue
            obtained = float(marks)
            ExamResult.objects.update_or_create(
                student_id=student_id,
                exam=exam,
                subject=subject,
                defaults={
                    "marks_obtained": obtained,
                    "total_marks": float(row.get("total_marks") or total),
                    "grade": letter_grade(obtained, row.get("total_marks") or total),
                    "remarks": row.get("remarks") or "",
                },
            )
            saved += 1

        ActivityLog.objects.create(
            school=school,
            name=getattr(request.user, "username", "Admin"),
            action=f"entered {saved} results for {exam.title}",
            avatar="E",
        )
        rows = ExamResult.objects.filter(exam=exam, subject=subject).select_related("student", "subject")
        return Response({"saved": saved, "results": ExamResultSerializer(rows, many=True).data}, status=status.HTTP_200_OK)


class ExamResultViewSet(SchoolOpsMixin, viewsets.ModelViewSet):
    serializer_class = ExamResultSerializer

    def get_queryset(self):
        qs = apply_teacher_class_scope(
            self.request,
            school_queryset(self.request, ExamResult, lookup="exam__school").select_related("student", "subject", "exam"),
            field="student__class_name",
        )
        exam_id = self.request.query_params.get("exam")
        if exam_id:
            qs = qs.filter(exam_id=exam_id)
        return qs
