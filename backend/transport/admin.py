from django.contrib import admin
from .models import Vehicle, Route, RouteRider


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = (
        "vehicle_no",
        "vehicle_type",
        "vehicle_model",
        "driver_name",
        "driver_phone",
        "capacity",
        "status",
        "school",
    )
    list_filter = ("status", "vehicle_type", "school")
    search_fields = ("vehicle_no", "driver_name", "driver_phone")


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ("route_name", "vehicle", "start_point", "end_point", "route_fare", "status", "school")
    list_filter = ("status", "school")
    search_fields = ("route_name", "start_point", "end_point")


@admin.register(RouteRider)
class RouteRiderAdmin(admin.ModelAdmin):
    list_display = ("student", "route", "stop_name", "school")
    list_filter = ("route", "school")
    search_fields = ("student__name", "route__route_name", "stop_name")
