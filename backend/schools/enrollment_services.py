from classes.models import SchoolClass
from teachers.scoping import class_name_allowed, canonicalize_labels


def resolve_enrollment_class(school, class_applying):
    if not school or not (class_applying or "").strip():
        return None, None
    labels = canonicalize_labels(school, [class_applying])
    rows = SchoolClass.objects.filter(school=school).select_related("class_teacher")
    for sc in rows:
        if class_name_allowed(sc.label(), labels) or class_name_allowed(class_applying, {sc.label(), sc.name}):
            return sc, sc.class_teacher
    return None, None
