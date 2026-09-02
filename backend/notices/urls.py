from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NoticeViewSet, PublicNoticeListView

router = DefaultRouter()
router.register(r'notices', NoticeViewSet, basename='notice')

urlpatterns = [
    path('public/', PublicNoticeListView.as_view(), name='public-notices'),
    path('', include(router.urls)),
]
