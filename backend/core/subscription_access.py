import re
from datetime import date

OPEN_PREFIXES = (
    "/api/token",
    "/api/signup",
    "/api/auth",
    "/api/me",
    "/api/plans",
)

OPEN_EXACT = {
    "/api/platform/status",
    "/api/tenant-info",
}

_SCHOOL_READ = re.compile(r"^/api/schools(?:/\d+)?$")
_BUY_PLAN = re.compile(r"^/api/schools/\d+/buy_plan$")


def normalize_api_path(path):
    value = (path or "/").split("?", 1)[0]
    if len(value) > 1 and value.endswith("/"):
        value = value[:-1]
    return value or "/"


def is_subscription_exempt(path, method):
    """Routes a school can still use before its plan is activated."""
    normalized = normalize_api_path(path)
    if normalized in OPEN_EXACT:
        return True
    if any(normalized == prefix or normalized.startswith(f"{prefix}/") for prefix in OPEN_PREFIXES):
        return True
    if method == "GET" and _SCHOOL_READ.match(normalized):
        return True
    if method == "POST" and _BUY_PLAN.match(normalized):
        return True
    return False


def subscription_is_active(school):
    if not school or getattr(school, "plan_status", None) != "Active":
        return False
    expiry = getattr(school, "plan_expiry_date", None)
    if expiry and expiry < date.today():
        return False
    return True


def subscription_block_message(school):
    status = getattr(school, "plan_status", None) or "Inactive"
    expiry = getattr(school, "plan_expiry_date", None)
    if status == "Active" and expiry and expiry < date.today():
        return "Your school subscription has expired. Website access stays closed until it is renewed."
    if status == "Pending":
        return "Your school subscription is waiting for activation. Website access stays closed until it is approved."
    return "Your school subscription is not active. Website access stays closed until a plan is activated."
