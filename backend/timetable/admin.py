from django.contrib import admin
from .models import PeriodCover, Timetable


@admin.register(Timetable)
class TimetableAdmin(admin.ModelAdmin):
    list_display = ("class_name", "subject", "teacher", "day", "start_time", "end_time", "room_no", "period_type", "notes", "school")
    list_filter = ("day", "period_type", "class_name", "school")
    search_fields = ("class_name", "subject", "room_no")


@admin.register(PeriodCover)
class PeriodCoverAdmin(admin.ModelAdmin):
    list_display = ("date", "period", "cover_teacher", "reason", "school")
    list_filter = ("date", "school")
    search_fields = ("period__class_name", "cover_teacher__name", "reason")
