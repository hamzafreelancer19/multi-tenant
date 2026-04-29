from rest_framework import viewsets
from .models import Assignment
from .serializers import AssignmentSerializer
from core.utils import get_current_school

class AssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer

    def get_queryset(self):
        school = get_current_school(self.request)
        if school:
            return Assignment.objects.filter(school=school).order_by('-created_at')
        return Assignment.objects.none()

    def perform_create(self, serializer):
        school = get_current_school(self.request)
        serializer.save(school=school)
