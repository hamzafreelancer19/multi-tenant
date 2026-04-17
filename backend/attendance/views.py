from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Attendance
from .serializers import AttendanceSerializer
from core.models import ActivityLog

class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'school') and user.school:
            qs = Attendance.objects.filter(school=user.school).select_related('student')
            date = self.request.query_params.get('date')
            if date:
                qs = qs.filter(date=date)
            return qs.order_by('-date')
        return Attendance.objects.none()

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)

    @action(detail=False, methods=['post'], url_path='bulk')
    def bulk_create(self, request):
        records = request.data.get('records', [])
        if not records:
            return Response({'error': 'No records provided.'}, status=status.HTTP_400_BAD_REQUEST)

        school = request.user.school
        created_count = 0
        updated_count = 0

        for record in records:
            student_id = record.get('student_id')
            rec_status = record.get('status', 'Present')
            date = record.get('date')

            if not student_id or not date:
                continue

            obj, created = Attendance.objects.update_or_create(
                school=school,
                student_id=student_id,
                date=date,
                defaults={'status': rec_status}
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        ActivityLog.objects.create(
            school=school,
            name=request.user.username.capitalize() if request.user.username else 'Admin',
            action=f"marked attendance for {len(records)} students",
            avatar=request.user.username[0].upper() if request.user.username else "A"
        )

        return Response({
            'message': f'Saved {created_count} new and updated {updated_count} existing attendance records.',
            'created': created_count,
            'updated': updated_count,
        }, status=status.HTTP_200_OK)
