from rest_framework import viewsets
from .models import Vehicle, Route
from .serializers import VehicleSerializer, RouteSerializer
from core.utils import get_current_school

class VehicleViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleSerializer
    def get_queryset(self):
        school = get_current_school(self.request)
        if school: return Vehicle.objects.filter(school=school)
        return Vehicle.objects.none()
    def perform_create(self, serializer):
        serializer.save(school=get_current_school(self.request))

class RouteViewSet(viewsets.ModelViewSet):
    serializer_class = RouteSerializer
    def get_queryset(self):
        school = get_current_school(self.request)
        if school: return Route.objects.filter(school=school)
        return Route.objects.none()
    def perform_create(self, serializer):
        serializer.save(school=get_current_school(self.request))
