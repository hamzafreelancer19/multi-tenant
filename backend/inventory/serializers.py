from rest_framework import serializers
from .models import InventoryItem, StockLog


class InventoryItemSerializer(serializers.ModelSerializer):
    low_stock = serializers.SerializerMethodField()

    class Meta:
        model = InventoryItem
        fields = "__all__"
        read_only_fields = ["school", "sku"]

    def get_low_stock(self, obj):
        return obj.quantity <= (obj.min_stock or 0)

    def update(self, instance, validated_data):
        validated_data.pop("quantity", None)
        return super().update(instance, validated_data)


class StockLogSerializer(serializers.ModelSerializer):
    item_name = serializers.ReadOnlyField(source="item.item_name")
    item_sku = serializers.ReadOnlyField(source="item.sku")

    class Meta:
        model = StockLog
        fields = "__all__"
        read_only_fields = ["recorded_by"]

    def validate_quantity(self, value):
        if value is None or int(value) <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0.")
        return value
