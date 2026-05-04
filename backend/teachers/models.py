from django.db import models
from schools.models import School

class Teacher(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, db_constraint=False)
    name = models.CharField(max_length=100)
    subject = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True)
    experience = models.CharField(max_length=50, blank=True, null=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=5.0)
    classes = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.name} - {self.subject} ({self.school.name})"
