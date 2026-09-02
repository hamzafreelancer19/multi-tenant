from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()


class EmailOrUsernameModelBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD)
        if not username or password is None:
            return None

        qs = User.objects.filter(Q(username__iexact=username) | Q(email__iexact=username))
        school = None
        if request is not None:
            try:
                from core.utils import get_current_school
                school = get_current_school(request)
            except Exception:
                school = None
        if school:
            scoped = qs.filter(school=school)
            if scoped.exists():
                qs = scoped

        for user in qs:
            if user.check_password(password) and self.user_can_authenticate(user):
                return user
        return None
