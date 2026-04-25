from rest_framework import viewsets
import random
from .models import Student
from .serializers import StudentSerializer
from core.models import ActivityLog, Notification

from core.utils import get_current_school

class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer

    def get_queryset(self):
        """
        Filter students by the current school context.
        """
        school = get_current_school(self.request)
        if school:
            return Student.objects.filter(school=school)
        return Student.objects.none()

    def perform_create(self, serializer):
        """
        Automatically assign the student to the current school context.
        """
        school = get_current_school(self.request)
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
