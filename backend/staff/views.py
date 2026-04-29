from rest_framework import viewsets
from .models import Staff, Payroll
from .serializers import StaffSerializer, PayrollSerializer
from core.utils import get_current_school

class StaffViewSet(viewsets.ModelViewSet):
    serializer_class = StaffSerializer
    def get_queryset(self):
        school = get_current_school(self.request)
        if school: return Staff.objects.filter(school=school)
        return Staff.objects.none()
    def perform_create(self, serializer):
        serializer.save(school=get_current_school(self.request))

class PayrollViewSet(viewsets.ModelViewSet):
    serializer_class = PayrollSerializer
    def get_queryset(self):
        school = get_current_school(self.request)
        if school: return Payroll.objects.filter(staff__school=school)
        return Payroll.objects.none()
