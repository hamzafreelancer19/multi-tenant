from django.contrib import admin
from .models import Attendance, TeacherAttendance


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ("student", "date", "status", "remarks", "school")
    list_filter = ("status", "date", "school")
    search_fields = ("student__name", "remarks", "marked_by")
    date_hierarchy = "date"


@admin.register(TeacherAttendance)
class TeacherAttendanceAdmin(admin.ModelAdmin):
    list_display = ("teacher", "date", "status", "remarks", "school")
    list_filter = ("status", "date", "school")
    search_fields = ("teacher__name", "remarks", "marked_by")
    date_hierarchy = "date"
