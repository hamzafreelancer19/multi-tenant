from rest_framework.exceptions import PermissionDenied
from core.utils import is_superadmin


class SchoolOpsMixin:
    """
    School day-to-day APIs (students, teachers, admissions, fees, etc.).
    Platform super admin cannot use these — they manage schools, users, and security.
    """

    def check_permissions(self, request):
        super().check_permissions(request)
        if is_superadmin(request):
            raise PermissionDenied(
                "School operations belong to each school's admin. "
                "Super admin manages schools, users, and security."
            )
        role = getattr(getattr(request, "user", None), "role", None)
        if role == "parent":
            if request.method not in ("GET", "HEAD", "OPTIONS"):
                raise PermissionDenied("Parents can view their child's record only.")
            if getattr(self, "action", None) != "my_child":
                raise PermissionDenied("Parents can view their child's record only.")
