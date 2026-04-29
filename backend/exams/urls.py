from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SubjectViewSet, ExamViewSet, ExamResultViewSet

router = DefaultRouter()
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'exams', ExamViewSet, basename='exam')
router.register(r'results', ExamResultViewSet, basename='examresult')

urlpatterns = [
    path('', include(router.urls)),
]
