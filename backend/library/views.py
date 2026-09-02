from datetime import date

from django.db.models import Count, Q
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import Book, IssueReturn
from .serializers import BookSerializer, IssueReturnSerializer
from core.utils import get_current_school, school_queryset
from core.mixins import SchoolOpsMixin
from core.models import ActivityLog


def next_accession_no(school):
    prefix = "LIB-"
    codes = Book.objects.filter(school=school, accession_no__startswith=prefix).values_list("accession_no", flat=True)
    nums = []
    for code in codes:
        try:
            nums.append(int(str(code).replace(prefix, "", 1)))
        except (TypeError, ValueError):
            continue
    n = (max(nums) if nums else 0) + 1
    while Book.objects.filter(school=school, accession_no=f"{prefix}{n:04d}").exists():
        n += 1
    return f"{prefix}{n:04d}"


class BookViewSet(SchoolOpsMixin, viewsets.ModelViewSet):
    serializer_class = BookSerializer

    def check_permissions(self, request):
        super().check_permissions(request)
        if request.method not in ("GET", "HEAD", "OPTIONS") and getattr(request.user, "role", None) == "student":
            raise PermissionDenied("Students can view the library only.")

    def get_queryset(self):
        qs = school_queryset(self.request, Book).annotate(
            issued_count=Count("issues", filter=Q(issues__status="Issued"))
        ).order_by("title")
        category = self.request.query_params.get("category")
        if category and category != "All":
            qs = qs.filter(category=category)
        return qs

    def perform_create(self, serializer):
        school = get_current_school(self.request)
        qty = serializer.validated_data.get("quantity") or 1
        avail = serializer.validated_data.get("available_quantity")
        if avail is None:
            avail = qty
        book = serializer.save(
            school=school,
            accession_no=next_accession_no(school),
            quantity=qty,
            available_quantity=avail,
        )
        ActivityLog.objects.create(
            school=school,
            name=getattr(self.request.user, "username", "Admin"),
            action=f"added book {book.title}",
            avatar="L",
        )

    def perform_update(self, serializer):
        instance = self.get_object()
        old_qty = instance.quantity
        book = serializer.save()
        if book.quantity != old_qty:
            delta = book.quantity - old_qty
            book.available_quantity = max(0, min(book.quantity, book.available_quantity + delta))
            book.save(update_fields=["available_quantity"])


class IssueReturnViewSet(SchoolOpsMixin, viewsets.ModelViewSet):
    serializer_class = IssueReturnSerializer

    def check_permissions(self, request):
        super().check_permissions(request)
        if request.method not in ("GET", "HEAD", "OPTIONS") and getattr(request.user, "role", None) == "student":
            raise PermissionDenied("Students can view issued books only.")

    def get_queryset(self):
        qs = school_queryset(self.request, IssueReturn).select_related("book", "student").order_by("-issue_date", "-id")
        status = self.request.query_params.get("status")
        if status and status != "All":
            qs = qs.filter(status=status)
        student_id = self.request.query_params.get("student")
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs

    def perform_create(self, serializer):
        school = get_current_school(self.request)
        book = serializer.validated_data["book"]
        student = serializer.validated_data["student"]
        if book.school_id != school.id:
            raise ValidationError("Book does not belong to this school.")
        if student.school_id != school.id:
            raise ValidationError("Student does not belong to this school.")
        if book.available_quantity < 1:
            raise ValidationError("No copies of this book are available.")
        if IssueReturn.objects.filter(school=school, book=book, student=student, status="Issued").exists():
            raise ValidationError("This student already has this book issued.")
        book.available_quantity = max(0, book.available_quantity - 1)
        book.save(update_fields=["available_quantity"])
        issue = serializer.save(
            school=school,
            issued_by=getattr(self.request.user, "username", "") or "",
        )
        ActivityLog.objects.create(
            school=school,
            name=issue.issued_by or "Admin",
            action=f"issued {book.title} to {student.name}",
            avatar="L",
        )

    def perform_update(self, serializer):
        instance = self.get_object()
        old_status = instance.status
        issue = serializer.save()
        if old_status == "Issued" and issue.status == "Returned":
            book = issue.book
            book.available_quantity = min(book.quantity, book.available_quantity + 1)
            book.save(update_fields=["available_quantity"])
            if not issue.return_date:
                issue.return_date = date.today()
            if issue.due_date and issue.return_date and issue.return_date > issue.due_date and not issue.fine_amount:
                issue.fine_amount = (issue.return_date - issue.due_date).days * 10
            issue.save()
        elif old_status == "Issued" and issue.status == "Lost":
            book = issue.book
            book.quantity = max(0, book.quantity - 1)
            book.save(update_fields=["quantity"])

    def perform_destroy(self, instance):
        if instance.status == "Issued":
            book = instance.book
            book.available_quantity = min(book.quantity, book.available_quantity + 1)
            book.save(update_fields=["available_quantity"])
        instance.delete()
