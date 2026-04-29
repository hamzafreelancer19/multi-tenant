from rest_framework import viewsets
from .models import Book, IssueReturn
from .serializers import BookSerializer, IssueReturnSerializer
from core.utils import get_current_school

class BookViewSet(viewsets.ModelViewSet):
    serializer_class = BookSerializer
    def get_queryset(self):
        school = get_current_school(self.request)
        if school: return Book.objects.filter(school=school)
        return Book.objects.none()
    def perform_create(self, serializer):
        serializer.save(school=get_current_school(self.request))

class IssueReturnViewSet(viewsets.ModelViewSet):
    serializer_class = IssueReturnSerializer
    def get_queryset(self):
        school = get_current_school(self.request)
        if school: return IssueReturn.objects.filter(school=school)
        return IssueReturn.objects.none()
    def perform_create(self, serializer):
        serializer.save(school=get_current_school(self.request))
