from datetime import date as date_cls

from rest_framework.exceptions import ValidationError

from teachers.models import Teacher
from .models import PeriodCover, Timetable
from .serializers import times_overlap


WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def weekday_name(value):
    if hasattr(value, "weekday"):
        return WEEKDAYS[value.weekday()]
    return str(value or "")


def parse_cover_date(raw):
    if not raw:
        return date_cls.today()
    if isinstance(raw, date_cls):
        return raw
    try:
        return date_cls.fromisoformat(str(raw)[:10])
    except ValueError:
        raise ValidationError({"date": "Use a valid date (YYYY-MM-DD)."})


def busy_teacher_ids(school, day, start, end, cover_date, exclude_period_id=None):
    busy = set()
    slots = Timetable.objects.filter(school=school, day=day)
    if exclude_period_id:
        slots = slots.exclude(pk=exclude_period_id)

    covers = {}
    if cover_date:
        cover_rows = PeriodCover.objects.filter(
            school=school,
            date=cover_date,
            period__day=day,
        ).select_related("period")
        covers = {row.period_id: row.cover_teacher_id for row in cover_rows}

    for slot in slots:
        if slot.period_type == "Break":
            continue
        if not times_overlap(start, end, slot.start_time, slot.end_time):
            continue
        cover_id = covers.get(slot.id)
        if cover_id:
            busy.add(cover_id)
        elif slot.teacher_id:
            busy.add(slot.teacher_id)
    return busy


def free_teachers_for_period(period, cover_date):
    school = period.school
    busy = busy_teacher_ids(
        school,
        period.day,
        period.start_time,
        period.end_time,
        cover_date,
        exclude_period_id=period.id,
    )
    if period.teacher_id:
        busy.add(period.teacher_id)
    existing = PeriodCover.objects.filter(period=period, date=cover_date).first()
    if existing:
        busy.discard(existing.cover_teacher_id)

    rows = Teacher.objects.filter(school=school).exclude(status="Inactive").order_by("name")
    free = []
    for teacher in rows:
        if teacher.id in busy:
            continue
        free.append({
            "id": teacher.id,
            "name": teacher.name,
            "subject": teacher.subject or "",
            "designation": teacher.designation or "",
        })
    return free


def serialize_period(period, cover=None):
    teacher = period.teacher
    cover_payload = None
    if cover:
        cover_payload = {
            "id": cover.id,
            "teacher": cover.cover_teacher_id,
            "teacher_name": cover.cover_teacher.name if cover.cover_teacher_id else "",
            "teacher_subject": cover.cover_teacher.subject if cover.cover_teacher_id else "",
            "reason": cover.reason or "",
        }
    return {
        "id": period.id,
        "class_name": period.class_name,
        "subject": period.subject,
        "period_type": period.period_type,
        "day": period.day,
        "start_time": period.start_time.strftime("%H:%M") if period.start_time else "",
        "end_time": period.end_time.strftime("%H:%M") if period.end_time else "",
        "room_no": period.room_no or "",
        "teacher": period.teacher_id,
        "teacher_name": teacher.name if teacher else "",
        "teacher_subject": teacher.subject if teacher else "",
        "cover": cover_payload,
        "can_cover": period.period_type != "Break",
    }
