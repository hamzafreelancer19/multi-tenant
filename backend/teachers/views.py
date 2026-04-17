from rest_framework import viewsets
from .models import Teacher
from .serializers import TeacherSerializer
from core.models import ActivityLog, Notification

class TeacherViewSet(viewsets.ModelViewSet):
    serializer_class = TeacherSerializer

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'school') and user.school:
            return Teacher.objects.filter(school=user.school)
        return Teacher.objects.none()

    def perform_create(self, serializer):
        teacher = serializer.save(school=self.request.user.school)
        try:
            ActivityLog.objects.create(
                school=self.request.user.school,
                name=teacher.name,
                action=f"joined as {teacher.subject} Teacher",
                avatar=teacher.name.split(" ")[1][0].upper() if " " in teacher.name else teacher.name[0].upper()
            )
            Notification.objects.create(
                school=self.request.user.school,
                message=f"New teacher {teacher.name} has joined the faculty."
            )
        except Exception as e:
            print(f"[Warning] Could not log teacher activity: {e}")
