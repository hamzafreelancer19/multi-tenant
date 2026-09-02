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
    landing_contact_email = models.EmailField(blank=True, null=True)
    landing_contact_phone = models.CharField(max_length=20, blank=True, null=True)
    landing_show_stats = models.BooleanField(default=True)
    landing_hero_image_url = models.TextField(blank=True, null=True)
    landing_center_image_url = models.TextField(blank=True, null=True)
    landing_features = models.JSONField(default=list, blank=True)
    landing_testimonials = models.JSONField(default=list, blank=True)
    landing_programs = models.JSONField(default=list, blank=True)
    landing_languages = models.JSONField(default=list, blank=True)
    landing_copy = models.JSONField(default=dict, blank=True)
    
    # Global Branding
    logo = models.ImageField(upload_to='school_logos/', blank=True, null=True)
    favicon = models.ImageField(upload_to='school_favicons/', blank=True, null=True)
    
    # Landing Page Colors
    landing_primary_color = models.CharField(max_length=20, default="#e8b86d", help_text="Accent/gold color for landing page")
    landing_secondary_color = models.CharField(max_length=20, default="#08131c", help_text="Deep ink color for landing page")
    
    # Dashboard Colors
    dashboard_primary_color = models.CharField(max_length=20, default="#F15A24", help_text="Primary color for admin dashboard")
    dashboard_secondary_color = models.CharField(max_length=20, default="#0F172A", help_text="Sidebar/Background color for dashboard")
    dashboard_accent_color = models.CharField(max_length=20, default="#FF8C42", help_text="Accent color for buttons/highlights")

    database_name = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="Name of the dedicated database for this school"
    )
    ai_api_key = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Groq API Key for this school's AI Assistant"
    )

    def save(self, *args, **kwargs):
        if not self.code:
            import uuid
            self.code = str(uuid.uuid4())[:8].upper()

        if self.domain:
            host = str(self.domain).strip().lower()
            host = host.replace("https://", "").replace("http://", "")
            host = host.split("/")[0].split(":")[0]
            if host.startswith("www."):
                host = host[4:]
            self.domain = host or None

        if not self.domain and self.name:
            from django.utils.text import slugify
            base = slugify(self.name) or self.code.lower()
            candidate = f"{base}.localhost"
            clash = School.objects.filter(domain__iexact=candidate)
            if self.pk:
                clash = clash.exclude(pk=self.pk)
            if clash.exists():
                candidate = f"{base}-{self.code.lower()}.localhost"
            self.domain = candidate

        if not self.database_name:
            # Generate database name from code: lowercase + _db
            import re
            # Sanitize code to ensure it's a valid DB name (though UUID/Upper is usually fine)
            safe_code = re.sub(r'[^a-zA-Z0-9]', '_', self.code.lower())
            self.database_name = f"{safe_code}_db"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.status})"

class Enrollment(models.Model):
    STATUS_CHOICES = [
        ("Pending", "Pending class review"),
        ("PendingIncharge", "Pending class test"),
        ("PendingAdmin", "Pending admin approval"),
        ("Accepted", "Accepted"),
        ("Rejected", "Rejected"),
    ]
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]

    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='enrollments')
    student_name = models.CharField(max_length=255)
    student_age = models.PositiveIntegerField()
    gender = models.CharField(max_length=20, blank=True, default='')
    date_of_birth = models.DateField(blank=True, null=True)
    class_applying = models.CharField(max_length=80, blank=True, default='')
    previous_school = models.CharField(max_length=255, blank=True, default='')
    bform_cnic = models.CharField(max_length=20, blank=True, default='')
    address = models.TextField(blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    father_name = models.CharField(max_length=255)
    father_phone = models.CharField(max_length=20)
    father_cnic = models.CharField(max_length=20, blank=True, default='')
    father_occupation = models.CharField(max_length=120, blank=True, default='')
    mother_name = models.CharField(max_length=255, blank=True, default='')
    mother_phone = models.CharField(max_length=20, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    emergency_phone = models.CharField(max_length=20, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    school_class = models.ForeignKey(
        "classes.SchoolClass",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="enrollments",
        db_constraint=False,
    )
    assigned_incharge = models.ForeignKey(
        "teachers.Teacher",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="admission_reviews",
        db_constraint=False,
    )
    test_score = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    test_total = models.PositiveIntegerField(default=100)
    test_notes = models.TextField(blank=True, default="")
    test_date = models.DateField(blank=True, null=True)
    incharge_submitted_at = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PendingIncharge')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student_name} - {self.school.name} ({self.status})"
