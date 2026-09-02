from django.db import models
from students.models import Student
from schools.models import School


ATTENDANCE_STATUS_CHOICES = [
    ("Present", "Present"),
    ("Absent", "Absent"),
    ("Late", "Late"),
    ("Leave", "Leave"),
]


class Attendance(models.Model):
    STATUS_CHOICES = ATTENDANCE_STATUS_CHOICES

    school = models.ForeignKey(School, on_delete=models.CASCADE, db_constraint=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Present")
    remarks = models.CharField(max_length=255, blank=True, default="")
    marked_by = models.CharField(max_length=100, blank=True, default="")
    updated_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        unique_together = ("school", "student", "date")
        ordering = ["-date", "student_id"]

    def __str__(self):
        return f"{self.student.name} - {self.date} - {self.status}"


class TeacherAttendance(models.Model):
    STATUS_CHOICES = ATTENDANCE_STATUS_CHOICES

    school = models.ForeignKey(School, on_delete=models.CASCADE, db_constraint=False)
    teacher = models.ForeignKey(
        "teachers.Teacher",
        on_delete=models.CASCADE,
        db_constraint=False,
        related_name="attendance_records",
    )
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Present")
    remarks = models.CharField(max_length=255, blank=True, default="")
    marked_by = models.CharField(max_length=100, blank=True, default="")
    updated_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        unique_together = ("school", "teacher", "date")
        ordering = ["-date", "teacher_id"]

    def __str__(self):
        return f"{self.teacher.name} - {self.date} - {self.status}"
