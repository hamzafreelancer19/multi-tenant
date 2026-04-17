from rest_framework import serializers
from .models import Fee

class FeeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_class = serializers.CharField(source='student.class_name', read_only=True)

    class Meta:
        model = Fee
        fields = ['id', 'school', 'student', 'student_name', 'student_class',
                  'amount', 'status', 'due_date', 'date', 'remarks', 'created_at']
        read_only_fields = ('school', 'student_name', 'student_class', 'created_at')
