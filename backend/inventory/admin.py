from django.contrib import admin
from .models import InventoryItem, StockLog


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ("sku", "item_name", "category", "quantity", "unit", "min_stock", "location", "school")
    list_filter = ("category", "school")
    search_fields = ("item_name", "sku", "category", "supplier", "location")


@admin.register(StockLog)
class StockLogAdmin(admin.ModelAdmin):
    list_display = ("item", "change_type", "quantity", "reason", "recorded_by", "date")
    list_filter = ("change_type", "item__school")
    search_fields = ("item__item_name", "reason", "recorded_by")
    date_hierarchy = "date"
