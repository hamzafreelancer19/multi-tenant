from rest_framework import serializers
from .models import Vehicle, Route

class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = '__all__'
        read_only_fields = ['school']

class RouteSerializer(serializers.ModelSerializer):
    vehicle_no = serializers.ReadOnlyField(source='vehicle.vehicle_no')
    driver_name = serializers.ReadOnlyField(source='vehicle.driver_name')
    
    class Meta:
        model = Route
        fields = '__all__'
        read_only_fields = ['school']
