from django.conf import settings
from django.db import models
from schools.models import School


class ActivityLog(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=100)
    action = models.CharField(max_length=255)
    avatar = models.CharField(max_length=5, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} {self.action}"


class Notification(models.Model):
    AUDIENCE_CHOICES = [
        ("Admin", "School admin"),
        ("Teacher", "Teacher"),
        ("Parent", "Parent"),
        ("Accountant", "Accountant"),
        ("Student", "Student"),
        ("All", "Everyone"),
    ]

    school = models.ForeignKey(School, on_delete=models.CASCADE, null=True, blank=True)
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    audience = models.CharField(max_length=20, choices=AUDIENCE_CHOICES, default="Admin")
    teacher = models.ForeignKey(
        "teachers.Teacher",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
        db_constraint=False,
    )
    link_path = models.CharField(max_length=120, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notif: {self.message}"


class NotificationRead(models.Model):
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name="reads")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notification_reads")
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("notification", "user")

    def __str__(self):
        return f"{self.user_id} read {self.notification_id}"

class GlobalSetting(models.Model):
    name = models.CharField(max_length=100, default="Classora")
    groq_api_key = models.CharField(max_length=255, blank=True, null=True, help_text="Global Groq API Key for AI Assistant")
    support_email = models.EmailField(blank=True, default="")
    support_phone = models.CharField(max_length=20, blank=True, default="")
    allow_signup = models.BooleanField(default=True)
    maintenance_mode = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Global Setting"
        verbose_name_plural = "Global Settings"

    def __str__(self):
        return self.name

    @classmethod
    def load(cls):
        obj = cls.objects.first()
        if not obj:
            obj = cls.objects.create()
        return obj
