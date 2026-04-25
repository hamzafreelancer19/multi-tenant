from django.http import JsonResponse
from core.services import TenantResolver

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
        else:
            request.domain_school = None
            
        response = self.get_response(request)
        return response
