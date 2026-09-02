import logging
from django.utils.text import slugify
from schools.models import School

logger = logging.getLogger('tenant')

PLATFORM_HOSTS = {"localhost", "127.0.0.1"}


class TenantResolver:
    """
    Enterprise-grade Tenant Resolver Service.
    Single source of truth for resolving and validating tenant context.
    """

    @staticmethod
    def normalize_host(host):
        if not host:
            return ""
        value = str(host).strip().lower()
        value = value.replace("https://", "").replace("http://", "")
        value = value.split("/")[0].split(":")[0]
        if value.startswith("www."):
            value = value[4:]
        return value

    @staticmethod
    def is_platform_host(host):
        host = TenantResolver.normalize_host(host)
        return host in PLATFORM_HOSTS or host.endswith(".vercel.app")

    @staticmethod
    def resolve_from_identifier(ident):
        """
        Match a school from a hostname, slug, or stored domain value.
        Accepts greenway.localhost, greenway, GREEN-01, or the school name slug.
        """
        host = TenantResolver.normalize_host(ident)
        if not host or TenantResolver.is_platform_host(host):
            return None

        slug = host.split(".")[0]
        candidates = {host}
        if host.endswith(".localhost"):
            candidates.add(host[: -len(".localhost")])
        else:
            candidates.add(f"{host}.localhost")
            candidates.add(slug)
            candidates.add(f"{slug}.localhost")

        for candidate in candidates:
            school = School.objects.filter(domain__iexact=candidate).first()
            if school:
                return school

        school = School.objects.filter(code__iexact=slug).first()
        if school:
            return school

        for school in School.objects.exclude(domain__isnull=True).exclude(domain=""):
            stored = TenantResolver.normalize_host(school.domain)
            if stored in candidates or stored.split(".")[0] == slug:
                return school
            if slugify(school.name) == slug:
                return school

        return School.objects.filter(name__iexact=ident.strip()).first() if ident else None

    @staticmethod
    def resolve_from_host(request):
        """
        Resolves tenant from X-Tenant-Domain, then the Host header.
        """
        host = request.headers.get("X-Tenant-Domain") or request.get_host()
        return TenantResolver.resolve_from_identifier(host)

    @staticmethod
    def resolve_from_user(user, host=None):
        """
        Resolves tenant from authenticated user with cross-domain validation.
        """
        if not user.is_authenticated:
            return None

        user_school = getattr(user, "school", None)
        normalized_host = TenantResolver.normalize_host(host)
        is_main_platform = TenantResolver.is_platform_host(normalized_host)

        if normalized_host and not is_main_platform and not normalized_host.endswith(".localhost"):
            if user_school and TenantResolver.normalize_host(user_school.domain) != normalized_host:
                if TenantResolver.resolve_from_identifier(normalized_host) != user_school:
                    logger.error(
                        f"SECURITY: Cross-tenant access blocked. User '{user.username}' "
                        f"from '{user_school.domain}' tried accessing '{host}'"
                    )
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
        if school.status not in ["Approved", "Pending"]:
            logger.warning(
                f"SECURITY: Access blocked to rejected/suspended tenant '{school.name}' via {source}"
            )
            return False
        return True

    @staticmethod
    def resolve_from_token(request):
        """
        Resolves tenant by decoding the JWT token in the Authorization header.
        Crucial for middleware-level resolution when session auth is not used.
        """
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None

        try:
            token = auth_header.split(" ")[1]
            from rest_framework_simplejwt.tokens import AccessToken
            decoded_token = AccessToken(token)
            school_id = decoded_token.get("school_id")

            if school_id:
                school = School.objects.filter(id=school_id).first()
                if school and TenantResolver.validate_school(school, "JWTToken"):
                    return school
        except Exception:
            pass
        return None

    @staticmethod
    def get_context(request):
        """
        The master resolution method following the strict priority rule.
        """
        # Super admins stay global for school-ops APIs. Public tenant-info
        # resolves host/slug on its own and does not call this method.
        if request.user.is_authenticated and getattr(request.user, "role", None) == "superadmin":
            return None

        domain_school = TenantResolver.resolve_from_host(request)
        if domain_school and TenantResolver.validate_school(domain_school, request.get_host()):
            return domain_school

        token_school = TenantResolver.resolve_from_token(request)
        if token_school:
            return token_school

        user_school = TenantResolver.resolve_from_user(
            request.user, request.get_host().split(":")[0]
        )
        if user_school and TenantResolver.validate_school(user_school, "UserContext"):
            return user_school

        return None
