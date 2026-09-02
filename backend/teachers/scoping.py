from collections import Counter

from rest_framework.exceptions import PermissionDenied

from core.utils import get_current_school
from students.models import Student
from teachers.models import Teacher


def request_role(request):
    return getattr(getattr(request, "user", None), "role", None)


def is_teacher_request(request):
    return request_role(request) == "teacher"


def normalize_class_label(value):
    text = (value or "").replace("–", "-").replace("—", "-")
    return " ".join(text.split()).strip().lower()


def get_teacher_for_request(request):
    user = getattr(request, "user", None)
    school = get_current_school(request)
    if not user or not getattr(user, "is_authenticated", False) or not school:
        return None
    teacher = Teacher.objects.filter(school=school, user=user).first()
    if teacher:
        return teacher
    email = (getattr(user, "email", None) or "").strip()
    if email:
        teacher = Teacher.objects.filter(school=school, email__iexact=email).first()
        if teacher:
            return teacher
    username = (getattr(user, "username", None) or "").strip()
    if username:
        return Teacher.objects.filter(school=school, email__iexact=username).first()
    return None


def _school_class_rows(school):
    if not school:
        return []
    from classes.models import SchoolClass
    return list(SchoolClass.objects.filter(school=school).select_related("class_teacher"))


def canonicalize_labels(school, labels):
    out = set()
    for raw in labels or []:
        text = str(raw or "").strip()
        if text:
            out.add(text)
    if not school or not out:
        return out

    norms = {normalize_class_label(item) for item in out}
    for sc in _school_class_rows(school):
        label = sc.label()
        aliases = [label, sc.name]
        if sc.section:
            aliases.extend([
                f"{sc.name} - {sc.section}",
                f"{sc.name}-{sc.section}",
                f"{sc.name} {sc.section}",
            ])
        if any(normalize_class_label(alias) in norms for alias in aliases):
            out.add(label)
            norms.add(normalize_class_label(label))

    student_names = Student.objects.filter(school=school).values_list("class_name", flat=True).distinct()
    for name in student_names:
        if name and normalize_class_label(name) in norms:
            out.add(name)
    return out


def teacher_raw_labels(teacher):
    labels = []
    for item in teacher.classes or []:
        text = str(item or "").strip()
        if text:
            labels.append(text)
    for sc in teacher.homeroom_classes.all():
        labels.append(sc.label())
    from timetable.models import Timetable
    labels.extend(
        Timetable.objects.filter(teacher=teacher)
        .exclude(class_name="")
        .values_list("class_name", flat=True)
    )
    return labels


def teacher_cover_labels(teacher, on_date=None):
    if not teacher:
        return []
    from datetime import date as date_cls
    from timetable.models import PeriodCover
    day = on_date or date_cls.today()
    return list(
        PeriodCover.objects.filter(cover_teacher=teacher, date=day)
        .values_list("period__class_name", flat=True)
    )


def teacher_class_labels(teacher, on_date=None):
    if not teacher:
        return set()
    return canonicalize_labels(teacher.school, teacher_raw_labels(teacher) + teacher_cover_labels(teacher, on_date))


def teacher_incharge_labels(teacher):
    if not teacher:
        return set()
    labels = [sc.label() for sc in teacher.homeroom_classes.all()]
    if (teacher.designation or "") == "Class Teacher":
        labels.extend([str(item).strip() for item in (teacher.classes or []) if str(item).strip()])
    return canonicalize_labels(teacher.school, labels)


def teacher_incharge_labels_for_request(request):
    if not is_teacher_request(request):
        return None
    return teacher_incharge_labels(get_teacher_for_request(request))


def apply_teacher_incharge_scope(request, qs, field="class_name"):
    if not is_teacher_request(request):
        return qs
    labels = teacher_incharge_labels_for_request(request) or set()
    if not labels:
        return qs.none()
    return qs.filter(**{f"{field}__in": labels})


def class_name_allowed(class_name, labels):
    if not class_name:
        return False
    if class_name in labels:
        return True
    target = normalize_class_label(class_name)
    return any(normalize_class_label(item) == target for item in labels)


def teacher_labels_for_request(request):
    if not is_teacher_request(request):
        return None
    return teacher_class_labels(get_teacher_for_request(request))


def apply_teacher_class_scope(request, qs, field="class_name"):
    if not is_teacher_request(request):
        return qs
    labels = teacher_labels_for_request(request) or set()
    if not labels:
        return qs.none()
    return qs.filter(**{f"{field}__in": labels})


def apply_teacher_school_class_scope(request, qs):
    if not is_teacher_request(request):
        return qs
    labels = teacher_labels_for_request(request) or set()
    if not labels:
        return qs.none()
    norms = {normalize_class_label(item) for item in labels}
    ids = [row.id for row in qs if normalize_class_label(row.label()) in norms]
    return qs.filter(id__in=ids)


def colleague_teacher_ids(teacher):
    if not teacher:
        return set()
    labels = teacher_class_labels(teacher)
    ids = {teacher.id}
    for sc in _school_class_rows(teacher.school):
        if sc.class_teacher_id and class_name_allowed(sc.label(), labels):
            ids.add(sc.class_teacher_id)
    if labels:
        from timetable.models import Timetable
        ids.update(
            Timetable.objects.filter(
                school=teacher.school,
                class_name__in=labels,
                teacher_id__isnull=False,
            ).values_list("teacher_id", flat=True)
        )
    return ids


def ensure_teacher_can_access_class(request, class_name):
    if not is_teacher_request(request):
        return
    labels = teacher_labels_for_request(request) or set()
    if not class_name_allowed(class_name, labels):
        raise PermissionDenied("You can only work with the class assigned to you.")


def ensure_incharge_or_admin(request, class_name):
    role = request_role(request)
    if role == "admin":
        return
    if role != "teacher":
        raise PermissionDenied("Only the class incharge can arrange a cover teacher.")
    teacher = get_teacher_for_request(request)
    if not class_name_allowed(class_name, teacher_incharge_labels(teacher)):
        raise PermissionDenied("Only the class incharge can arrange a cover teacher for this class.")


def ensure_teacher_can_access_student(request, student):
    if not student:
        raise PermissionDenied("Student not found.")
    ensure_teacher_can_access_class(request, getattr(student, "class_name", ""))


def ensure_incharge_can_access_student(request, student):
    if not student:
        raise PermissionDenied("Student not found.")
    if not is_teacher_request(request):
        return
    labels = teacher_incharge_labels_for_request(request) or set()
    if not class_name_allowed(getattr(student, "class_name", ""), labels):
        raise PermissionDenied("Only the class incharge can mark student attendance.")


def deny_teacher_writes(request, message="Only school admin can change this."):
    if is_teacher_request(request) and request.method not in ("GET", "HEAD", "OPTIONS"):
        raise PermissionDenied(message)


def build_classroom_scope(teacher):
    if not teacher:
        return {
            "assigned_classes": [],
            "incharge_classes": [],
            "classes": [],
        }

    school = teacher.school
    labels = sorted(teacher_class_labels(teacher), key=lambda item: item.lower())
    incharge = teacher_incharge_labels(teacher)
    class_rows = {sc.label(): sc for sc in _school_class_rows(school)}

    counts = Counter(
        Student.objects.filter(school=school, class_name__in=labels).values_list("class_name", flat=True)
    )
    from timetable.models import Timetable
    periods = list(
        Timetable.objects.filter(school=school, class_name__in=labels)
        .select_related("teacher")
        .order_by("day", "start_time")
    )

    classes = []
    for label in labels:
        sc = class_rows.get(label)
        if not sc:
            sc = next((row for row in class_rows.values() if class_name_allowed(row.label(), {label})), None)
        is_incharge = class_name_allowed(label, incharge)
        class_periods = [row for row in periods if class_name_allowed(row.class_name, {label})]
        grouped = {}
        my_subjects = set()
        for row in class_periods:
            if row.teacher_id == teacher.id and row.subject:
                my_subjects.add(row.subject)
            if not row.teacher_id:
                continue
            rec = grouped.setdefault(row.teacher_id, {
                "id": row.teacher_id,
                "name": row.teacher.name if row.teacher else "Teacher",
                "subject": (row.teacher.subject if row.teacher else "") or row.subject,
                "subjects": set(),
                "periods": 0,
                "is_self": row.teacher_id == teacher.id,
                "is_incharge": False,
            })
            rec["periods"] += 1
            if row.subject:
                rec["subjects"].add(row.subject)

        incharge_teacher = None
        if sc and sc.class_teacher:
            incharge_teacher = {
                "id": sc.class_teacher_id,
                "name": sc.class_teacher.name,
                "subject": sc.class_teacher.subject,
            }
            rec = grouped.setdefault(sc.class_teacher_id, {
                "id": sc.class_teacher_id,
                "name": sc.class_teacher.name,
                "subject": sc.class_teacher.subject,
                "subjects": set(),
                "periods": 0,
                "is_self": sc.class_teacher_id == teacher.id,
                "is_incharge": True,
            })
            rec["is_incharge"] = True

        period_teachers = []
        for rec in sorted(grouped.values(), key=lambda item: (not item["is_incharge"], not item["is_self"], item["name"] or "")):
            period_teachers.append({
                "id": rec["id"],
                "name": rec["name"],
                "subject": rec["subject"],
                "subjects": sorted(rec["subjects"]),
                "periods": rec["periods"],
                "is_self": rec["is_self"],
                "is_incharge": rec["is_incharge"],
            })

        student_count = counts.get(label, 0)
        if not student_count and sc:
            student_count = counts.get(sc.label(), 0)

        classes.append({
            "label": label,
            "role": "incharge" if is_incharge else "subject",
            "is_incharge": is_incharge,
            "student_count": student_count,
            "room_no": sc.room_no if sc else "",
            "shift": sc.shift if sc else "",
            "incharge": incharge_teacher,
            "my_subjects": sorted(my_subjects) or ([teacher.subject] if teacher.subject else []),
            "period_teachers": period_teachers,
        })

    return {
        "assigned_classes": labels,
        "incharge_classes": sorted(incharge, key=lambda item: item.lower()),
        "classes": classes,
    }
