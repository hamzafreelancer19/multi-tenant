from django.db import models
from schools.models import School
from teachers.models import Teacher


class Assignment(models.Model):
    TYPES = (
        ("Homework", "Homework"),
        ("Project", "Project"),
        ("Worksheet", "Worksheet"),
        ("Quiz", "Quiz"),
        ("Practical", "Practical"),
        ("Reading", "Reading"),
    )
    STATUSES = (
        ("Assigned", "Assigned"),
        ("Draft", "Draft"),
        ("Closed", "Closed"),
    )

    school = models.ForeignKey(School, on_delete=models.CASCADE, db_constraint=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    class_name = models.CharField(max_length=80)
    subject = models.CharField(max_length=100)
    teacher = models.ForeignKey(
        Teacher, on_delete=models.SET_NULL, null=True, blank=True, db_constraint=False
    )
    assignment_type = models.CharField(max_length=20, choices=TYPES, default="Homework")
    status = models.CharField(max_length=20, choices=STATUSES, default="Assigned")
    due_date = models.DateField()
    due_time = models.TimeField(blank=True, null=True)
    max_marks = models.PositiveIntegerField(default=100)
    notes = models.CharField(max_length=255, blank=True, default="")
    attachment_url = models.CharField(max_length=500, blank=True, default="")
    posted_by = models.CharField(max_length=100, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["due_date", "-id"]

    def __str__(self):
        return f"{self.title} ({self.class_name})"
