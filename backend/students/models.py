from django.db import models
from schools.models import School


class Student(models.Model):
    GENDER_CHOICES = [
        ("Male", "Male"),
        ("Female", "Female"),
        ("Other", "Other"),
    ]

    school = models.ForeignKey(School, on_delete=models.CASCADE, db_constraint=False)
    name = models.CharField(max_length=100)
    class_name = models.CharField(max_length=80)
    roll_no = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    status = models.CharField(max_length=20, default="Active")

    gender = models.CharField(max_length=20, blank=True, default="")
    date_of_birth = models.DateField(blank=True, null=True)
    bform_cnic = models.CharField(max_length=20, blank=True, default="")
    previous_school = models.CharField(max_length=255, blank=True, default="")
    address = models.TextField(blank=True, default="")
    city = models.CharField(max_length=100, blank=True, default="")

    father_name = models.CharField(max_length=255, blank=True, default="")
    father_phone = models.CharField(max_length=20, blank=True, default="")
    father_cnic = models.CharField(max_length=20, blank=True, default="")
    father_occupation = models.CharField(max_length=120, blank=True, default="")
    mother_name = models.CharField(max_length=255, blank=True, default="")
    mother_phone = models.CharField(max_length=20, blank=True, default="")
    emergency_phone = models.CharField(max_length=20, blank=True, default="")
    notes = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    parent_user = models.OneToOneField(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="child_student",
    )

    def __str__(self):
        return f"{self.name} ({self.school.name})"

    class Meta:
        ordering = ["-id"]
