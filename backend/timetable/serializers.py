from rest_framework import serializers

from .models import Timetable
from core.utils import get_current_school


def times_overlap(start_a, end_a, start_b, end_b):
    return start_a < end_b and start_b < end_a


class TimetableSerializer(serializers.ModelSerializer):
    teacher_name = serializers.ReadOnlyField(source="teacher.name")
    teacher_subject = serializers.ReadOnlyField(source="teacher.subject")

    class Meta:
        model = Timetable
        fields = "__all__"
        read_only_fields = ["school"]
        extra_kwargs = {
            "room_no": {"allow_blank": True, "required": False},
            "notes": {"allow_blank": True, "required": False},
            "teacher": {"required": False, "allow_null": True},
        }

    def validate(self, attrs):
        start = attrs.get("start_time", getattr(self.instance, "start_time", None))
        end = attrs.get("end_time", getattr(self.instance, "end_time", None))
        if start and end and end <= start:
            raise serializers.ValidationError("End time must be after start time.")

        request = self.context.get("request")
        school = get_current_school(request) if request else None
        day = attrs.get("day", getattr(self.instance, "day", None))
        class_name = attrs.get("class_name", getattr(self.instance, "class_name", None))
        teacher = attrs.get("teacher", getattr(self.instance, "teacher", None))
        room = (attrs.get("room_no", getattr(self.instance, "room_no", "") or "") or "").strip()
        period_type = attrs.get("period_type", getattr(self.instance, "period_type", "Lecture"))

        if school and start and end and day:
            qs = Timetable.objects.filter(school=school, day=day)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            for other in qs:
                if not times_overlap(start, end, other.start_time, other.end_time):
                    continue
                if class_name and other.class_name == class_name:
                    raise serializers.ValidationError("This class already has a period in that time.")
                if period_type != "Break" and teacher and other.teacher_id and other.teacher_id == getattr(teacher, "id", teacher):
                    raise serializers.ValidationError(f"{other.teacher.name} is already scheduled at this time.")
                if room and other.room_no and other.room_no == room:
                    raise serializers.ValidationError(f"Room {room} is already booked at this time.")
        return attrs
