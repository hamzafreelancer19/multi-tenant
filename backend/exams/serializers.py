from datetime import date

from rest_framework import serializers

from .models import Subject, Exam, ExamResult


def letter_grade(obtained, total):
    total = float(total or 0)
    if total <= 0:
        return ""
    pct = (float(obtained or 0) / total) * 100
    if pct >= 90:
        return "A+"
    if pct >= 80:
        return "A"
    if pct >= 70:
        return "B"
    if pct >= 60:
        return "C"
    if pct >= 50:
        return "D"
    return "F"


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = "__all__"
        read_only_fields = ["school"]


class ExamSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    result_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Exam
        fields = "__all__"
        read_only_fields = ["school"]
        extra_kwargs = {
            "description": {"allow_blank": True, "required": False},
            "class_name": {"allow_blank": True, "required": False},
            "subject": {"allow_blank": True, "required": False},
            "venue": {"allow_blank": True, "required": False},
        }

    def get_status(self, obj):
        today = date.today()
        if obj.start_date and today < obj.start_date:
            return "Upcoming"
        if obj.end_date and today > obj.end_date:
            return "Completed"
        return "Ongoing"


class ExamResultSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source="student.name")
    subject_name = serializers.ReadOnlyField(source="subject.name")
    exam_title = serializers.ReadOnlyField(source="exam.title")
    roll_no = serializers.ReadOnlyField(source="student.roll_no")

    class Meta:
        model = ExamResult
        fields = "__all__"

    def validate(self, attrs):
        obtained = attrs.get("marks_obtained", getattr(self.instance, "marks_obtained", 0))
        total = attrs.get("total_marks", getattr(self.instance, "total_marks", 100))
        if not attrs.get("grade"):
            attrs["grade"] = letter_grade(obtained, total)
        return attrs
