from django.db import models
from schools.models import School


class SchoolClass(models.Model):
    SHIFT_CHOICES = [
        ("Morning", "Morning"),
        ("Afternoon", "Afternoon"),
        ("Evening", "Evening"),
    ]

    school = models.ForeignKey(School, on_delete=models.CASCADE, db_constraint=False)
    name = models.CharField(max_length=80)
    section = models.CharField(max_length=20, blank=True, default="")
    room_no = models.CharField(max_length=20, blank=True, default="")
    class_teacher = models.ForeignKey(
        "teachers.Teacher",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_constraint=False,
        related_name="homeroom_classes",
    )
    capacity = models.PositiveIntegerField(default=40)
    shift = models.CharField(max_length=20, choices=SHIFT_CHOICES, default="Morning")
    academic_year = models.CharField(max_length=20, blank=True, default="")
    status = models.CharField(max_length=20, default="Active")
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        verbose_name_plural = "Classes"
        unique_together = ("school", "name", "section")
        ordering = ["name", "section"]

    def label(self):
        return f"{self.name} - {self.section}" if self.section else self.name

    def __str__(self):
        return f"{self.label()} ({self.school.name})"
