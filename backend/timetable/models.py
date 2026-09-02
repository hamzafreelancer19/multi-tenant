from django.db import models
from schools.models import School
from teachers.models import Teacher


class Timetable(models.Model):
    DAYS = (
        ("Monday", "Monday"),
        ("Tuesday", "Tuesday"),
        ("Wednesday", "Wednesday"),
        ("Thursday", "Thursday"),
        ("Friday", "Friday"),
        ("Saturday", "Saturday"),
        ("Sunday", "Sunday"),
    )
    PERIOD_TYPES = (
        ("Lecture", "Lecture"),
        ("Lab", "Lab"),
        ("Break", "Break"),
        ("Assembly", "Assembly"),
        ("Sports", "Sports"),
    )

    school = models.ForeignKey(School, on_delete=models.CASCADE, db_constraint=False)
    class_name = models.CharField(max_length=80)
    subject = models.CharField(max_length=100)
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True, db_constraint=False)
    day = models.CharField(max_length=15, choices=DAYS)
    start_time = models.TimeField()
    end_time = models.TimeField()
    room_no = models.CharField(max_length=20, blank=True, default="")
    period_type = models.CharField(max_length=20, choices=PERIOD_TYPES, default="Lecture")
    notes = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        ordering = ["day", "start_time"]

    def __str__(self):
        return f"{self.class_name} - {self.subject} ({self.day})"


class PeriodCover(models.Model):
    """One-day substitute when the regular teacher is not available."""
    school = models.ForeignKey(School, on_delete=models.CASCADE, db_constraint=False)
    period = models.ForeignKey(Timetable, on_delete=models.CASCADE, related_name="covers")
    date = models.DateField()
    cover_teacher = models.ForeignKey(
        Teacher,
        on_delete=models.CASCADE,
        related_name="period_covers",
        db_constraint=False,
    )
    reason = models.CharField(max_length=255, blank=True, default="")
    created_by = models.CharField(max_length=100, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("period", "date")
        ordering = ["-date", "period_id"]

    def __str__(self):
        return f"{self.period} covered by {self.cover_teacher} on {self.date}"
