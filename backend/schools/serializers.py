from rest_framework import serializers
from .models import School, Enrollment, Plan


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")

    def validate_code(self, value):
        code = (value or "").strip()
        if not code:
            raise serializers.ValidationError("Code is required.")
        return code

    def validate_features(self, value):
        if value is None:
            return []
        if isinstance(value, str):
            return [line.strip() for line in value.splitlines() if line.strip()]
        if not isinstance(value, list):
            raise serializers.ValidationError("Features must be a list.")
        return [str(item).strip() for item in value if str(item).strip()]

    def validate_locked_features(self, value):
        return self.validate_features(value)


class SchoolSerializer(serializers.ModelSerializer):
    plan_name = serializers.SerializerMethodField()

    class Meta:
        model = School
        fields = "__all__"
        extra_kwargs = {
            "landing_contact_email": {"allow_blank": True, "required": False},
        }

    def get_plan_name(self, obj):
        if obj.subscribed_plan_id:
            return obj.subscribed_plan.name
        if obj.plan_type and obj.plan_type != "None":
            return obj.plan_type
        return ""

    def _file_url(self, field):
        if not field or not getattr(field, "name", None):
            return None
        request = self.context.get("request")
        try:
            url = field.url
        except ValueError:
            return None
        if request:
            return request.build_absolute_uri(url)
        return url

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["logo_url"] = self._file_url(instance.logo)
        data["favicon_url"] = self._file_url(instance.favicon)
        request = self.context.get("request")
        if not request or getattr(getattr(request, "user", None), "role", None) != "superadmin":
            data.pop("ai_api_key", None)
        return data


class EnrollmentSerializer(serializers.ModelSerializer):
    incharge_name = serializers.SerializerMethodField()
    stage_label = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = "__all__"
        read_only_fields = (
            "assigned_incharge",
            "school_class",
            "incharge_submitted_at",
        )

    def get_incharge_name(self, obj):
        return obj.assigned_incharge.name if obj.assigned_incharge_id else ""

    def get_stage_label(self, obj):
        labels = {
            "Pending": "Class test",
            "PendingIncharge": "Class test",
            "PendingAdmin": "Admin approval",
            "Accepted": "Accepted",
            "Rejected": "Rejected",
        }
        return labels.get(obj.status, obj.status)

    def to_internal_value(self, data):
        payload = data.copy() if hasattr(data, "copy") else dict(data)
        if payload.get("date_of_birth") in ("", None):
            payload["date_of_birth"] = None
        payload.pop("status", None)
        payload.pop("assigned_incharge", None)
        payload.pop("school_class", None)
        return super().to_internal_value(payload)
