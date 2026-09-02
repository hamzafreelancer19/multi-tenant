from core.services import TenantResolver

def get_current_school(request):
    """
    Standardized entry point for views to access the resolved school context.
    Delegates all logic to the TenantResolver service.
    """
    return TenantResolver.get_context(request)

def is_superadmin(request):
    return getattr(getattr(request, "user", None), "role", None) == "superadmin"

def school_queryset(request, model, lookup="school"):
    """Filter records by the current school. Super admin has no school-ops data."""
    if is_superadmin(request):
        return model.objects.none()
    school = get_current_school(request)
    if school:
        return model.objects.filter(**{lookup: school})
    return model.objects.none()
