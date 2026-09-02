from django.contrib import admin
from .models import Book, IssueReturn


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = (
        "accession_no",
        "title",
        "author",
        "category",
        "shelf_no",
        "quantity",
        "available_quantity",
        "condition",
        "school",
    )
    list_filter = ("category", "condition", "language", "school")
    search_fields = ("title", "author", "isbn", "accession_no")


@admin.register(IssueReturn)
class IssueReturnAdmin(admin.ModelAdmin):
    list_display = ("book", "student", "issue_date", "due_date", "return_date", "status", "fine_amount", "school")
    list_filter = ("status", "school")
    search_fields = ("book__title", "student__name")
