from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VehicleViewSet, RouteViewSet, RouteRiderViewSet

router = DefaultRouter()
router.register(r"vehicles", VehicleViewSet, basename="vehicle")
router.register(r"routes", RouteViewSet, basename="route")
router.register(r"riders", RouteRiderViewSet, basename="rider")

urlpatterns = [
    path("", include(router.urls)),
]
