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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    # Subscription Fields
    plan_type = models.CharField(max_length=20, choices=PLAN_CHOICES, default='None')
    plan_status = models.CharField(max_length=20, choices=PLAN_STATUS_CHOICES, default='Inactive')
    plan_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    transaction_id = models.CharField(max_length=255, blank=True, null=True)
    plan_start_date = models.DateField(blank=True, null=True)
    plan_expiry_date = models.DateField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.code:
            import uuid
            self.code = str(uuid.uuid4())[:8].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.status})"
