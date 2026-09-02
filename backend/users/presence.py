from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()
ONLINE_WINDOW = 45
HEARTBEAT_THROTTLE = 10


def _aware(value):
    if not value:
        return None
    if timezone.is_naive(value):
        return timezone.make_aware(value, timezone.get_current_timezone())
    return value


def is_online(user):
    seen = _aware(getattr(user, "last_seen", None))
    if not seen:
        return False
    return seen >= timezone.now() - timedelta(seconds=ONLINE_WINDOW)


def mark_online(user):
    if not user or not getattr(user, "pk", None):
        return
    now = timezone.now()
    User.objects.filter(pk=user.pk).update(last_seen=now)
    user.last_seen = now


def mark_offline(user):
    if not user or not getattr(user, "pk", None):
        return
    User.objects.filter(pk=user.pk).update(last_seen=None)
    user.last_seen = None


def touch_presence(user):
    if not user or not getattr(user, "is_authenticated", False) or not getattr(user, "pk", None):
        return
    now = timezone.now()
    seen = _aware(getattr(user, "last_seen", None))
    if seen and (now - seen).total_seconds() < HEARTBEAT_THROTTLE:
        return
    mark_online(user)


def avatar_of(user):
    return (getattr(user, "avatar_url", None) or "").strip()
