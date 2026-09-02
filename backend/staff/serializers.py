from rest_framework import serializers

from .models import Staff, Payroll


class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = "__all__"
        read_only_fields = ["school", "employee_id"]
        extra_kwargs = {
            "phone": {"allow_blank": True, "required": False},
            "email": {"allow_blank": True, "required": False},
            "cnic": {"allow_blank": True, "required": False},
            "address": {"allow_blank": True, "required": False},
            "city": {"allow_blank": True, "required": False},
            "emergency_phone": {"allow_blank": True, "required": False},
            "notes": {"allow_blank": True, "required": False},
            "gender": {"allow_blank": True, "required": False},
            "joining_date": {"required": False, "allow_null": True},
            "date_of_birth": {"required": False, "allow_null": True},
        }


class PayrollSerializer(serializers.ModelSerializer):
    staff_name = serializers.ReadOnlyField(source="staff.name")
    staff_role = serializers.ReadOnlyField(source="staff.role")
    staff_salary = serializers.ReadOnlyField(source="staff.salary")
    net_amount = serializers.SerializerMethodField()

    class Meta:
        model = Payroll
        fields = "__all__"
        read_only_fields = ["receipt_no"]
        extra_kwargs = {
            "remarks": {"allow_blank": True, "required": False},
        }

    def get_net_amount(self, obj):
        return float(obj.amount_paid or 0) + float(obj.bonus or 0) - float(obj.deduction or 0)

    def validate(self, attrs):
        staff = attrs.get("staff", getattr(self.instance, "staff", None))
        month = attrs.get("month", getattr(self.instance, "month", None))
        year = attrs.get("year", getattr(self.instance, "year", None))
        if staff and month and year:
            qs = Payroll.objects.filter(staff=staff, month=month, year=year)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError("A payslip for this staff member already exists for that month.")
        return attrs
