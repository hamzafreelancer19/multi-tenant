from rest_framework import serializers
from .models import Attendance, TeacherAttendance


class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.name", read_only=True)
    student_class = serializers.CharField(source="student.class_name", read_only=True)
    roll_no = serializers.CharField(source="student.roll_no", read_only=True)

    class Meta:
        model = Attendance
        fields = [
            "id", "school", "student", "student_name", "student_class",
            "roll_no", "date", "status", "remarks", "marked_by", "updated_at",
        ]
        read_only_fields = ("school", "student_name", "student_class", "roll_no", "marked_by", "updated_at")


class TeacherAttendanceSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.name", read_only=True)
    subject = serializers.CharField(source="teacher.subject", read_only=True)
    employee_id = serializers.CharField(source="teacher.employee_id", read_only=True, allow_null=True, allow_blank=True)
    designation = serializers.CharField(source="teacher.designation", read_only=True, allow_null=True, allow_blank=True)

    class Meta:
        model = TeacherAttendance
        fields = [
            "id", "school", "teacher", "teacher_name", "subject", "employee_id",
            "designation", "date", "status", "remarks", "marked_by", "updated_at",
        ]
        read_only_fields = (
            "school", "teacher_name", "subject", "employee_id",
            "designation", "marked_by", "updated_at",
        )
