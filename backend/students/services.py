from django.contrib.auth import get_user_model
from django.utils.text import slugify

from .models import Student

User = get_user_model()


def next_roll_no(school):
    prefix = "ST-"
    rolls = Student.objects.filter(school=school, roll_no__startswith=prefix).values_list("roll_no", flat=True)
    nums = []
    for roll in rolls:
        try:
            nums.append(int(str(roll).replace(prefix, "", 1)))
        except (TypeError, ValueError):
            continue
    n = (max(nums) if nums else 0) + 1
    while Student.objects.filter(school=school, roll_no=f"{prefix}{n:04d}").exists():
        n += 1
    return f"{prefix}{n:04d}"


def student_portal_username(student):
    school = getattr(student, "school", None)
    if not student.roll_no or not school:
        return ""
    return f"{student.roll_no}@{slugify(school.name) or 'school'}.com"


def ensure_portal_user(student):
    school = student.school
    if not student.roll_no:
        student.roll_no = next_roll_no(school)
        student.save(update_fields=["roll_no"])

    username = student_portal_username(student)
    existing = User.objects.filter(username__iexact=username).first()
    if existing:
        return existing.username

    while User.objects.filter(username__iexact=username).exists():
        student.roll_no = next_roll_no(school)
        student.save(update_fields=["roll_no"])
        username = student_portal_username(student)

    user = User.objects.create(
        username=username,
        email=student.email or username,
        role="student",
        school=school,
    )
    user.set_password("Student@123")
    user.save()
    return username


def parent_username_from_name(name):
    import re
    text = re.sub(r"[^a-z0-9]+", ".", (name or "").strip().lower()).strip(".")
    return (text[:40] or "parent")


def ensure_parent_user(student, reset_password=False):
    school = student.school
    if student.parent_user_id:
        user = student.parent_user
        if reset_password:
            user.set_password(user.username)
            user.is_active = True
            user.save(update_fields=["password", "is_active"])
        return user.username, user.username if reset_password else None

    base = parent_username_from_name(student.name)
    username = base
    n = 2
    while User.objects.filter(username__iexact=username).exists():
        username = f"{base}{n}"
        n += 1

    user = User.objects.create(
        username=username,
        email=student.email or "",
        first_name=(f"{student.name} parent").strip()[:150],
        last_name="",
        role="parent",
        school=school,
        phone=student.father_phone or student.mother_phone or "",
    )
    user.set_password(username)
    user.save()
    student.parent_user = user
    student.save(update_fields=["parent_user"])
    return username, username


def backfill_missing_logins(queryset=None):
    """Create name-based parent logins (and student portal users) for existing records."""
    rows = queryset if queryset is not None else Student.objects.all()
    rows = rows.select_related("school", "parent_user")
    parents = 0
    students = 0
    for student in rows:
        try:
            if not student.parent_user_id:
                ensure_parent_user(student)
                parents += 1
        except Exception as e:
            print(f"[Warning] Parent login for {getattr(student, 'name', student.pk)}: {e}")
        try:
            username = student_portal_username(student)
            if username and not User.objects.filter(username__iexact=username).exists():
                ensure_portal_user(student)
                students += 1
        except Exception as e:
            print(f"[Warning] Student login for {getattr(student, 'name', student.pk)}: {e}")
    return {"parents_created": parents, "students_created": students}


def get_child_for_parent(request):
    user = getattr(request, "user", None)
    if not user or getattr(user, "role", None) != "parent":
        return None
    return Student.objects.filter(parent_user=user).select_related("school").first()


def _iso(value):
    if value is None:
        return ""
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def _hhmm(value):
    return value.strftime("%H:%M") if value else ""


def class_incharge_for(school, class_name):
    from classes.models import SchoolClass

    rows = SchoolClass.objects.filter(school=school).select_related("class_teacher")
    for sc in rows:
        if sc.label() == class_name or sc.name == class_name:
            teacher = sc.class_teacher
            return {
                "class_label": sc.label(),
                "room_no": sc.room_no or "",
                "shift": sc.shift or "",
                "name": teacher.name if teacher else "",
                "phone": teacher.phone if teacher else "",
                "subject": teacher.subject if teacher else "",
            }
    return {"class_label": class_name or "", "room_no": "", "shift": "", "name": "", "phone": "", "subject": ""}


def parent_portal_payload(child, serializer_data):
    from attendance.models import Attendance
    from fees.models import Fee
    from exams.models import Exam, ExamResult
    from assignments.models import Assignment
    from timetable.models import Timetable
    from notices.models import Notice
    from django.db.models import Q, Sum

    school = child.school
    class_name = child.class_name
    att_qs = Attendance.objects.filter(student=child)
    present = att_qs.filter(status="Present").count()
    absent = att_qs.filter(status="Absent").count()
    late = att_qs.filter(status="Late").count()
    leave = att_qs.filter(status="Leave").count()
    total_att = att_qs.count()
    fee_qs = Fee.objects.filter(student=child)
    paid_total = fee_qs.filter(status="Paid").aggregate(total=Sum("paid_amount"))["total"] or 0
    pending_fees = fee_qs.exclude(status="Paid")

    library = []
    try:
        from library.models import IssueReturn
        library = [
            {
                "id": row.id,
                "title": row.book.title if row.book_id else "",
                "author": row.book.author if row.book_id else "",
                "issue_date": _iso(row.issue_date),
                "due_date": _iso(row.due_date),
                "return_date": _iso(row.return_date),
                "status": row.status,
                "fine_amount": float(row.fine_amount or 0),
            }
            for row in IssueReturn.objects.filter(student=child).select_related("book").order_by("-issue_date")[:30]
        ]
    except Exception:
        library = []

    transport = None
    try:
        from transport.models import RouteRider
        rider = (
            RouteRider.objects.filter(student=child)
            .select_related("route", "route__vehicle")
            .first()
        )
        if rider and rider.route:
            route = rider.route
            vehicle = route.vehicle
            transport = {
                "route_name": route.route_name,
                "stop_name": rider.stop_name or "",
                "start_point": route.start_point or "",
                "end_point": route.end_point or "",
                "stops": route.stops or "",
                "morning_time": _hhmm(route.morning_time),
                "evening_time": _hhmm(route.evening_time),
                "route_fare": float(route.route_fare or 0),
                "vehicle_no": vehicle.vehicle_no if vehicle else "",
                "vehicle_type": vehicle.vehicle_type if vehicle else "",
                "driver_name": vehicle.driver_name if vehicle else "",
                "driver_phone": vehicle.driver_phone if vehicle else "",
            }
    except Exception:
        transport = None

    return {
        "student": serializer_data,
        "incharge": class_incharge_for(school, class_name),
        "attendance": {
            "present": present,
            "absent": absent,
            "late": late,
            "leave": leave,
            "total": total_att,
            "rate": round((present / total_att) * 100) if total_att else 0,
            "recent": [
                {"date": _iso(row.date), "status": row.status, "remarks": row.remarks or ""}
                for row in att_qs.order_by("-date")[:90]
            ],
        },
        "fees": {
            "pending_count": pending_fees.count(),
            "paid_total": int(paid_total),
            "due_total": sum(fee.remaining() for fee in pending_fees),
            "rows": [
                {
                    "id": fee.id,
                    "fee_type": fee.fee_type,
                    "month": fee.month,
                    "amount": fee.amount,
                    "paid_amount": fee.paid_amount,
                    "late_fine": fee.late_fine,
                    "remaining": fee.remaining(),
                    "status": fee.status,
                    "due_date": _iso(fee.due_date),
                    "date": _iso(fee.date),
                    "payment_method": fee.payment_method or "",
                    "receipt_no": fee.receipt_no or "",
                    "remarks": fee.remarks or "",
                }
                for fee in fee_qs.order_by("-created_at")[:60]
            ],
        },
        "exams": [
            {
                "id": exam.id,
                "title": exam.title,
                "subject": exam.subject,
                "start_date": _iso(exam.start_date),
                "end_date": _iso(exam.end_date),
                "exam_type": exam.exam_type,
                "total_marks": exam.total_marks,
                "venue": exam.venue or "",
            }
            for exam in Exam.objects.filter(school=school, class_name=class_name).order_by("-start_date")[:20]
        ],
        "results": [
            {
                "exam": row.exam.title if row.exam_id else "",
                "subject": row.subject.name if row.subject_id else "",
                "marks": float(row.marks_obtained),
                "total": float(row.total_marks),
                "grade": row.grade or "",
                "remarks": row.remarks or "",
            }
            for row in ExamResult.objects.filter(student=child).select_related("exam", "subject").order_by("-id")[:40]
        ],
        "homework": [
            {
                "id": item.id,
                "title": item.title,
                "description": item.description or "",
                "subject": item.subject,
                "assignment_type": item.assignment_type,
                "due_date": _iso(item.due_date),
                "due_time": _hhmm(item.due_time),
                "teacher_name": item.teacher.name if item.teacher_id else "",
                "status": item.status,
                "max_marks": item.max_marks,
                "notes": item.notes or "",
            }
            for item in (
                Assignment.objects.filter(school=school, class_name=class_name)
                .exclude(status="Draft")
                .select_related("teacher")
                .order_by("due_date")[:40]
            )
        ],
        "timetable": [
            {
                "id": row.id,
                "day": row.day,
                "start_time": _hhmm(row.start_time),
                "end_time": _hhmm(row.end_time),
                "subject": row.subject,
                "teacher_name": row.teacher.name if row.teacher_id else "",
                "room_no": row.room_no or "",
                "period_type": getattr(row, "period_type", "") or "",
            }
            for row in Timetable.objects.filter(school=school, class_name=class_name)
            .select_related("teacher")
            .order_by("day", "start_time")
        ],
        "notices": [
            {
                "id": row.id,
                "title": row.title,
                "category": row.category,
                "priority": row.priority,
                "is_pinned": row.is_pinned,
                "created_at": _iso(row.created_at),
                "content": row.content or "",
            }
            for row in (
                Notice.objects.filter(school=school, is_active=True)
                .filter(
                    Q(audience__in=["All", "Parents", "Students"])
                    | Q(audience="Class", class_name=class_name)
                )
                .exclude(audience="Teachers")
                .order_by("-is_pinned", "-created_at")[:30]
            )
        ],
        "library": library,
        "transport": transport,
    }
