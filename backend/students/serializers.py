from rest_framework import serializers

from .models import Student
from .services import student_portal_username


class StudentSerializer(serializers.ModelSerializer):
    parent_username = serializers.SerializerMethodField()
    has_parent_login = serializers.SerializerMethodField()
    student_username = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = "__all__"
        read_only_fields = ("school", "roll_no", "parent_user")
        extra_kwargs = {
            "email": {"allow_blank": True, "required": False, "allow_null": True},
            "phone": {"allow_blank": True, "required": False, "allow_null": True},
            "date_of_birth": {"required": False, "allow_null": True},
        }

    def get_parent_username(self, obj):
        user = getattr(obj, "parent_user", None)
        return user.username if user else ""

    def get_has_parent_login(self, obj):
        return bool(obj.parent_user_id)

    def get_student_username(self, obj):
        return student_portal_username(obj)

    def validate_date_of_birth(self, value):
        return value or None

    def validate_email(self, value):
        return value or None
