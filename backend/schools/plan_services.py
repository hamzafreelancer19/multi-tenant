from datetime import date, timedelta


def activate_school_plan(school):
    """Activate a plan on a school (API + Django admin)."""
    plan = school.subscribed_plan
    days = (plan.duration_days if plan else 30) or 30
    school.plan_status = "Active"
    school.plan_start_date = date.today()
    school.plan_expiry_date = date.today() + timedelta(days=days)
    if plan:
        school.plan_type = plan.feature_tier
        school.plan_amount = plan.price
    school.save()
    return school


def clear_school_plan(school):
    school.plan_status = "Inactive"
    school.plan_type = "None"
    school.transaction_id = ""
    school.subscribed_plan = None
    school.plan_start_date = None
    school.plan_expiry_date = None
    school.save()
    return school
