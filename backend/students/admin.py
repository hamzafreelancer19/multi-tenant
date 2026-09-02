from django.contrib import admin
from .models import Student


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("name", "class_name", "roll_no", "gender", "father_name", "phone", "status", "school")
    list_filter = ("status", "gender", "class_name", "school")
    search_fields = ("name", "roll_no", "email", "phone", "father_name", "father_phone", "bform_cnic")
