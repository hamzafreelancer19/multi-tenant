from rest_framework import serializers
from .models import Attendance

class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)

    class Meta:
        model = Attendance
        fields = ['id', 'school', 'student', 'student_name', 'date', 'status']
        read_only_fields = ('school', 'student_name')
