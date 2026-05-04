from django.db import models
from schools.models import School
from teachers.models import Teacher

class Timetable(models.Model):
    DAYS = (
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
        ('Saturday', 'Saturday'),
        ('Sunday', 'Sunday'),
    )

    school = models.ForeignKey(School, on_delete=models.CASCADE, db_constraint=False)
    class_name = models.CharField(max_length=50)
    subject = models.CharField(max_length=100)
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True)
    day = models.CharField(max_length=15, choices=DAYS)
    start_time = models.TimeField()
    end_time = models.TimeField()
    room_no = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.class_name} - {self.subject} ({self.day})"
