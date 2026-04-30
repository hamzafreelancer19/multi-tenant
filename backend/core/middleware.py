from django.http import JsonResponse
from core.services import TenantResolver
from core.tenant_context import set_current_tenant_db, clear_tenant_context

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
            request.tenant = school # Enhanced storage
            
            # Prepare database context
            if school.database_name:
                # Inject database connection into settings if not already there
                from django.conf import settings as django_settings
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
