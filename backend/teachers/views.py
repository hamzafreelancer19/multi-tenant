from rest_framework import viewsets
from .models import Teacher
from .serializers import TeacherSerializer
from core.models import ActivityLog, Notification

from core.utils import get_current_school

class TeacherViewSet(viewsets.ModelViewSet):
    serializer_class = TeacherSerializer

    def get_queryset(self):
        school = get_current_school(self.request)
        if school:
            return Teacher.objects.filter(school=school)
        return Teacher.objects.none()

    def perform_create(self, serializer):
        school = get_current_school(self.request)
        teacher = serializer.save(school=school)
        try:
            ActivityLog.objects.create(
                school=school,
                name=teacher.name,
                action=f"joined as {teacher.subject} Teacher",
                avatar=teacher.name.split(" ")[1][0].upper() if " " in teacher.name else teacher.name[0].upper()
            )
            Notification.objects.create(
                school=school,
                message=f"New teacher {teacher.name} has joined the faculty."
            )
        except Exception as e:
            print(f"[Warning] Could not log teacher activity: {e}")
