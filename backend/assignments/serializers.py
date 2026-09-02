from datetime import date, timedelta

from rest_framework import serializers

from .models import Assignment


class AssignmentSerializer(serializers.ModelSerializer):
    teacher_name = serializers.ReadOnlyField(source="teacher.name")
    due_status = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = "__all__"
        read_only_fields = ["school", "posted_by"]
        extra_kwargs = {
            "description": {"allow_blank": True, "required": False},
            "notes": {"allow_blank": True, "required": False},
            "attachment_url": {"allow_blank": True, "required": False},
            "teacher": {"required": False, "allow_null": True},
            "due_time": {"required": False, "allow_null": True},
        }

    def get_due_status(self, obj):
        if obj.status == "Draft":
            return "Draft"
        if obj.status == "Closed":
            return "Closed"
        today = date.today()
        if not obj.due_date:
            return "Assigned"
        if obj.due_date < today:
            return "Overdue"
        if obj.due_date == today:
            return "Due today"
        if obj.due_date <= today + timedelta(days=3):
            return "Due soon"
        return "Assigned"
