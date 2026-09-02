from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AttendanceViewSet, TeacherAttendanceViewSet

router = DefaultRouter()
router.register("teachers", TeacherAttendanceViewSet, basename="teacher-attendance")
router.register("", AttendanceViewSet, basename="attendance")

urlpatterns = [
    path("", include(router.urls)),
]
