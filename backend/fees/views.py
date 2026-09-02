from datetime import date

from django.db.models import Sum
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Fee
from .serializers import FeeSerializer
from core.models import ActivityLog
from core.utils import get_current_school
from core.mixins import SchoolOpsMixin
from teachers.scoping import apply_teacher_class_scope, deny_teacher_writes


def next_receipt_no(school):
    prefix = "FEE-"
    codes = Fee.objects.filter(school=school, receipt_no__startswith=prefix).values_list("receipt_no", flat=True)
    nums = []
    for code in codes:
        try:
            nums.append(int(str(code).replace(prefix, "", 1)))
        except (TypeError, ValueError):
            continue
    n = (max(nums) if nums else 0) + 1
    while Fee.objects.filter(school=school, receipt_no=f"{prefix}{n:04d}").exists():
        n += 1
    return f"{prefix}{n:04d}"


class FeeViewSet(SchoolOpsMixin, viewsets.ModelViewSet):
    serializer_class = FeeSerializer

    def check_permissions(self, request):
        super().check_permissions(request)
        deny_teacher_writes(request, "Fee records are managed by school admin.")

    def get_queryset(self):
        school = get_current_school(self.request)
        if not school:
            return Fee.objects.none()
        qs = apply_teacher_class_scope(
            self.request,
            Fee.objects.filter(school=school).select_related("student"),
            field="student__class_name",
        )
        status = self.request.query_params.get("status")
        if status and status != "All":
            qs = qs.filter(status=status)
        student_id = self.request.query_params.get("student")
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs.order_by("-created_at")

    def perform_create(self, serializer):
        school = get_current_school(self.request)
        fee = serializer.save(school=school, receipt_no=next_receipt_no(school))
        ActivityLog.objects.create(
            school=school,
            name=fee.student.name,
            action=f"fee recorded: RS. {fee.amount} ({fee.status})",
            avatar=fee.student.name[0].upper() if fee.student.name else "S",
        )

    @action(detail=False, methods=["get"])
    def stats(self, request):
        school = get_current_school(self.request)
        if not school:
            return Response({"error": "No school found"}, status=400)
        fees = Fee.objects.filter(school=school)
        collected = fees.aggregate(Sum("paid_amount"))["paid_amount__sum"] or 0
        open_fees = fees.exclude(status="Paid")
        pending = 0
        overdue_count = 0
        today = date.today()
        for fee in open_fees:
            pending += fee.remaining()
            if fee.status == "Overdue" or (fee.due_date and fee.due_date < today):
                overdue_count += 1
        month_key = today.strftime("%Y-%m")
        month_collected = fees.filter(month=month_key).aggregate(Sum("paid_amount"))["paid_amount__sum"] or 0
        return Response({
            "collected": collected,
            "pending": pending,
            "overdue_count": overdue_count,
            "month_collected": month_collected,
        })
