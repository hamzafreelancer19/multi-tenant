from rest_framework import viewsets
import random
from .models import Student
from .serializers import StudentSerializer
from core.models import ActivityLog, Notification
from core.utils import get_current_school
from core.plan_limits import check_student_limit


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
        Enforces plan-based student limits before saving.
        """
        school = get_current_school(self.request)

        # ---- Plan Enforcement ----
        check_student_limit(school)
        # --------------------------

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

    from rest_framework.decorators import action
    from rest_framework.response import Response

    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        """
        AI-powered bulk deletion of students by class.
        """
        school = get_current_school(request)
        class_name = request.data.get('class_name')
        count = request.data.get('count')

        if not class_name:
            return Response({"error": "Class name is required"}, status=400)

        queryset = Student.objects.filter(school=school, class_name=class_name)
        
        if count:
            try:
                count = int(count)
                # Select the first 'count' students
                ids_to_delete = queryset.values_list('id', flat=True)[:count]
                queryset = Student.objects.filter(id__in=ids_to_delete)
            except ValueError:
                return Response({"error": "Invalid count"}, status=400)

        deleted_count, _ = queryset.delete()

        ActivityLog.objects.create(
            school=school,
            name="System Admin",
            action=f"deleted {deleted_count} students from {class_name}",
            avatar="A"
        )

        return Response({
            "message": f"Successfully deleted {deleted_count} students from {class_name}",
            "deleted_count": deleted_count
        })
