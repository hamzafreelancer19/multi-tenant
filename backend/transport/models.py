from django.db import models
from schools.models import School

class Vehicle(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, db_constraint=False)
    vehicle_no = models.CharField(max_length=50)
    vehicle_model = models.CharField(max_length=100)
    driver_name = models.CharField(max_length=100)
    driver_phone = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=(('Active', 'Active'), ('Maintenance', 'Maintenance')), default='Active')

    def __str__(self):
        return f"{self.vehicle_no} ({self.driver_name})"

class Route(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, db_constraint=False)
    route_name = models.CharField(max_length=200)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.SET_NULL, null=True)
    route_fare = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.route_name
