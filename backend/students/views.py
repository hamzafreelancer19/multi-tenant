from rest_framework import viewsets
import random
from .models import Student
from .serializers import StudentSerializer
from core.models import ActivityLog, Notification

class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer

    def get_queryset(self):
        """
        Filter students by the user's school.
        """
        user = self.request.user
        if hasattr(user, 'school') and user.school:
            return Student.objects.filter(school=user.school)
        return Student.objects.none()

    def perform_create(self, serializer):
        """
        Automatically assign the student to the user's school and generate roll_no.
        """
        school = self.request.user.school
        # Auto-generate a random roll number (e.g., R-8492)
        random_roll = f"R-{random.randint(1000, 9999)}"
        student = serializer.save(school=school, roll_no=random_roll)

        # Create Activity Log & Notification (non-blocking)
        try:
            ActivityLog.objects.create(
                school=school,
                name=student.name,
                action=f"enrolled in {student.class_name}",
                avatar=student.name[0].upper() if student.name else "S"
            )
            Notification.objects.create(
                school=school,
                message=f"New student {student.name} was added to {student.class_name}."
            )
        except Exception as e:
            print(f"[Warning] Could not create activity log: {e}")
