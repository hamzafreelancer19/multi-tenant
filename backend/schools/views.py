from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import School
from .serializers import SchoolSerializer

from rest_framework.decorators import action
from rest_framework.response import Response

class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.all().order_by('-created_at')
    serializer_class = SchoolSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only superadmin can manage schools globally
        if self.request.user.role == 'superadmin':
            return School.objects.all().order_by('-created_at')
        # Regular admins only see their own school
        if hasattr(self.request.user, 'school') and self.request.user.school:
            return School.objects.filter(id=self.request.user.school.id)
        return School.objects.none()

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if request.user.role != 'superadmin':
            return Response({"error": "Unauthorized"}, status=403)
        school = self.get_object()
        school.status = 'Approved'
        school.save()

        # Log Activity
        from core.models import ActivityLog
        ActivityLog.objects.create(
            school=None,
            name=request.user.username,
            action=f"approved school '{school.name}'",
            avatar="A"
        )
        return Response({"message": f"School {school.name} has been approved."})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        if request.user.role != 'superadmin':
            return Response({"error": "Unauthorized"}, status=403)
        school = self.get_object()
        school.status = 'Rejected'
        school.save()

        # Log Activity
        from core.models import ActivityLog
        ActivityLog.objects.create(
            school=None,
            name=request.user.username,
            action=f"rejected school '{school.name}'",
            avatar="R"
        )
        return Response({"message": f"School {school.name} has been rejected."})
