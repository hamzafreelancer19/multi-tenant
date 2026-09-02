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
