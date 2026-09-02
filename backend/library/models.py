from django.db import models
from schools.models import School
from students.models import Student


class Book(models.Model):
    CATEGORIES = (
        ("Textbook", "Textbook"),
        ("Story", "Story"),
        ("Reference", "Reference"),
        ("Science", "Science"),
        ("Islamiat", "Islamiat"),
        ("Fiction", "Fiction"),
        ("Magazine", "Magazine"),
        ("Other", "Other"),
    )
    CONDITIONS = (
        ("New", "New"),
        ("Good", "Good"),
        ("Fair", "Fair"),
        ("Damaged", "Damaged"),
    )

    school = models.ForeignKey(School, on_delete=models.CASCADE, db_constraint=False)
    accession_no = models.CharField(max_length=20, blank=True, default="")
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=200)
    isbn = models.CharField(max_length=30, blank=True, default="")
    publisher = models.CharField(max_length=120, blank=True, default="")
    category = models.CharField(max_length=30, choices=CATEGORIES, default="Textbook")
    language = models.CharField(max_length=40, blank=True, default="English")
    shelf_no = models.CharField(max_length=40, blank=True, default="")
    condition = models.CharField(max_length=20, choices=CONDITIONS, default="Good")
    quantity = models.PositiveIntegerField(default=1)
    available_quantity = models.IntegerField(default=1)
    notes = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        ordering = ["title"]

    def __str__(self):
        return self.title


class IssueReturn(models.Model):
    STATUSES = (
        ("Issued", "Issued"),
        ("Returned", "Returned"),
        ("Lost", "Lost"),
    )

    school = models.ForeignKey(School, on_delete=models.CASCADE, db_constraint=False)
    book = models.ForeignKey(Book, on_delete=models.CASCADE, db_constraint=False, related_name="issues")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, db_constraint=False)
    issue_date = models.DateField()
    due_date = models.DateField()
    return_date = models.DateField(null=True, blank=True)
    fine_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUSES, default="Issued")
    remarks = models.CharField(max_length=255, blank=True, default="")
    issued_by = models.CharField(max_length=100, blank=True, default="")

    class Meta:
        ordering = ["-issue_date", "-id"]

    def __str__(self):
        return f"{self.book.title} issued to {self.student.name}"
