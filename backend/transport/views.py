from django.db.models import Count
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import Vehicle, Route, RouteRider
from .serializers import VehicleSerializer, RouteSerializer, RouteRiderSerializer
from core.utils import get_current_school, school_queryset
from core.mixins import SchoolOpsMixin
from core.models import ActivityLog


class VehicleViewSet(SchoolOpsMixin, viewsets.ModelViewSet):
    serializer_class = VehicleSerializer

    def check_permissions(self, request):
        super().check_permissions(request)
        if request.method not in ("GET", "HEAD", "OPTIONS") and getattr(request.user, "role", None) == "student":
            raise PermissionDenied("Students can view transport only.")

    def get_queryset(self):
        return school_queryset(self.request, Vehicle).annotate(route_count=Count("routes")).order_by("vehicle_no")

    def perform_create(self, serializer):
        school = get_current_school(self.request)
        vehicle = serializer.save(school=school)
        ActivityLog.objects.create(
            school=school,
            name=getattr(self.request.user, "username", "Admin"),
            action=f"added vehicle {vehicle.vehicle_no}",
            avatar="B",
        )


class RouteViewSet(SchoolOpsMixin, viewsets.ModelViewSet):
    serializer_class = RouteSerializer

    def check_permissions(self, request):
        super().check_permissions(request)
        if request.method not in ("GET", "HEAD", "OPTIONS") and getattr(request.user, "role", None) == "student":
            raise PermissionDenied("Students can view transport only.")

    def get_queryset(self):
        return school_queryset(self.request, Route).select_related("vehicle").annotate(
            rider_count=Count("riders")
        ).order_by("route_name")

    def perform_create(self, serializer):
        school = get_current_school(self.request)
        route = serializer.save(school=school)
        ActivityLog.objects.create(
            school=school,
            name=getattr(self.request.user, "username", "Admin"),
            action=f"added route {route.route_name}",
            avatar="B",
        )


class RouteRiderViewSet(SchoolOpsMixin, viewsets.ModelViewSet):
    serializer_class = RouteRiderSerializer

    def check_permissions(self, request):
        super().check_permissions(request)
        if request.method not in ("GET", "HEAD", "OPTIONS") and getattr(request.user, "role", None) == "student":
            raise PermissionDenied("Students can view transport only.")

    def get_queryset(self):
        qs = school_queryset(self.request, RouteRider).select_related("route", "student", "route__vehicle")
        route_id = self.request.query_params.get("route")
        if route_id:
            qs = qs.filter(route_id=route_id)
        student_id = self.request.query_params.get("student")
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs.order_by("stop_name", "id")

    def perform_create(self, serializer):
        school = get_current_school(self.request)
        student = serializer.validated_data["student"]
        route = serializer.validated_data["route"]
        if student.school_id != school.id or route.school_id != school.id:
            raise ValidationError("Student and route must belong to this school.")
        if RouteRider.objects.filter(school=school, student=student).exists():
            raise ValidationError("This student is already assigned to a route.")
        serializer.save(school=school)
