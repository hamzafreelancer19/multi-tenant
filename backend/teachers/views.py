from rest_framework import viewsets
from .models import Teacher
from .serializers import TeacherSerializer
from core.models import ActivityLog, Notification
from core.utils import get_current_school
from core.plan_limits import check_teacher_limit


from django.contrib.auth import get_user_model
User = get_user_model()
from django.utils.text import slugify

class TeacherViewSet(viewsets.ModelViewSet):
    serializer_class = TeacherSerializer

    def get_queryset(self):
        school = get_current_school(self.request)
        if school:
            return Teacher.objects.filter(school=school)
        return Teacher.objects.none()

    def perform_create(self, serializer):
        school = get_current_school(self.request)

        # ---- Plan Enforcement ----
        check_teacher_limit(school)
        # --------------------------

        teacher = serializer.save(school=school)
        
        # Create User account for Teacher
        try:
            # Pattern: [name]@[school_name].com
            name_slug = slugify(teacher.name)
            school_slug = slugify(school.name)
            username = f"{name_slug}@{school_slug}.com"
            
            # Ensure unique username
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{name_slug}{counter}@{school_slug}.com"
                counter += 1
            
            user = User.objects.create(
                username=username,
                email=username, # Use same as username for login ease
                role="teacher",
                school=school
            )
            user.set_password("Teacher@123") # Default password
            user.save()
            
            # Update teacher email if it was empty
            if not teacher.email:
                teacher.email = username
                teacher.save()

            ActivityLog.objects.create(
                school=school,
                name=teacher.name,
                action=f"joined as {teacher.subject} Teacher (User: {username})",
                avatar=teacher.name.split(" ")[1][0].upper() if " " in teacher.name else teacher.name[0].upper()
            )
            Notification.objects.create(
                school=school,
                message=f"New teacher {teacher.name} has joined the faculty. Login: {username}"
            )
        except Exception as e:
            print(f"[Warning] Could not create teacher user: {e}")


