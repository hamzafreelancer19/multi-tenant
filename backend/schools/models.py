from django.db import models

class School(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ]

    PLAN_CHOICES = [
        ('None', 'None'),
        ('Basic', 'Basic'),
        ('Business', 'Business'),
        ('Pro', 'Pro'),
    ]

    PLAN_STATUS_CHOICES = [
        ('Inactive', 'Inactive'),
        ('Pending', 'Pending'),
        ('Active', 'Active'),
    ]

    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True, blank=True)
    domain = models.CharField(max_length=255, unique=True, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    # Subscription Fields
    plan_type = models.CharField(max_length=20, choices=PLAN_CHOICES, default='None')
    plan_status = models.CharField(max_length=20, choices=PLAN_STATUS_CHOICES, default='Inactive')
    plan_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    transaction_id = models.CharField(max_length=255, blank=True, null=True)
    plan_start_date = models.DateField(blank=True, null=True)
    plan_expiry_date = models.DateField(blank=True, null=True)

    # Landing Page Customization
    landing_hero_title = models.CharField(max_length=255, blank=True, null=True)
    landing_hero_subtitle = models.TextField(blank=True, null=True)
    landing_about_text = models.TextField(blank=True, null=True)
    landing_primary_color = models.CharField(max_length=20, default="#3b82f6") # Default blue-500
    landing_contact_email = models.EmailField(blank=True, null=True)
    landing_contact_phone = models.CharField(max_length=20, blank=True, null=True)
    landing_show_stats = models.BooleanField(default=True)
    landing_hero_image_url = models.TextField(blank=True, null=True)
    landing_center_image_url = models.TextField(blank=True, null=True)
    landing_features = models.JSONField(default=list, blank=True)
    landing_testimonials = models.JSONField(default=list, blank=True)
    landing_programs = models.JSONField(default=list, blank=True)
    landing_languages = models.JSONField(default=list, blank=True)

    def save(self, *args, **kwargs):
        if not self.code:
            import uuid
            self.code = str(uuid.uuid4())[:8].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.status})"

class Enrollment(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Accepted', 'Accepted'),
        ('Rejected', 'Rejected'),
    ]

    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='enrollments')
    student_name = models.CharField(max_length=255)
    student_age = models.PositiveIntegerField()
    father_name = models.CharField(max_length=255)
    father_phone = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student_name} - {self.school.name} ({self.status})"
