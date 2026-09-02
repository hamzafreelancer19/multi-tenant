from django.contrib import admin
from .models import Subject, Exam, ExamResult


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "school")
    list_filter = ("school",)
    search_fields = ("name", "code")


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ("title", "exam_type", "class_name", "subject", "start_date", "end_date", "school")
    list_filter = ("exam_type", "class_name", "school")
    search_fields = ("title", "class_name", "subject")
    date_hierarchy = "start_date"


@admin.register(ExamResult)
class ExamResultAdmin(admin.ModelAdmin):
    list_display = ("student", "exam", "subject", "marks_obtained", "total_marks", "grade")
    list_filter = ("grade", "exam", "subject")
    search_fields = ("student__name", "exam__title", "subject__name")
