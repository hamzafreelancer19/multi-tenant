from django.http import JsonResponse
from core.services import TenantResolver
from core.tenant_context import set_current_tenant_db, clear_tenant_context


class PlatformAccessMiddleware:
    """Enforce maintenance mode on every API call except public/auth routes."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == "OPTIONS":
            return self.get_response(request)

        from core.platform import (
            get_global_setting,
            is_public_platform_path,
            maintenance_response,
            role_from_bearer,
        )

        if is_public_platform_path(request.path):
            return self.get_response(request)

        try:
            gs = get_global_setting()
        except Exception:
            return self.get_response(request)

        if not gs.maintenance_mode:
            return self.get_response(request)

        role = role_from_bearer(request)
        if role == "superadmin":
            return self.get_response(request)
        if not role:
            return self.get_response(request)
        return maintenance_response()


class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Resolve tenant using the centralized service
        school = TenantResolver.resolve_from_host(request)
        
        if school:
            # Handle security validation results
            if not TenantResolver.validate_school(school, request.get_host()):
                return JsonResponse({
                    "error": "This school account is currently suspended or pending approval.",
                    "status": school.status
                }, status=403)
            
            request.domain_school = school
            request.tenant = school

            from django.conf import settings as django_settings
            if getattr(django_settings, 'TENANT_DB_SWITCHING_ENABLED', False) and school.database_name:
                if school.database_name not in django_settings.DATABASES:
                    new_db_config = django_settings.DATABASES['default'].copy()
                    new_db_config['NAME'] = school.database_name
                    django_settings.DATABASES[school.database_name] = new_db_config
                set_current_tenant_db(school.database_name)
        else:
            request.domain_school = None
            request.tenant = None
            
        try:
            response = self.get_response(request)
        finally:
            # Always clear context after request to prevent thread leakage
            clear_tenant_context()
            
        return response


class SubscriptionAccessMiddleware:
    """Block school website and API access until the subscription is active."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == "OPTIONS":
            return self.get_response(request)

        path = request.path or "/"
        if not path.startswith("/api/"):
            return self.get_response(request)

        from core.subscription_access import (
            is_subscription_exempt,
            subscription_block_message,
            subscription_is_active,
        )

        if is_subscription_exempt(path, request.method):
            return self.get_response(request)

        user = _user_from_request(request)
        if user and getattr(user, "role", None) == "superadmin":
            return self.get_response(request)

        school = None
        if user and getattr(user, "school_id", None):
            school = user.school
        if school is None:
            school = getattr(request, "tenant", None) or getattr(request, "domain_school", None)

        if not school or subscription_is_active(school):
            return self.get_response(request)

        return JsonResponse(
            {
                "error": subscription_block_message(school),
                "detail": subscription_block_message(school),
                "code": "subscription_inactive",
                "plan_status": school.plan_status,
            },
            status=403,
        )


def _user_from_request(request):
    user = getattr(request, "user", None)
    if user is not None and getattr(user, "is_authenticated", False):
        return user

    header = request.META.get("HTTP_AUTHORIZATION") or ""
    if not header.lower().startswith("bearer "):
        return None
    raw = header.split(" ", 1)[1].strip()
    if not raw:
        return None

    from django.contrib.auth import get_user_model
    from rest_framework_simplejwt.exceptions import TokenError
    from rest_framework_simplejwt.tokens import AccessToken

    try:
        token = AccessToken(raw)
        uid = token.get("user_id")
        if not uid:
            return None
        return get_user_model().objects.select_related("school").filter(pk=uid).first()
    except TokenError:
        return None
    except Exception:
        return None
