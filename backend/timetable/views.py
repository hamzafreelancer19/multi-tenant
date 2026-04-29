from rest_framework import viewsets
from .models import Timetable
from .serializers import TimetableSerializer
from core.utils import get_current_school

class TimetableViewSet(viewsets.ModelViewSet):
    serializer_class = TimetableSerializer

    def get_queryset(self):
        school = get_current_school(self.request)
        if school:
            return Timetable.objects.filter(school=school).order_by('day', 'start_time')
        return Timetable.objects.none()

    def perform_create(self, serializer):
        school = get_current_school(self.request)
        serializer.save(school=school)
