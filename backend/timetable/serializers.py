from rest_framework import serializers
from .models import Timetable

class TimetableSerializer(serializers.ModelSerializer):
    teacher_name = serializers.ReadOnlyField(source='teacher.name')
    
    class Meta:
        model = Timetable
        fields = '__all__'
        read_only_fields = ['school']
