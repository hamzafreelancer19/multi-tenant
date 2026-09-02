from rest_framework import serializers

from .models import Vehicle, Route, RouteRider


class VehicleSerializer(serializers.ModelSerializer):
    route_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Vehicle
        fields = "__all__"
        read_only_fields = ["school"]
        extra_kwargs = {
            "vehicle_model": {"allow_blank": True, "required": False},
            "driver_phone": {"allow_blank": True, "required": False},
            "conductor_name": {"allow_blank": True, "required": False},
            "conductor_phone": {"allow_blank": True, "required": False},
            "notes": {"allow_blank": True, "required": False},
        }


class RouteSerializer(serializers.ModelSerializer):
    vehicle_no = serializers.ReadOnlyField(source="vehicle.vehicle_no")
    driver_name = serializers.ReadOnlyField(source="vehicle.driver_name")
    driver_phone = serializers.ReadOnlyField(source="vehicle.driver_phone")
    rider_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Route
        fields = "__all__"
        read_only_fields = ["school"]
        extra_kwargs = {
            "start_point": {"allow_blank": True, "required": False},
            "end_point": {"allow_blank": True, "required": False},
            "stops": {"allow_blank": True, "required": False},
            "notes": {"allow_blank": True, "required": False},
            "vehicle": {"required": False, "allow_null": True},
            "morning_time": {"required": False, "allow_null": True},
            "evening_time": {"required": False, "allow_null": True},
        }


class RouteRiderSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source="student.name")
    student_class = serializers.ReadOnlyField(source="student.class_name")
    student_roll = serializers.ReadOnlyField(source="student.roll_no")
    route_name = serializers.ReadOnlyField(source="route.route_name")

    class Meta:
        model = RouteRider
        fields = "__all__"
        read_only_fields = ["school"]
        extra_kwargs = {
            "stop_name": {"allow_blank": True, "required": False},
            "notes": {"allow_blank": True, "required": False},
        }
