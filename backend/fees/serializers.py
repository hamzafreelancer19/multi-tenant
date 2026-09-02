from datetime import date

from rest_framework import serializers

from .models import Fee


class FeeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.name", read_only=True)
    student_class = serializers.CharField(source="student.class_name", read_only=True)
    roll_no = serializers.CharField(source="student.roll_no", read_only=True)
    remaining = serializers.SerializerMethodField()

    class Meta:
        model = Fee
        fields = [
            "id", "school", "student", "student_name", "student_class", "roll_no",
            "amount", "paid_amount", "late_fine", "status", "fee_type", "month",
            "payment_method", "receipt_no", "due_date", "date", "remarks",
            "remaining", "created_at",
        ]
        read_only_fields = ("school", "student_name", "student_class", "roll_no", "receipt_no", "created_at")

    def get_remaining(self, obj):
        return obj.remaining()

    def validate_remarks(self, value):
        return value or ""

    def validate(self, attrs):
        amount = int(attrs.get("amount", getattr(self.instance, "amount", 0)) or 0)
        late = int(attrs.get("late_fine", getattr(self.instance, "late_fine", 0)) or 0)
        paid = attrs.get("paid_amount")
        status = attrs.get("status", getattr(self.instance, "status", "Pending"))
        due = attrs.get("due_date", getattr(self.instance, "due_date", None))

        if paid is None:
            paid = amount + late if status == "Paid" else int(getattr(self.instance, "paid_amount", 0) or 0)
        paid = int(paid or 0)
        total = amount + late

        if status == "Paid":
            paid = total
            attrs["date"] = attrs.get("date") or date.today()
        elif paid <= 0:
            status = "Overdue" if due and due < date.today() else "Pending"
        elif paid < total:
            status = "Partial"
        else:
            status = "Paid"
            paid = total
            attrs["date"] = attrs.get("date") or date.today()

        attrs["paid_amount"] = paid
        attrs["status"] = status
        return attrs
