from rest_framework import serializers
from .models import Subject, Exam, ExamResult
from students.models import Student

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = '__all__'
        read_only_fields = ['school']

class ExamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exam
        fields = '__all__'
        read_only_fields = ['school']

class ExamResultSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.name')
    subject_name = serializers.ReadOnlyField(source='subject.name')
    exam_title = serializers.ReadOnlyField(source='exam.title')

    class Meta:
        model = ExamResult
        fields = '__all__'
