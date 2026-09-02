from django.http import JsonResponse

MAINTENANCE_MESSAGE = "The platform is under maintenance. Please try again later."
SIGNUP_CLOSED_MESSAGE = "New school registrations are currently closed."

PUBLIC_EXACT = {
    "/api/platform/status",
    "/api/token",
    "/api/token/refresh",
    "/api/signup",
    "/api/auth/google",
    "/api/tenant-info",
    "/api/notices/public",
}

PUBLIC_PREFIXES = (
    "/admin/",
    "/static/",
    "/media/",
)


def parse_bool(value, default=False):
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return value != 0
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    return bool(value)


def get_global_setting():
    from core.models import GlobalSetting
    return GlobalSetting.load()


def public_status():
    gs = get_global_setting()
    return {
        "name": gs.name or "Classora",
        "allow_signup": bool(gs.allow_signup),
        "maintenance_mode": bool(gs.maintenance_mode),
        "support_email": gs.support_email or "",
        "support_phone": gs.support_phone or "",
    }


def maintenance_payload():
    return {
        "error": MAINTENANCE_MESSAGE,
        "detail": MAINTENANCE_MESSAGE,
        "code": "maintenance",
    }


def maintenance_response():
    return JsonResponse(maintenance_payload(), status=503)


def is_public_platform_path(path):
    normalized = (path or "/").split("?", 1)[0].rstrip("/") or "/"
    if normalized in PUBLIC_EXACT:
        return True
    prefixed = (path or "/") if (path or "/").endswith("/") else f"{path}/"
    return any(prefixed.startswith(prefix) for prefix in PUBLIC_PREFIXES)


def role_from_bearer(request):
    header = request.META.get("HTTP_AUTHORIZATION") or ""
    if not header.lower().startswith("bearer "):
        return ""
    raw = header.split(" ", 1)[1].strip()
    if not raw:
        return ""
    from rest_framework_simplejwt.exceptions import TokenError
    from rest_framework_simplejwt.tokens import AccessToken

    try:
        token = AccessToken(raw)
        role = token.get("role") or ""
        if role:
            return str(role)
        uid = token.get("user_id")
        if uid:
            from django.contrib.auth import get_user_model
            user = get_user_model().objects.filter(pk=uid).only("role").first()
            return getattr(user, "role", "") or ""
    except TokenError:
        return ""
    return ""
