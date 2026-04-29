"""
Plan enforcement utility.
Checks whether a school's active subscription allows adding more records.
"""

from rest_framework.exceptions import PermissionDenied

# Define limits per plan
PLAN_STUDENT_LIMITS = {
    'None':     0,       # No plan = no students allowed
    'Basic':    100,
    'Business': 500,
    'Pro':      None,    # None = unlimited
}

PLAN_TEACHER_LIMITS = {
    'None':     0,
    'Basic':    5,
    'Business': 30,
    'Pro':      None,
}


def check_student_limit(school):
    """
    Raises PermissionDenied if the school's plan does not allow adding more students.
    """
    if not school:
        raise PermissionDenied("No school context found.")

    plan_status = school.plan_status
    plan_type = school.plan_type

    # Must have an Active plan
    if plan_status != 'Active':
        raise PermissionDenied(
            f"Your school does not have an active subscription plan. "
            f"Current status: {plan_status}. Please activate a plan to add students."
        )

    limit = PLAN_STUDENT_LIMITS.get(plan_type)

    # Unlimited plan
    if limit is None:
        return

    if limit == 0:
        raise PermissionDenied(
            "You need a subscription plan to add students. Please purchase a plan."
        )

    # Count existing students
    from students.models import Student
    current_count = Student.objects.filter(school=school).count()

    if current_count >= limit:
        raise PermissionDenied(
            f"Your '{plan_type}' plan allows a maximum of {limit} students. "
            f"You currently have {current_count}. Please upgrade your plan."
        )


def check_teacher_limit(school):
    """
    Raises PermissionDenied if the school's plan does not allow adding more teachers.
    """
    if not school:
        raise PermissionDenied("No school context found.")

    plan_status = school.plan_status
    plan_type = school.plan_type

    if plan_status != 'Active':
        raise PermissionDenied(
            f"Your school does not have an active subscription plan. "
            f"Current status: {plan_status}. Please activate a plan to add teachers."
        )

    limit = PLAN_TEACHER_LIMITS.get(plan_type)

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
            f"Your '{plan_type}' plan allows a maximum of {limit} teachers. "
            f"You currently have {current_count}. Please upgrade your plan."
        )
