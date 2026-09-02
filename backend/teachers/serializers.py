from rest_framework import serializers
from .models import Teacher


class TeacherSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=6)
    has_login = serializers.SerializerMethodField()
    login_username = serializers.SerializerMethodField()

    class Meta:
        model = Teacher
        fields = "__all__"
        read_only_fields = ("school", "employee_id", "user")
        extra_kwargs = {
            "email": {"allow_blank": True, "required": False, "allow_null": True},
            "rating": {"required": False, "allow_null": True},
            "date_of_birth": {"required": False, "allow_null": True},
            "joining_date": {"required": False, "allow_null": True},
        }

    def get_has_login(self, obj):
        return bool(obj.user_id)

    def get_login_username(self, obj):
        user = getattr(obj, "user", None)
        if user:
            return user.email or user.username
        return obj.email or ""

    def validate_email(self, value):
        return (value or "").strip().lower() or None

    def validate_date_of_birth(self, value):
        return value or None

    def validate_joining_date(self, value):
        return value or None

    def validate_rating(self, value):
        return value if value not in ("", None) else None

    def validate_classes(self, value):
        if not value:
            return []
        if isinstance(value, str):
            return [part.strip() for part in value.split(",") if part.strip()]
        return [str(item).strip() for item in value if str(item).strip()]

    def validate(self, attrs):
        password = attrs.get("password") or ""
        email = attrs.get("email") if "email" in attrs else getattr(self.instance, "email", None)
        if self.instance is None:
            if not email:
                raise serializers.ValidationError({"email": "Email is required so the teacher can log in."})
            if not password:
                raise serializers.ValidationError({"password": "Set a password (at least 6 characters) for teacher login."})
        request = self.context.get("request")
        school = None
        if request:
            from core.utils import get_current_school
            school = get_current_school(request) or getattr(request.user, "school", None)
        if email and school:
            qs = Teacher.objects.filter(school=school, email__iexact=email)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({"email": "Another teacher in this school already uses this email."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password", None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop("password", None)
        return super().update(instance, validated_data)
