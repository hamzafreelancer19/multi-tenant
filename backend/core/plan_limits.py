from rest_framework.exceptions import PermissionDenied


def _plan_limits(school):
    """Return (student_limit, teacher_limit). None limit = unlimited."""
    plan = getattr(school, "subscribed_plan", None)
    if plan:
        return plan.student_limit, plan.teacher_limit

    student_map = {"None": 0, "Basic": 100, "Business": 500, "Pro": None}
    teacher_map = {"None": 0, "Basic": 5, "Business": 30, "Pro": None}
    tier = school.plan_type or "None"
    return student_map.get(tier, 0), teacher_map.get(tier, 0)


def check_student_limit(school):
    if not school:
        raise PermissionDenied("No school context found.")

    if school.plan_status != "Active":
        raise PermissionDenied(
            f"Your school does not have an active subscription plan. "
            f"Current status: {school.plan_status}. Please activate a plan to add students."
        )

    limit, _ = _plan_limits(school)
    if limit is None:
        return
    if limit == 0:
        raise PermissionDenied(
            "You need a subscription plan to add students. Please purchase a plan."
        )

    from students.models import Student

    current_count = Student.objects.filter(school=school).count()
    if current_count >= limit:
        raise PermissionDenied(
            f"Your '{school.plan_type}' plan allows a maximum of {limit} students. "
            f"You currently have {current_count}. Please upgrade your plan."
        )


def check_teacher_limit(school):
    if not school:
        raise PermissionDenied("No school context found.")

    if school.plan_status != "Active":
        raise PermissionDenied(
            f"Your school does not have an active subscription plan. "
            f"Current status: {school.plan_status}. Please activate a plan to add teachers."
        )

    _, limit = _plan_limits(school)
    if limit is None:
        return
    if limit == 0:
        raise PermissionDenied(
            "You need a subscription plan to add teachers. Please purchase a plan."
        )

    from teachers.models import Teacher

    current_count = Teacher.objects.filter(school=school).count()
    if current_count >= limit:
        raise PermissionDenied(
            f"Your '{school.plan_type}' plan allows a maximum of {limit} teachers. "
            f"You currently have {current_count}. Please upgrade your plan."
        )
