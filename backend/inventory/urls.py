from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InventoryItemViewSet, StockLogViewSet

router = DefaultRouter()
router.register(r'items', InventoryItemViewSet, basename='inventory-item')
router.register(r'stock-logs', StockLogViewSet, basename='stock-log')

urlpatterns = [
    path('', include(router.urls)),
]
