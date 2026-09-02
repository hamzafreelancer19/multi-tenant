from django.contrib.auth import get_user_model
from django.db.models import Count
from django.utils import timezone

from core.utils import get_current_school
from students.models import Student
from teachers.models import Teacher
from teachers.scoping import get_teacher_for_request, teacher_class_labels

from users.presence import avatar_of, is_online
from .models import ChatMessage, ChatParticipant, ChatThread

User = get_user_model()


def teacher_record(user):
    if not user:
        return None
    found = Teacher.objects.filter(user=user).first()
    if found:
        return found
    school_id = getattr(user, "school_id", None)
    email = (getattr(user, "email", None) or "").strip()
    username = (getattr(user, "username", None) or "").strip()
    qs = Teacher.objects.filter(school_id=school_id) if school_id else Teacher.objects.all()
    if email:
        found = qs.filter(email__iexact=email).first()
        if found:
            return found
    if username and "@" in username:
        found = qs.filter(email__iexact=username).first()
        if found:
            return found
    return None


def public_name(user):
    if not user:
        return "Unknown"
    name = f"{getattr(user, 'first_name', '')} {getattr(user, 'last_name', '')}".strip()
    if name:
        return name
    role = getattr(user, "role", None)
    if role == "teacher":
        teacher = teacher_record(user)
        if teacher and teacher.name:
            return teacher.name
    if role == "parent":
        child = Student.objects.filter(parent_user=user).first()
        if child:
            return f"{child.name}'s parent"
    if role == "student":
        child = student_for_user(user, getattr(user, "school", None))
        if child and child.name:
            return child.name
    username = user.username or ""
    if "@" in username:
        return username.split("@")[0].replace(".", " ").replace("_", " ").title()
    return username or "User"


def teacher_login_user(teacher):
    if not teacher:
        return None
    if teacher.user_id:
        return teacher.user
    if teacher.email:
        return User.objects.filter(school=teacher.school, email__iexact=teacher.email, is_active=True).first()
    return None


def student_for_user(user, school):
    if not user or not school:
        return None
    if user.role == "parent":
        return Student.objects.filter(school=school, parent_user=user).first()
    if user.role == "student":
        roll = (user.username or "").split("@")[0]
        found = Student.objects.filter(school=school, roll_no=roll).first()
        if found:
            return found
        if user.email:
            return Student.objects.filter(school=school, email__iexact=user.email).first()
    return None


def contact_phone(user):
    phone = (getattr(user, "phone", None) or "").strip()
    if getattr(user, "role", None) == "teacher":
        teacher = Teacher.objects.filter(user=user).first()
        if teacher and teacher.phone:
            phone = teacher.phone
    if getattr(user, "role", None) == "parent":
        child = Student.objects.filter(parent_user=user).first()
        if child:
            phone = child.father_phone or child.mother_phone or child.phone or phone
    return (phone or "").strip()


def child_label(user):
    if getattr(user, "role", None) != "parent":
        return ""
    child = Student.objects.filter(parent_user=user).first()
    return child.name if child else ""


def role_tag(user):
    if not user:
        return ""
    role = getattr(user, "role", None) or ""
    if role == "admin":
        return "Admin"
    if role == "accountant":
        return "Accountant"
    if role == "parent":
        return "Parent"
    if role == "student":
        return "Student"
    if role == "teacher":
        teacher = teacher_record(user)
        if teacher:
            from classes.models import SchoolClass
            if SchoolClass.objects.filter(class_teacher=teacher).exists():
                return "Incharge"
        return "Teacher"
    return role.replace("_", " ").title() if role else ""


def _add_user(bucket, user, subtitle=""):
    if not user or not user.is_active or user.id in bucket:
        return
    bucket[user.id] = {
        "id": user.id,
        "name": public_name(user),
        "role": user.role,
        "role_tag": role_tag(user),
        "username": user.username or "",
        "phone": contact_phone(user),
        "child_name": child_label(user),
        "avatar": avatar_of(user),
        "online": bool(is_online(user)),
        "subtitle": subtitle or (user.role or "").title(),
    }


def allowed_contacts(request):
    school = get_current_school(request)
    me = request.user
    if not school or not me:
        return []
    contacts = {}
    role = getattr(me, "role", None)
    staff = User.objects.filter(school=school, is_active=True).exclude(id=me.id)

    if role == "admin":
        for user in staff.filter(role__in=["admin", "teacher", "parent", "accountant"]):
            extra = ""
            if user.role == "parent":
                child = Student.objects.filter(parent_user=user).first()
                extra = child.class_name if child else "Parent"
            elif user.role == "teacher":
                teacher = teacher_record(user)
                extra = teacher.subject if teacher else "Teacher"
            _add_user(contacts, user, extra)
        return list(contacts.values())

    if role == "accountant":
        for user in staff.filter(role="admin"):
            _add_user(contacts, user, "School admin")
        return list(contacts.values())

    if role == "teacher":
        for user in staff.filter(role="admin"):
            _add_user(contacts, user, "School admin")
        for user in staff.filter(role="teacher"):
            teacher = teacher_record(user)
            _add_user(contacts, user, teacher.subject if teacher else "Teacher")
        teacher = get_teacher_for_request(request)
        labels = teacher_class_labels(teacher) if teacher else set()
        if labels:
            parents = (
                Student.objects.filter(school=school, class_name__in=labels, parent_user__isnull=False)
                .select_related("parent_user")
            )
            for student in parents:
                parent = student.parent_user
                if parent and parent.id != me.id:
                    _add_user(contacts, parent, f"{student.name} · {student.class_name}")
        return list(contacts.values())

    if role == "parent":
        for user in staff.filter(role="admin"):
            _add_user(contacts, user, "School admin")
        child = student_for_user(me, school)
        if child:
            from classes.models import SchoolClass
            from timetable.models import Timetable

            for sc in SchoolClass.objects.filter(school=school).select_related("class_teacher"):
                if sc.label() == child.class_name or sc.name == child.class_name:
                    login = teacher_login_user(sc.class_teacher)
                    _add_user(contacts, login, f"Class incharge · {child.class_name}")
            teacher_ids = (
                Timetable.objects.filter(school=school, class_name=child.class_name, teacher__isnull=False)
                .values_list("teacher_id", flat=True)
                .distinct()
            )
            for teacher in Teacher.objects.filter(id__in=teacher_ids):
                login = teacher_login_user(teacher)
                _add_user(contacts, login, f"{teacher.subject} · {child.class_name}")
        return list(contacts.values())

    if role == "student":
        for user in staff.filter(role="admin"):
            _add_user(contacts, user, "School admin")
        child = student_for_user(me, school)
        if child:
            from timetable.models import Timetable

            teacher_ids = (
                Timetable.objects.filter(school=school, class_name=child.class_name, teacher__isnull=False)
                .values_list("teacher_id", flat=True)
                .distinct()
            )
            for teacher in Teacher.objects.filter(id__in=teacher_ids):
                login = teacher_login_user(teacher)
                _add_user(contacts, login, teacher.subject or "Teacher")
        return list(contacts.values())

    return []


def allowed_contact_ids(request):
    return {item["id"] for item in allowed_contacts(request)}


def get_or_create_direct(school, user_a, user_b):
    existing = (
        ChatThread.objects.filter(school=school, memberships__user=user_a)
        .filter(memberships__user=user_b)
        .annotate(n=Count("memberships", distinct=True))
        .filter(n=2)
        .first()
    )
    if existing:
        return existing, False
    thread = ChatThread.objects.create(school=school)
    ChatParticipant.objects.create(thread=thread, user=user_a)
    ChatParticipant.objects.create(thread=thread, user=user_b)
    return thread, True


def other_member(thread, me):
    return (
        ChatParticipant.objects.filter(thread=thread)
        .exclude(user=me)
        .select_related("user")
        .first()
    )


def last_preview(last):
    if not last:
        return ""
    kind = (getattr(last, "attachment_type", "") or "").lower()
    if kind == "image":
        return (last.body or "").strip() or "Photo"
    if getattr(last, "attachment_url", ""):
        return (last.body or "").strip() or getattr(last, "attachment_name", "") or "File"
    return last.body or ""


def serialize_thread(thread, me):
    other = other_member(thread, me)
    other_user = other.user if other else None
    last = thread.messages.order_by("-created_at", "-id").first()
    mine = ChatParticipant.objects.filter(thread=thread, user=me).first()
    last_read = mine.last_read_at if mine else None
    incoming = thread.messages.exclude(sender=me)
    incoming_count = incoming.count()
    unread_qs = incoming
    if last_read:
        unread_qs = unread_qs.filter(created_at__gt=last_read)
    unread = unread_qs.count()
    other_read = other.last_read_at if other else None
    last_from_me = bool(last and last.sender_id == getattr(me, "id", None))
    last_seen = bool(last_from_me and other_read and last.created_at <= other_read)
    return {
        "id": thread.id,
        "other": {
            "id": other_user.id if other_user else None,
            "name": public_name(other_user) if other_user else "Unknown",
            "role": getattr(other_user, "role", "") if other_user else "",
            "role_tag": role_tag(other_user) if other_user else "",
            "phone": contact_phone(other_user) if other_user else "",
            "username": other_user.username if other_user else "",
            "avatar": avatar_of(other_user) if other_user else "",
            "online": bool(is_online(other_user)) if other_user else False,
        },
        "last_message": last_preview(last),
        "last_at": last.created_at.isoformat() if last else thread.updated_at.isoformat(),
        "last_from_me": last_from_me,
        "last_seen": last_seen,
        "incoming": incoming_count,
        "unread": unread,
        "seen": max(incoming_count - unread, 0),
        "other_read_at": other_read.isoformat() if other_read else None,
    }


def serialize_message(row, other_read_at=None):
    return {
        "id": row.id,
        "sender_id": row.sender_id,
        "body": row.body or "",
        "attachment_url": getattr(row, "attachment_url", "") or "",
        "attachment_name": getattr(row, "attachment_name", "") or "",
        "attachment_type": getattr(row, "attachment_type", "") or "",
        "created_at": row.created_at.isoformat(),
        "seen": bool(other_read_at and row.created_at <= other_read_at),
    }


def mark_read(thread, user):
    ChatParticipant.objects.filter(thread=thread, user=user).update(last_read_at=timezone.now())
