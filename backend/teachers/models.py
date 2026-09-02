from django.db import models
from schools.models import School


class Teacher(models.Model):
    GENDER_CHOICES = [
        ("Male", "Male"),
        ("Female", "Female"),
        ("Other", "Other"),
    ]
    DESIGNATION_CHOICES = [
        ("Subject Teacher", "Subject Teacher"),
        ("Class Teacher", "Class Teacher"),
        ("HOD", "HOD"),
        ("Vice Principal", "Vice Principal"),
        ("Principal", "Principal"),
    ]

    school = models.ForeignKey(School, on_delete=models.CASCADE, db_constraint=False)
    name = models.CharField(max_length=100)
    subject = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True)
    experience = models.CharField(max_length=50, blank=True, null=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, blank=True, null=True)
    classes = models.JSONField(default=list, blank=True)

    employee_id = models.CharField(max_length=20, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, default="")
    gender = models.CharField(max_length=20, blank=True, default="")
    cnic = models.CharField(max_length=20, blank=True, default="")
    date_of_birth = models.DateField(blank=True, null=True)
    qualification = models.CharField(max_length=120, blank=True, default="")
    designation = models.CharField(max_length=50, blank=True, default="Subject Teacher")
    joining_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, default="Active")
    address = models.TextField(blank=True, default="")
    city = models.CharField(max_length=100, blank=True, default="")
    emergency_phone = models.CharField(max_length=20, blank=True, default="")
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    user = models.OneToOneField(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="teacher_profile",
    )

    def __str__(self):
        return f"{self.name} - {self.subject} ({self.school.name})"

    class Meta:
        ordering = ["-id"]
