from django.contrib import admin
from .models import Teacher


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ("name", "employee_id", "subject", "phone", "status", "school")
    list_filter = ("status", "subject", "designation", "school")
    search_fields = ("name", "subject", "email", "phone", "employee_id", "cnic")
