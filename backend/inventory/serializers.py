from rest_framework import serializers
from .models import InventoryItem, StockLog

class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = '__all__'
        read_only_fields = ['school']

class StockLogSerializer(serializers.ModelSerializer):
    item_name = serializers.ReadOnlyField(source='item.item_name')
    class Meta:
        model = StockLog
        fields = '__all__'
