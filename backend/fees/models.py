from django.db import models
from students.models import Student
from schools.models import School


class Fee(models.Model):
    STATUS_CHOICES = [
        ("Paid", "Paid"),
        ("Pending", "Pending"),
        ("Partial", "Partial"),
        ("Overdue", "Overdue"),
    ]
    TYPE_CHOICES = [
        ("Tuition", "Tuition"),
        ("Transport", "Transport"),
        ("Admission", "Admission"),
        ("Exam", "Exam"),
        ("Lab", "Lab"),
        ("Other", "Other"),
    ]
    METHOD_CHOICES = [
        ("Cash", "Cash"),
        ("Bank", "Bank transfer"),
        ("JazzCash", "JazzCash"),
        ("EasyPaisa", "EasyPaisa"),
        ("Cheque", "Cheque"),
    ]

    school = models.ForeignKey(School, on_delete=models.CASCADE, db_constraint=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    amount = models.IntegerField()
    paid_amount = models.IntegerField(default=0)
    late_fine = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Pending")
    fee_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default="Tuition")
    month = models.CharField(max_length=7, blank=True, default="")  # YYYY-MM
    payment_method = models.CharField(max_length=20, blank=True, default="")
    receipt_no = models.CharField(max_length=20, blank=True, default="")
    due_date = models.DateField(null=True, blank=True)
    date = models.DateField(null=True, blank=True)
    remarks = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def remaining(self):
        return max(0, (self.amount or 0) + (self.late_fine or 0) - (self.paid_amount or 0))

    def __str__(self):
        return f"{self.student.name} - {self.amount} ({self.status})"
