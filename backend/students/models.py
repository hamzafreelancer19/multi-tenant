from django.db import models
from schools.models import School

class Student(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, db_constraint=False)
    name = models.CharField(max_length=100)
    class_name = models.CharField(max_length=50)
    roll_no = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    status = models.CharField(max_length=20, default='Active')
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.school.name})"

    class Meta:
        ordering = ['-id']
