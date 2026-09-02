from datetime import date

from django.db.models import Q
from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notice
from .serializers import NoticeSerializer, PublicNoticeSerializer
from core.utils import get_current_school, school_queryset
from core.mixins import SchoolOpsMixin
from core.models import ActivityLog
from core.services import TenantResolver
from teachers.scoping import ensure_teacher_can_access_class, is_teacher_request, teacher_labels_for_request

PUBLIC_AUDIENCES = ("All", "Parents", "Class", "Students")


class NoticeViewSet(SchoolOpsMixin, viewsets.ModelViewSet):
    serializer_class = NoticeSerializer

    def get_queryset(self):
        qs = school_queryset(self.request, Notice).order_by("-is_pinned", "-created_at")
        role = getattr(getattr(self.request, "user", None), "role", None)
        if role == "student":
            qs = qs.filter(is_active=True)
        elif is_teacher_request(self.request):
            labels = teacher_labels_for_request(self.request) or set()
            qs = qs.filter(
                Q(audience__in=["All", "Teachers"]) |
                Q(class_name__in=labels)
            )
        return qs

    def perform_create(self, serializer):
        school = get_current_school(self.request)
        class_name = serializer.validated_data.get("class_name")
        if class_name:
            ensure_teacher_can_access_class(self.request, class_name)
        notice = serializer.save(
            school=school,
            posted_by=getattr(self.request.user, "username", "") or "",
        )
        ActivityLog.objects.create(
            school=school,
            name=notice.posted_by or "Admin",
            action=f"posted notice: {notice.title}",
            avatar="N",
        )

    def perform_update(self, serializer):
        serializer.save()


class PublicNoticeListView(APIView):
    """Published notices for the school website. No login required."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        ident = request.query_params.get("domain") or request.query_params.get("slug")
        school = TenantResolver.resolve_from_identifier(ident) if ident else None
        if not school:
            school = TenantResolver.resolve_from_host(request)
        if not school or not TenantResolver.validate_school(school, "public-notices"):
            return Response([])

        today = date.today()
        qs = (
            Notice.objects.filter(school=school, is_active=True, audience__in=PUBLIC_AUDIENCES)
            .filter(Q(expires_at__isnull=True) | Q(expires_at__gte=today))
            .order_by("-is_pinned", "-created_at")[:24]
        )
        return Response(PublicNoticeSerializer(qs, many=True).data)
