from rest_framework import viewsets
from .models import InventoryItem, StockLog
from .serializers import InventoryItemSerializer, StockLogSerializer
from core.utils import get_current_school

class InventoryItemViewSet(viewsets.ModelViewSet):
    serializer_class = InventoryItemSerializer
    def get_queryset(self):
        school = get_current_school(self.request)
        if school: return InventoryItem.objects.filter(school=school)
        return InventoryItem.objects.none()
    def perform_create(self, serializer):
        serializer.save(school=get_current_school(self.request))

class StockLogViewSet(viewsets.ModelViewSet):
    serializer_class = StockLogSerializer
    def get_queryset(self):
        school = get_current_school(self.request)
        if school: return StockLog.objects.filter(item__school=school)
        return StockLog.objects.none()
