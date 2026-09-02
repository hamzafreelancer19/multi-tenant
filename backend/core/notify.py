from django.db.models import Q

from core.models import Notification, NotificationRead
from core.utils import get_current_school


def audience_for_role(role):
    if role == "admin":
        return ["Admin"]
    if role == "teacher":
        return ["Teacher"]
    if role == "parent":
        return ["Parent"]
    if role == "accountant":
        return ["Accountant"]
    if role == "student":
        return ["Student"]
    if role == "superadmin":
        return None
    return []


def visible_notifications(request, unread_only=True):
    user = request.user
    role = getattr(user, "role", None)
    if role == "superadmin":
        qs = Notification.objects.filter(school__isnull=True)
    else:
        school = get_current_school(request)
        if not school:
            return Notification.objects.none()
        audiences = audience_for_role(role)
        if not audiences:
            return Notification.objects.none()
        qs = Notification.objects.filter(school=school, audience__in=audiences)
        if role == "teacher":
            from teachers.scoping import get_teacher_for_request

            teacher = get_teacher_for_request(request)
            if teacher:
                qs = qs.filter(Q(teacher__isnull=True) | Q(teacher=teacher))
            else:
                qs = qs.filter(teacher__isnull=True)
        else:
            qs = qs.filter(teacher__isnull=True)
    if unread_only:
        qs = qs.exclude(reads__user=user)
    return qs.order_by("-created_at")


def mark_notification_read(notification, user):
    NotificationRead.objects.get_or_create(notification=notification, user=user)


def user_can_see(notification, request):
    return visible_notifications(request, unread_only=False).filter(pk=notification.pk).exists()
