from rest_framework import viewsets
from .models import Notice
from .serializers import NoticeSerializer
from core.utils import get_current_school

class NoticeViewSet(viewsets.ModelViewSet):
    serializer_class = NoticeSerializer

    def get_queryset(self):
        school = get_current_school(self.request)
        if school:
            return Notice.objects.filter(school=school).order_by('-created_at')
        return Notice.objects.none()

    def perform_create(self, serializer):
        school = get_current_school(self.request)
        serializer.save(school=school)
