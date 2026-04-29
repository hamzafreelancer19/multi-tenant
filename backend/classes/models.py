from django.db import models
from schools.models import School

class SchoolClass(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    name = models.CharField(max_length=50) # e.g. Grade 10
    section = models.CharField(max_length=20, blank=True, null=True) # e.g. Alpha
    room_no = models.CharField(max_length=20, blank=True, null=True)
    
    class Meta:
        verbose_name_plural = "Classes"
        unique_together = ('school', 'name', 'section')

    def __str__(self):
        return f"{self.name} - {self.section}" if self.section else self.name
