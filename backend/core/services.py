import logging
from schools.models import School

logger = logging.getLogger('tenant')

class TenantResolver:
    """
    Enterprise-grade Tenant Resolver Service.
    Single source of truth for resolving and validating tenant context.
    """
    
    @staticmethod
    def resolve_from_host(request):
        """
        Resolves tenant strictly from the sanitized Host header.
        """
        # 1. Check Custom Header (Handy for cross-domain or single-domain SPAs)
        host = request.headers.get('X-Tenant-Domain')
        
        # 2. Fallback to Host Header
        if not host:
            host = request.get_host().split(':')[0].lower()
        else:
            host = host.split(':')[0].lower()
            
        # Security: Skip resolution for default localhosts
        if host in ['localhost', '127.0.0.1'] or host.endswith('.vercel.app'):
            # If it's the main Vercel or Localhost, don't treat it as a tenant domain itself
            return None
            
        school = School.objects.filter(domain=host).first()
        
        if school:
            TenantResolver.validate_school(school, host)
            return school
        return None

    @staticmethod
    def resolve_from_user(user, host=None):
        """
        Resolves tenant from authenticated user with cross-domain validation.
        """
        if not user.is_authenticated:
            return None
            
        user_school = getattr(user, 'school', None)
        
        # Security: Prevent cross-domain bypass (but allow main platform domains)
        is_main_platform = host in ['localhost', '127.0.0.1'] or (host and host.endswith('.vercel.app'))
        
        if host and not is_main_platform and not host.endswith('.localhost'):
            if user_school and user_school.domain != host:
                logger.error(f"SECURITY: Cross-tenant access blocked. User '{user.username}' from '{user_school.domain}' tried accessing '{host}'")
                return None
                
        if user_school:
            TenantResolver.validate_school(user_school, f"User:{user.username}")
            return user_school
            
        return None

    @staticmethod
    def validate_school(school, source):
        """
        Standardized validation for school status and availability.
        Allows 'Approved' and 'Pending' (for initial setup).
        """
        if school.status not in ['Approved', 'Pending']:
            logger.warning(f"SECURITY: Access blocked to rejected/suspended tenant '{school.name}' via {source}")
            return False
        return True

    @staticmethod
    def get_context(request):
        """
        The master resolution method following the strict priority rule.
        """
        # 1. Domain-based resolution (Primary)
        domain_school = TenantResolver.resolve_from_host(request)
        if domain_school and TenantResolver.validate_school(domain_school, request.get_host()):
            return domain_school
            
        # 2. User-based resolution (Fallback)
        user_school = TenantResolver.resolve_from_user(request.user, request.get_host().split(':')[0])
        if user_school and TenantResolver.validate_school(user_school, "UserContext"):
            return user_school
            
        return None
