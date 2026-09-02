from django.contrib import admin
from .models import Assignment


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "class_name",
        "subject",
        "assignment_type",
        "teacher",
        "due_date",
        "max_marks",
        "status",
        "school",
    )
    list_filter = ("assignment_type", "status", "class_name", "school")
    search_fields = ("title", "description", "class_name", "subject")
    date_hierarchy = "due_date"
