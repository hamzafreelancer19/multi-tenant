from rest_framework import viewsets
from .models import SchoolClass
from .serializers import SchoolClassSerializer
from core.utils import get_current_school

class SchoolClassViewSet(viewsets.ModelViewSet):
    serializer_class = SchoolClassSerializer

    def get_queryset(self):
        school = get_current_school(self.request)
        if school:
            return SchoolClass.objects.filter(school=school)
        return SchoolClass.objects.none()

    def perform_create(self, serializer):
        school = get_current_school(self.request)
        serializer.save(school=school)
