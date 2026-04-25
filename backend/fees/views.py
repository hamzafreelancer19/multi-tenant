from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from .models import Fee
from .serializers import FeeSerializer
from core.models import ActivityLog

from core.utils import get_current_school

class FeeViewSet(viewsets.ModelViewSet):
    serializer_class = FeeSerializer

    def get_queryset(self):
        school = get_current_school(self.request)
        if school:
            qs = Fee.objects.filter(school=school).select_related('student')
            # Optional filter by status
            status = self.request.query_params.get('status')
            if status and status != 'All':
                qs = qs.filter(status=status)
            return qs.order_by('-created_at')
        return Fee.objects.none()

    def perform_create(self, serializer):
        school = get_current_school(self.request)
        fee = serializer.save(school=school)
        ActivityLog.objects.create(
            school=school,
            name=fee.student.name,
            action=f"fee recorded: RS. {fee.amount}",
            avatar=fee.student.name[0].upper() if fee.student.name else "S"
        )

    @action(detail=False, methods=['get'])
    def stats(self, request):
        school = get_current_school(self.request)
        if school:
            fees = Fee.objects.filter(school=school)
            collected = fees.filter(status='Paid').aggregate(Sum('amount'))['amount__sum'] or 0
            pending = fees.filter(status='Pending').aggregate(Sum('amount'))['amount__sum'] or 0
            overdue_count = fees.filter(status='Overdue').count()

            return Response({
                "collected": collected,
                "pending": pending,
                "overdue_count": overdue_count
            })
        return Response({"error": "No school found"}, status=400)
