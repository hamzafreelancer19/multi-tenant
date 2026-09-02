from django.contrib import admin
from .models import Notice


@admin.register(Notice)
class NoticeAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "audience", "priority", "is_active", "is_pinned", "school", "created_at")
    list_filter = ("is_active", "category", "priority", "audience", "school")
    search_fields = ("title", "content", "posted_by")
