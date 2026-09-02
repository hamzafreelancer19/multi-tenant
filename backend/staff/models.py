from django.db import models
from schools.models import School


class Staff(models.Model):
    STAFF_ROLES = [
        ("Admin", "Admin"),
        ("Accountant", "Accountant"),
        ("Clerk", "Clerk"),
        ("Receptionist", "Receptionist"),
        ("Librarian", "Librarian"),
        ("Lab Assistant", "Lab Assistant"),
        ("Driver", "Driver"),
        ("Conductor", "Conductor"),
        ("Security", "Security"),
        ("Peon", "Peon"),
        ("Aya", "Aya"),
        ("Cleaner", "Cleaner"),
        ("Other", "Other"),
    ]
    SHIFTS = [
        ("Morning", "Morning"),
        ("Evening", "Evening"),
        ("Full day", "Full day"),
    ]
    GENDERS = [
        ("Male", "Male"),
        ("Female", "Female"),
        ("Other", "Other"),
    ]

    school = models.ForeignKey(School, on_delete=models.CASCADE, db_constraint=False)
    employee_id = models.CharField(max_length=20, blank=True, default="")
    name = models.CharField(max_length=200)
    role = models.CharField(max_length=50, choices=STAFF_ROLES, default="Other")
    shift = models.CharField(max_length=20, choices=SHIFTS, default="Morning")
    gender = models.CharField(max_length=20, blank=True, default="")
    cnic = models.CharField(max_length=20, blank=True, default="")
    date_of_birth = models.DateField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, default="")
    emergency_phone = models.CharField(max_length=20, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    address = models.TextField(blank=True, default="")
    city = models.CharField(max_length=100, blank=True, default="")
    salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    joining_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=(("Active", "Active"), ("Inactive", "Inactive")), default="Active")
    notes = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.role})"


class Payroll(models.Model):
    METHODS = [
        ("Cash", "Cash"),
        ("Bank", "Bank"),
        ("JazzCash", "JazzCash"),
        ("EasyPaisa", "EasyPaisa"),
        ("Cheque", "Cheque"),
    ]
    STATUSES = [
        ("Paid", "Paid"),
        ("Pending", "Pending"),
    ]

    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, db_constraint=False, related_name="payslips")
    month = models.CharField(max_length=20)
    year = models.IntegerField()
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    bonus = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    deduction = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=20, choices=METHODS, default="Cash")
    payment_date = models.DateField()
    receipt_no = models.CharField(max_length=20, blank=True, default="")
    remarks = models.CharField(max_length=255, blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUSES, default="Paid")

    class Meta:
        ordering = ["-payment_date", "-id"]

    def __str__(self):
        return f"Salary for {self.staff.name} - {self.month}/{self.year}"
