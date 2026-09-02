from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import generics
from django.utils import timezone
from students.models import Student
from teachers.models import Teacher
from attendance.models import Attendance, TeacherAttendance
from fees.models import Fee
from core.models import ActivityLog, Notification
from .serializers import ActivityLogSerializer, NotificationSerializer
from core.utils import get_current_school
from schools.models import School
from django.contrib.auth import get_user_model
from users.presence import touch_presence

User = get_user_model()

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role == 'superadmin':
            from django.db.models import Sum, Count
            from django.db.models.functions import TruncMonth
            total_schools = School.objects.count()
            total_users = User.objects.count()
            pending_schools = School.objects.filter(status='Pending').count()
            approved_schools = School.objects.filter(status='Approved').count()
            pending_plans = School.objects.filter(plan_status='Pending').count()
            active_plans = School.objects.filter(plan_status='Active').count()
            plan_revenue = School.objects.filter(plan_status='Active').aggregate(total=Sum('plan_amount'))['total'] or 0
            recent_schools = School.objects.all().order_by('-created_at')[:8]
            schools_list = [{
                "id": s.id,
                "name": s.name,
                "code": s.code,
                "status": s.status,
                "plan_type": s.plan_type,
                "plan_status": s.plan_status,
                "created_at": s.created_at,
            } for s in recent_schools]
            pending_school_list = [{
                "id": s.id, "name": s.name, "code": s.code, "created_at": s.created_at
            } for s in School.objects.filter(status='Pending').order_by('-created_at')[:8]]
            pending_plan_list = [{
                "id": s.id, "name": s.name, "plan_type": s.plan_type, "transaction_id": s.transaction_id
            } for s in School.objects.filter(plan_status='Pending').order_by('-created_at')[:8]]
            monthly = (
                School.objects
                .annotate(month=TruncMonth('created_at'))
                .values('month')
                .annotate(count=Count('id'))
                .order_by('month')
            )
            monthly_signups = [
                {"name": row["month"].strftime("%b") if row["month"] else "—", "schools": row["count"]}
                for row in monthly if row["month"]
            ][-8:]
            plan_breakdown = [
                {"name": row["plan_type"] or "None", "count": row["c"]}
                for row in School.objects.values('plan_type').annotate(c=Count('id')).order_by('-c')
            ]
            return Response({
                "is_superadmin": True,
                "total_schools": total_schools,
                "total_users": total_users,
                "pending_schools": pending_schools,
                "approved_schools": approved_schools,
                "pending_plans": pending_plans,
                "active_plans": active_plans,
                "plan_revenue": float(plan_revenue),
                "recent_schools": schools_list,
                "pending_school_list": pending_school_list,
                "pending_plan_list": pending_plan_list,
                "monthly_signups": monthly_signups,
                "plan_breakdown": plan_breakdown,
            })

        school = get_current_school(request)
        if not school:
            return Response({"error": "No school context found"}, status=400)
        today = timezone.now().date()

        if user.role == 'teacher':
            from assignments.models import Assignment
            from notices.models import Notice
            from teachers.scoping import get_teacher_for_request, teacher_class_labels
            labels = teacher_class_labels(get_teacher_for_request(request))
            total_assignments = Assignment.objects.filter(school=school, class_name__in=labels).count() if labels else 0
            total_notices = Notice.objects.filter(school=school).count()
            total_students = Student.objects.filter(school=school, class_name__in=labels).count() if labels else 0

            return Response({
                "role": "teacher",
                "assignments": total_assignments,
                "notices": total_notices,
                "students": total_students,
                "attendance": 0
            })

        if user.role == 'student':
            # Try to find student record by email
            student_obj = Student.objects.filter(school=school, email=user.username).first()
            if student_obj:
                my_attendance = Attendance.objects.filter(school=school, student_id=student_obj.id)
                present_days = my_attendance.filter(status='Present').count()
                total_days = my_attendance.count()
                att_rate = round((present_days / total_days) * 100) if total_days > 0 else 0
                
                my_fees = Fee.objects.filter(school=school, student_id=student_obj.id)
                pending_fees = my_fees.exclude(status='Paid').count()
                
                from assignments.models import Assignment
                total_homework = Assignment.objects.filter(school=school, class_name=student_obj.class_name).count()
                
                return Response({
                    "role": "student",
                    "attendance": att_rate,
                    "pending_fees": pending_fees,
                    "homework": total_homework,
                    "class_name": student_obj.class_name
                })

        total_students = Student.objects.filter(school=school).count()
        total_teachers = Teacher.objects.filter(school=school).count()

        today_att = TeacherAttendance.objects.filter(school=school, date=today)
        present_count = today_att.filter(status__in=['Present', 'Late']).count()
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
        qs = ActivityLog.objects.all().order_by('-created_at')

        if user.role == 'superadmin':
            days = self.request.query_params.get('days')
            if days:
                try:
                    days = max(1, min(int(days), 90))
                except (TypeError, ValueError):
                    days = 14
                since = timezone.now() - timedelta(days=days)
                return qs.filter(created_at__gte=since)[:80]
            since = timezone.now() - timedelta(hours=12)
            return qs.filter(created_at__gte=since)[:20]

        school = get_current_school(self.request)
        if school:
            since = timezone.now() - timedelta(hours=12)
            return qs.filter(school=school, created_at__gte=since)[:10]
        return ActivityLog.objects.none()

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from core.notify import visible_notifications

        touch_presence(self.request.user)
        return visible_notifications(self.request, unread_only=True)[:30]


class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        from core.notify import mark_notification_read, visible_notifications

        notif = visible_notifications(request, unread_only=False).filter(pk=pk).first()
        if not notif:
            return Response({"error": "Notification not found"}, status=404)
        mark_notification_read(notif, request.user)
        return Response({"status": "read"})


class MarkAllNotificationsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from core.notify import mark_notification_read, visible_notifications

        rows = list(visible_notifications(request, unread_only=True)[:80])
        for notif in rows:
            mark_notification_read(notif, request.user)
        return Response({"status": "all items marked as read"})

class SystemDatabaseView(APIView):
    permission_classes = [IsAuthenticated]
    HIDDEN_FIELDS = {"password", "ai_api_key", "groq_api_key"}

    def _model_map(self):
        from schools.models import Enrollment
        from notices.models import Notice
        from exams.models import Exam, ExamResult, Subject
        from timetable.models import Timetable, PeriodCover
        from assignments.models import Assignment
        from classes.models import SchoolClass
        from library.models import Book, IssueReturn
        from transport.models import Vehicle, Route
        from staff.models import Staff, Payroll
        from inventory.models import InventoryItem, StockLog
        from core.models import Notification as PlatformNotification
        from chat.models import ChatThread, ChatMessage, ChatParticipant

        return {
            "schools": School,
            "users": User,
            "students": Student,
            "teachers": Teacher,
            "fees": Fee,
            "attendance": Attendance,
            "teacher_attendance": TeacherAttendance,
            "enrollments": Enrollment,
            "exams": Exam,
            "subjects": Subject,
            "results": ExamResult,
            "notices": Notice,
            "timetable": Timetable,
            "period_covers": PeriodCover,
            "assignments": Assignment,
            "classes": SchoolClass,
            "books": Book,
            "issues": IssueReturn,
            "vehicles": Vehicle,
            "routes": Route,
            "staff": Staff,
            "payroll": Payroll,
            "inventory": InventoryItem,
            "stock_logs": StockLog,
            "activities": ActivityLog,
            "notifications": PlatformNotification,
            "chat_threads": ChatThread,
            "chat_messages": ChatMessage,
            "chat_participants": ChatParticipant,
        }

    def _serialize_value(self, val):
        from django.db.models import Model as DjangoModel
        from django.db.models.fields.files import FieldFile
        from decimal import Decimal

        if val is None:
            return None
        if isinstance(val, FieldFile):
            name = getattr(val, "name", None) or ""
            if not name:
                return None
            try:
                return val.url
            except ValueError:
                return name
        if isinstance(val, DjangoModel):
            return str(val)
        if isinstance(val, (dict, list)):
            return val
        if isinstance(val, Decimal):
            return str(val)
        if hasattr(val, "isoformat") and not isinstance(val, (str, bytes)):
            try:
                return val.isoformat()
            except Exception:
                return str(val)
        if isinstance(val, (str, int, float, bool)):
            return val
        return str(val)

    def _serialize_row(self, obj):
        row = {}
        for field in obj._meta.fields:
            if field.name in self.HIDDEN_FIELDS:
                continue
            try:
                row[field.name] = self._serialize_value(getattr(obj, field.name, None))
            except Exception:
                row[field.name] = None
        return row

    def _apply_school(self, qs, model, school_id):
        if not school_id:
            return qs
        names = {f.name for f in model._meta.fields}
        if "school" in names:
            return qs.filter(school_id=school_id)
        if "thread" in names:
            return qs.filter(thread__school_id=school_id)
        return qs

    def _apply_search(self, qs, model, q):
        if not q or len(q) < 2:
            return qs
        from django.db.models import Q, CharField, TextField, EmailField

        query = Q()
        has_field = False
        for field in model._meta.fields:
            if field.name in self.HIDDEN_FIELDS:
                continue
            if isinstance(field, (CharField, TextField, EmailField)):
                query |= Q(**{f"{field.name}__icontains": q})
                has_field = True
        return qs.filter(query) if has_field else qs

    def get(self, request):
        if getattr(request.user, "role", None) != "superadmin":
            return Response({"error": "Only superadmin can access system explorer"}, status=403)

        model_map = self._model_map()
        if request.query_params.get("summary") == "1":
            return Response({
                "counts": {name: model.objects.count() for name, model in model_map.items()}
            })

        model_name = request.query_params.get("model", "schools")
        if model_name not in model_map:
            return Response({"error": "Invalid model name"}, status=400)

        model = model_map[model_name]
        try:
            limit = max(20, min(int(request.query_params.get("limit") or 100), 200))
        except (TypeError, ValueError):
            limit = 100
        school_id = request.query_params.get("school") or ""
        q = (request.query_params.get("q") or "").strip()

        qs = model.objects.all()
        qs = self._apply_school(qs, model, school_id)
        qs = self._apply_search(qs, model, q)
        total = qs.count()
        try:
            rows = qs.order_by("-pk")[:limit]
        except Exception:
            rows = qs[:limit]

        return Response({
            "model": model_name,
            "total_count": total,
            "shown": min(limit, total),
            "data": [self._serialize_row(obj) for obj in rows],
        })

from .ai_agent import process_ai_message, process_platform_message


class PlatformStatusView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        from core.platform import public_status
        return Response(public_status())


class GlobalSettingView(APIView):
    permission_classes = [IsAuthenticated]

    def _payload(self, gs):
        key = gs.groq_api_key or ""
        return {
            "id": gs.id,
            "name": gs.name,
            "support_email": gs.support_email or "",
            "support_phone": gs.support_phone or "",
            "allow_signup": bool(gs.allow_signup),
            "maintenance_mode": bool(gs.maintenance_mode),
            "groq_api_key_set": bool(key),
            "groq_api_key": f"••••{key[-4:]}" if len(key) >= 4 else "",
            "updated_at": gs.updated_at,
        }

    def get(self, request):
        if getattr(request.user, "role", None) != "superadmin":
            return Response({"error": "Only superadmin can access platform settings"}, status=403)
        from core.models import GlobalSetting
        return Response(self._payload(GlobalSetting.load()))

    def patch(self, request):
        if getattr(request.user, "role", None) != "superadmin":
            return Response({"error": "Only superadmin can update platform settings"}, status=403)
        from core.models import GlobalSetting, ActivityLog
        gs = GlobalSetting.load()
        if "name" in request.data:
            gs.name = (request.data.get("name") or gs.name).strip() or gs.name
        if "support_email" in request.data:
            gs.support_email = (request.data.get("support_email") or "").strip()
        if "support_phone" in request.data:
            gs.support_phone = (request.data.get("support_phone") or "").strip()
        if "allow_signup" in request.data:
            from core.platform import parse_bool
            gs.allow_signup = parse_bool(request.data.get("allow_signup"), gs.allow_signup)
        if "maintenance_mode" in request.data:
            from core.platform import parse_bool
            gs.maintenance_mode = parse_bool(request.data.get("maintenance_mode"), gs.maintenance_mode)
        key = request.data.get("groq_api_key")
        if isinstance(key, str) and key.strip() and "•" not in key:
            gs.groq_api_key = key.strip()
        gs.save()
        ActivityLog.objects.create(
            school=None,
            name=request.user.username,
            action="updated platform settings",
            avatar="S",
        )
        return Response(self._payload(gs))

class AIChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = request.data.get("message")
        if not message:
            return Response({"error": "Message is required"}, status=400)

        history = request.data.get("history", [])
        if getattr(request.user, "role", None) == "superadmin":
            return Response(process_platform_message(message, history))

        school = get_current_school(request)
        if school and school.plan_type not in ["Business", "Pro"]:
            return Response({
                "reply": "⚠️ AI Assistant aapke current plan (Basic) par available nahi hai. Please Business ya Pro plan par upgrade karein taake aap is feature ka faida utha sakein."
            })

        school_id = school.id if school else None
        return Response(process_ai_message(message, school_id, history))
