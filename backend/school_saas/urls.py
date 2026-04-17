from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from users.views import MeView, SignupView
from core.views import (
    DashboardStatsView, 
    ActivityLogListView, 
    NotificationListView,
    MarkNotificationReadView,
    MarkAllNotificationsReadView,
    SystemDatabaseView
)

from rest_framework.routers import DefaultRouter
from schools.views import SchoolViewSet
from users.views import UserViewSet

router = DefaultRouter()
router.register('schools', SchoolViewSet, basename='school')
router.register('platform-users', UserViewSet, basename='platform-user')

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from users.auth import MyTokenObtainPairSerializer

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Platform Admin Routes
    path('api/', include(router.urls)),
    
    # JWT Auth
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Real Auth Integration
    path('api/signup/', SignupView.as_view(), name='signup'),
    path('api/me/', MeView.as_view(), name='me'),
    path('api/dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('api/dashboard/activities/', ActivityLogListView.as_view(), name='dashboard-activities'),
    path('api/dashboard/notifications/', NotificationListView.as_view(), name='dashboard-notifications'),
    path('api/notifications/<int:pk>/read/', MarkNotificationReadView.as_view(), name='notification-read'),
    path('api/notifications/read-all/', MarkAllNotificationsReadView.as_view(), name='notification-read-all'),
    path('api/system/explorer/', SystemDatabaseView.as_view(), name='system-explorer'),

    # Apps
    path('api/students/', include('students.urls')),
    path('api/teachers/', include('teachers.urls')),
    path('api/attendance/', include('attendance.urls')),
    path('api/fees/', include('fees.urls')),
]
