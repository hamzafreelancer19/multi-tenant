from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from django.utils import timezone
from students.models import Student
from teachers.models import Teacher
from attendance.models import Attendance
from fees.models import Fee
from core.models import ActivityLog, Notification
from .serializers import ActivityLogSerializer, NotificationSerializer
from core.utils import get_current_school
from schools.models import School
from django.contrib.auth import get_user_model

User = get_user_model()

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role == 'superadmin':
            # ... existing superadmin logic ...
            total_schools = School.objects.count()
            total_users = User.objects.count()
            recent_schools = School.objects.all().order_by('-created_at')[:5]
            schools_list = [{"id": s.id, "name": s.name, "code": s.code, "created_at": s.created_at} for s in recent_schools]
            return Response({
                "is_superadmin": True,
                "total_schools": total_schools,
                "total_users": total_users,
                "recent_schools": schools_list,
            })

        school = get_current_school(request)
        if not school:
            return Response({"error": "No school context found"}, status=400)
        today = timezone.now().date()

        total_students = Student.objects.filter(school=school).count()
        total_teachers = Teacher.objects.filter(school=school).count()

        # Real attendance rate for today
        today_att = Attendance.objects.filter(school=school, date=today)
        present_count = today_att.filter(status='Present').count()
        total_att = today_att.count()
        attendance_rate = round((present_count / total_att) * 100) if total_att > 0 else 0

        # Fee collections
        fees_collected = Fee.objects.filter(school=school, status='Paid').count()

        return Response({
            "students": total_students,
            "teachers": total_teachers,
            "attendance": attendance_rate,
            "fees_collected": fees_collected,
        })

from datetime import timedelta

class ActivityLogListView(generics.ListAPIView):
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        time_threshold = timezone.now() - timedelta(hours=12)
        
        if user.role == 'superadmin':
            return ActivityLog.objects.filter(school__isnull=True, created_at__gte=time_threshold).order_by('-created_at')[:20]
            
        school = get_current_school(self.request)
        if school:
            return ActivityLog.objects.filter(school=school, created_at__gte=time_threshold).order_by('-created_at')[:10]
        return ActivityLog.objects.none()

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return Notification.objects.filter(school__isnull=True).order_by('-created_at')[:20]
            
        school = get_current_school(self.request)
        if school:
            return Notification.objects.filter(school=school).order_by('-created_at')[:10]
        return Notification.objects.none()

class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            user = request.user
            if user.role == 'superadmin':
                notif = Notification.objects.get(pk=pk, school__isnull=True)
            else:
                school = get_current_school(request)
                notif = Notification.objects.get(pk=pk, school=school)
            
            notif.is_read = True
            notif.save()
            return Response({"status": "read"})
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found"}, status=404)

class MarkAllNotificationsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role == 'superadmin':
            Notification.objects.filter(school__isnull=True, is_read=False).update(is_read=True)
        else:
            school = get_current_school(request)
            if school:
                Notification.objects.filter(school=school, is_read=False).update(is_read=True)
        
        return Response({"status": "all items marked as read"})

class SystemDatabaseView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'superadmin':
            return Response({"error": "Only superadmin can access system explorer"}, status=403)

        model_name = request.query_params.get('model', 'schools')
        
        # Map of models we allow to explore
        model_map = {
            'schools': School,
            'users': User,
            'students': Student,
            'teachers': Teacher,
            'fees': Fee,
            'activities': ActivityLog,
        }

        if model_name not in model_map:
            return Response({"error": "Invalid model name"}, status=400)

        model = model_map[model_name]
        # Get all records across all schools
        data = model.objects.all().order_by('-id')[:100] # Limit to 100 for safety
        
        # Simple manual serialization for raw view
        results = []
        for obj in data:
            row = {}
            for field in obj._meta.fields:
                val = getattr(obj, field.name)
                # Handle relationships and dates
                if hasattr(val, 'pk'):
                    row[field.name] = str(val)
                elif hasattr(val, 'isoformat'):
                    row[field.name] = val.isoformat()
                else:
                    row[field.name] = val
            results.append(row)

        return Response({
            "model": model_name,
            "total_count": model.objects.count(),
            "data": results
        })
