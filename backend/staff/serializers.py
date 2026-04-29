from rest_framework import serializers
from .models import Staff, Payroll

class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = '__all__'
        read_only_fields = ['school']

class PayrollSerializer(serializers.ModelSerializer):
    staff_name = serializers.ReadOnlyField(source='staff.name')
    staff_role = serializers.ReadOnlyField(source='staff.role')
    
    class Meta:
        model = Payroll
        fields = '__all__'
