from django.db import models
from students.models import Student
from schools.models import School

class Attendance(models.Model):
    STATUS_CHOICES = [
        ('Present', 'Present'),
        ('Absent', 'Absent'),
        ('Leave', 'Leave'),
    ]

    school = models.ForeignKey(School, on_delete=models.CASCADE, db_constraint=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    date = models.DateField()  # Custom date passed from frontend
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Present')

    class Meta:
        unique_together = ('school', 'student', 'date')  # One record per student per day

    def __str__(self):
        return f"{self.student.name} - {self.date} - {self.status}"
