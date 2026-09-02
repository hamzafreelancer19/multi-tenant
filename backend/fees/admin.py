from django.contrib import admin
from .models import Fee


@admin.register(Fee)
class FeeAdmin(admin.ModelAdmin):
    list_display = ("student", "fee_type", "month", "amount", "paid_amount", "status", "receipt_no", "school")
    list_filter = ("status", "fee_type", "school")
    search_fields = ("student__name", "remarks", "receipt_no")
    date_hierarchy = "created_at"
