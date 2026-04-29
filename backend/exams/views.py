from rest_framework import viewsets, permissions
from .models import Subject, Exam, ExamResult
from .serializers import SubjectSerializer, ExamSerializer, ExamResultSerializer
from core.utils import get_current_school

class SubjectViewSet(viewsets.ModelViewSet):
    serializer_class = SubjectSerializer

    def get_queryset(self):
        school = get_current_school(self.request)
        if school:
            return Subject.objects.filter(school=school)
        return Subject.objects.none()

    def perform_create(self, serializer):
        school = get_current_school(self.request)
        serializer.save(school=school)

class ExamViewSet(viewsets.ModelViewSet):
    serializer_class = ExamSerializer

    def get_queryset(self):
        school = get_current_school(self.request)
        if school:
            return Exam.objects.filter(school=school)
        return Exam.objects.none()

    def perform_create(self, serializer):
        school = get_current_school(self.request)
        serializer.save(school=school)

class ExamResultViewSet(viewsets.ModelViewSet):
    serializer_class = ExamResultSerializer

    def get_queryset(self):
        school = get_current_school(self.request)
        if school:
            return ExamResult.objects.filter(exam__school=school)
        return ExamResult.objects.none()
