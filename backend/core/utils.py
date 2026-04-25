from core.services import TenantResolver

def get_current_school(request):
    """
    Standardized entry point for views to access the resolved school context.
    Delegates all logic to the TenantResolver service.
    """
    return TenantResolver.get_context(request)
