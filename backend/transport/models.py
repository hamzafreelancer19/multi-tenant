from django.db import models
from schools.models import School
from students.models import Student


class Vehicle(models.Model):
    TYPES = (
        ("Bus", "Bus"),
        ("Coaster", "Coaster"),
        ("Van", "Van"),
        ("Mini Bus", "Mini Bus"),
    )
    STATUSES = (
        ("Active", "Active"),
        ("Maintenance", "Maintenance"),
        ("Inactive", "Inactive"),
    )

    school = models.ForeignKey(School, on_delete=models.CASCADE, db_constraint=False)
    vehicle_no = models.CharField(max_length=50)
    vehicle_model = models.CharField(max_length=100, blank=True, default="")
    vehicle_type = models.CharField(max_length=20, choices=TYPES, default="Van")
    capacity = models.PositiveIntegerField(default=15)
    driver_name = models.CharField(max_length=100)
    driver_phone = models.CharField(max_length=20, blank=True, default="")
    conductor_name = models.CharField(max_length=100, blank=True, default="")
    conductor_phone = models.CharField(max_length=20, blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUSES, default="Active")
    notes = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        ordering = ["vehicle_no"]

    def __str__(self):
        return f"{self.vehicle_no} ({self.driver_name})"


class Route(models.Model):
    STATUSES = (
        ("Active", "Active"),
        ("Inactive", "Inactive"),
    )

    school = models.ForeignKey(School, on_delete=models.CASCADE, db_constraint=False)
    route_name = models.CharField(max_length=200)
    vehicle = models.ForeignKey(
        Vehicle, on_delete=models.SET_NULL, null=True, blank=True, db_constraint=False, related_name="routes"
    )
    start_point = models.CharField(max_length=120, blank=True, default="")
    end_point = models.CharField(max_length=120, blank=True, default="")
    stops = models.TextField(blank=True, default="")
    morning_time = models.TimeField(blank=True, null=True)
    evening_time = models.TimeField(blank=True, null=True)
    route_fare = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUSES, default="Active")
    notes = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        ordering = ["route_name"]

    def __str__(self):
        return self.route_name


class RouteRider(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, db_constraint=False)
    route = models.ForeignKey(Route, on_delete=models.CASCADE, db_constraint=False, related_name="riders")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, db_constraint=False)
    stop_name = models.CharField(max_length=120, blank=True, default="")
    notes = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        ordering = ["stop_name", "id"]
        unique_together = ("school", "student")

    def __str__(self):
        return f"{self.student.name} on {self.route.route_name}"
