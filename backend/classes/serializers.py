from rest_framework import serializers

from .models import SchoolClass
from core.utils import get_current_school


class SchoolClassSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()
    teacher_name = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = SchoolClass
        fields = "__all__"
        read_only_fields = ("school",)

    def get_label(self, obj):
        return obj.label()

    def get_teacher_name(self, obj):
        return obj.class_teacher.name if obj.class_teacher_id else ""

    def get_student_count(self, obj):
        counts = self.context.get("student_counts") or {}
        return counts.get(obj.label(), 0)

    def validate_section(self, value):
        return (value or "").strip()

    def validate_room_no(self, value):
        return (value or "").strip()

    def validate_class_teacher(self, value):
        if not value:
            return None
        school = get_current_school(self.context.get("request"))
        if school and value.school_id != school.id:
            raise serializers.ValidationError("Teacher must belong to this school.")
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        school = get_current_school(request) if request else None
        name = attrs.get("name", getattr(self.instance, "name", ""))
        section = attrs.get("section", getattr(self.instance, "section", "") or "")
        qs = SchoolClass.objects.filter(school=school, name=name, section=section)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if school and qs.exists():
            raise serializers.ValidationError("This class and section already exist.")
        return attrs
