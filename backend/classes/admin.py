from django.contrib import admin
from .models import SchoolClass


@admin.register(SchoolClass)
class SchoolClassAdmin(admin.ModelAdmin):
    list_display = ("name", "section", "room_no", "class_teacher", "shift", "status", "school")
    list_filter = ("status", "shift", "name", "school")
    search_fields = ("name", "section", "room_no")
