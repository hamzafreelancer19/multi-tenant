from django.contrib.auth import get_user_model
from django.utils.text import slugify

from .models import Teacher

User = get_user_model()


def next_employee_id(school):
    prefix = "T-"
    codes = Teacher.objects.filter(school=school, employee_id__startswith=prefix).values_list("employee_id", flat=True)
    nums = []
    for code in codes:
        try:
            nums.append(int(str(code).replace(prefix, "", 1)))
        except (TypeError, ValueError):
            continue
    n = (max(nums) if nums else 0) + 1
    while Teacher.objects.filter(school=school, employee_id=f"{prefix}{n:04d}").exists():
        n += 1
    return f"{prefix}{n:04d}"


def _split_name(name):
    parts = [p for p in (name or "").split() if p]
    if not parts:
        return "", ""
    return parts[0][:150], " ".join(parts[1:])[:150]


def _unique_username(email, school_id):
    email = (email or "").strip().lower()
    if email and not User.objects.filter(username__iexact=email).exists():
        return email
    slug = slugify((email or "teacher").split("@")[0]) or "teacher"
    username = f"{slug}.s{school_id}"
    n = 1
    while User.objects.filter(username__iexact=username).exists():
        n += 1
        username = f"{slug}.s{school_id}.{n}"
    return username[:150]


def ensure_portal_user(teacher, password=None, login_email=None):
    """Create or update the school-scoped User this teacher logs in with."""
    school = teacher.school
    email = (login_email or teacher.email or "").strip().lower()
    if not email:
        raise ValueError("Teacher email is required to create a login.")

    user = getattr(teacher, "user", None)
    if user is None and teacher.user_id:
        user = User.objects.filter(pk=teacher.user_id).first()
    if user is None:
        user = User.objects.filter(school=school, role="teacher", email__iexact=email).first()

    first_name, last_name = _split_name(teacher.name)

    if user is None:
        user = User(
            username=_unique_username(email, school.id),
            email=email,
            role="teacher",
            school=school,
            first_name=first_name,
            last_name=last_name,
            is_active=teacher.status != "Inactive",
        )
        if not password:
            raise ValueError("Password is required to create a teacher login.")
        user.set_password(password)
        user.save()
    else:
        user.email = email
        user.role = "teacher"
        user.school = school
        user.first_name = first_name or user.first_name
        user.last_name = last_name if last_name else user.last_name
        user.is_active = teacher.status != "Inactive"
        if password:
            user.set_password(password)
        user.save()

    update = []
    if teacher.user_id != user.id:
        teacher.user = user
        update.append("user")
    if (teacher.email or "").strip().lower() != email:
        teacher.email = email
        update.append("email")
    if update:
        teacher.save(update_fields=update)
    return user.username
