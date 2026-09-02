from django.db import models
from schools.models import School


class Notice(models.Model):
    CATEGORY_CHOICES = [
        ("General", "General"),
        ("Holiday", "Holiday"),
        ("Exam", "Exam"),
        ("Fee", "Fee"),
        ("Event", "Event"),
        ("Emergency", "Emergency"),
    ]
    AUDIENCE_CHOICES = [
        ("All", "Everyone"),
        ("Students", "Students"),
        ("Teachers", "Teachers"),
        ("Parents", "Parents"),
        ("Class", "Specific class"),
    ]
    PRIORITY_CHOICES = [
        ("Normal", "Normal"),
        ("Important", "Important"),
        ("Urgent", "Urgent"),
    ]

    school = models.ForeignKey(School, on_delete=models.CASCADE, db_constraint=False)
    title = models.CharField(max_length=200)
    content = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="General")
    audience = models.CharField(max_length=20, choices=AUDIENCE_CHOICES, default="All")
    class_name = models.CharField(max_length=80, blank=True, default="")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="Normal")
    is_active = models.BooleanField(default=True)
    is_pinned = models.BooleanField(default=False)
    expires_at = models.DateField(blank=True, null=True)
    posted_by = models.CharField(max_length=100, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_pinned", "-created_at"]

    def __str__(self):
        return self.title
