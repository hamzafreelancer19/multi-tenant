from rest_framework import viewsets

from .models import Staff, Payroll
from .serializers import StaffSerializer, PayrollSerializer
from core.utils import get_current_school, school_queryset
from core.mixins import SchoolOpsMixin
from core.models import ActivityLog


def next_employee_id(school):
    prefix = "SF-"
    codes = Staff.objects.filter(school=school, employee_id__startswith=prefix).values_list("employee_id", flat=True)
    nums = []
    for code in codes:
        try:
            nums.append(int(str(code).replace(prefix, "", 1)))
        except (TypeError, ValueError):
            continue
    n = (max(nums) if nums else 0) + 1
    while Staff.objects.filter(school=school, employee_id=f"{prefix}{n:04d}").exists():
        n += 1
    return f"{prefix}{n:04d}"


def next_receipt_no(school):
    prefix = "PAY-"
    codes = Payroll.objects.filter(staff__school=school, receipt_no__startswith=prefix).values_list("receipt_no", flat=True)
    nums = []
    for code in codes:
        try:
            nums.append(int(str(code).replace(prefix, "", 1)))
        except (TypeError, ValueError):
            continue
    n = (max(nums) if nums else 0) + 1
    while Payroll.objects.filter(staff__school=school, receipt_no=f"{prefix}{n:04d}").exists():
        n += 1
    return f"{prefix}{n:04d}"


class StaffViewSet(SchoolOpsMixin, viewsets.ModelViewSet):
    serializer_class = StaffSerializer

    def get_queryset(self):
        qs = school_queryset(self.request, Staff).order_by("name")
        role = self.request.query_params.get("role")
        if role and role != "All":
            qs = qs.filter(role=role)
        status = self.request.query_params.get("status")
        if status and status != "All":
            qs = qs.filter(status=status)
        return qs

    def perform_create(self, serializer):
        school = get_current_school(self.request)
        staff = serializer.save(school=school, employee_id=next_employee_id(school))
        ActivityLog.objects.create(
            school=school,
            name=staff.name,
            action=f"added staff {staff.name} ({staff.role})",
            avatar=staff.name[0].upper() if staff.name else "S",
        )


class PayrollViewSet(SchoolOpsMixin, viewsets.ModelViewSet):
    serializer_class = PayrollSerializer

    def get_queryset(self):
        qs = school_queryset(self.request, Payroll, lookup="staff__school").select_related("staff")
        staff_id = self.request.query_params.get("staff")
        if staff_id:
            qs = qs.filter(staff_id=staff_id)
        status = self.request.query_params.get("status")
        if status and status != "All":
            qs = qs.filter(status=status)
        return qs.order_by("-payment_date", "-id")

    def perform_create(self, serializer):
        school = get_current_school(self.request)
        staff = serializer.validated_data["staff"]
        slip = serializer.save(receipt_no=next_receipt_no(school))
        ActivityLog.objects.create(
            school=school,
            name=staff.name,
            action=f"paid salary {slip.receipt_no} to {staff.name}",
            avatar="P",
        )
