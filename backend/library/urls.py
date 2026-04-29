from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookViewSet, IssueReturnViewSet

router = DefaultRouter()
router.register(r'books', BookViewSet, basename='book')
router.register(r'issue-returns', IssueReturnViewSet, basename='issue-return')

urlpatterns = [
    path('', include(router.urls)),
]
