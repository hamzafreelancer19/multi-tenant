from django.db import models
from schools.models import School

class Staff(models.Model):
    STAFF_ROLES = [
        ('Admin', 'Admin'),
        ('Accountant', 'Accountant'),
        ('Librarian', 'Librarian'),
        ('Driver', 'Driver'),
        ('Security', 'Security'),
        ('Other', 'Other'),
    ]

    school = models.ForeignKey(School, on_delete=models.CASCADE, db_constraint=False)
    name = models.CharField(max_length=200)
    role = models.CharField(max_length=50, choices=STAFF_ROLES)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    joining_date = models.DateField()
    status = models.CharField(max_length=20, choices=(('Active', 'Active'), ('Inactive', 'Inactive')), default='Active')

    def __str__(self):
        return f"{self.name} ({self.role})"

class Payroll(models.Model):
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE)
    month = models.CharField(max_length=20)
    year = models.IntegerField()
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, default='Paid')

    def __str__(self):
        return f"Salary for {self.staff.name} - {self.month}/{self.year}"
