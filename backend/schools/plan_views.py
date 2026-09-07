from datetime import date, timedelta

from django.db.models import Count
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from core.utils import is_superadmin
from .models import Plan, School
from .serializers import PlanSerializer, SchoolSerializer


def resolve_plan(plan_type=None, plan_id=None):
    plan = None
    if plan_id:
        plan = Plan.objects.filter(pk=plan_id, is_active=True).first()
    if not plan and plan_type:
        key = str(plan_type).strip()
        plan = Plan.objects.filter(code__iexact=key, is_active=True).first()
        if not plan:
            plan = (
                Plan.objects.filter(feature_tier__iexact=key, is_active=True)
                .order_by("sort_order", "price")
                .first()
            )
    return plan


class PlanViewSet(viewsets.ModelViewSet):
    serializer_class = PlanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Plan.objects.all().order_by("sort_order", "price", "name")
        user = getattr(self.request, "user", None)
        if getattr(user, "role", None) != "superadmin":
            qs = qs.filter(is_active=True)
        return qs

    def get_permissions(self):
        if self.action in ("list", "retrieve", "catalog"):
            return [AllowAny()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        if not is_superadmin(request):
            return Response({"error": "Unauthorized"}, status=403)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not is_superadmin(request):
            return Response({"error": "Unauthorized"}, status=403)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if not is_superadmin(request):
            return Response({"error": "Unauthorized"}, status=403)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not is_superadmin(request):
            return Response({"error": "Unauthorized"}, status=403)
        plan = self.get_object()
        if plan.schools.filter(plan_status__in=["Pending", "Active"]).exists():
            plan.is_active = False
            plan.save(update_fields=["is_active", "updated_at"])
            return Response(
                {"message": f"Plan '{plan.name}' deactivated (schools still reference it)."}
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def catalog(self, request):
        qs = Plan.objects.filter(is_active=True).order_by("sort_order", "price", "name")
        return Response(PlanSerializer(qs, many=True).data)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def overview(self, request):
        if not is_superadmin(request):
            return Response({"error": "Unauthorized"}, status=403)

        plans = list(self.get_queryset())
        pending = list(
            School.objects.filter(plan_status="Pending")
            .select_related("subscribed_plan")
            .order_by("-id")
        )
        active_by_tier = {
            row["plan_type"]: row["n"]
            for row in School.objects.filter(plan_status="Active")
            .values("plan_type")
            .annotate(n=Count("id"))
        }
        return Response(
            {
                "plans": PlanSerializer(plans, many=True).data,
                "pending": SchoolSerializer(
                    pending, many=True, context={"request": request}
                ).data,
                "stats": {
                    "catalog": len(plans),
                    "active_catalog": sum(1 for p in plans if p.is_active),
                    "pending_approvals": len(pending),
                    "active_subscriptions": School.objects.filter(plan_status="Active").count(),
                    "active_by_tier": active_by_tier,
                },
            }
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def assign(self, request, pk=None):
        """Superadmin: assign/activate this plan on a school immediately."""
        if not is_superadmin(request):
            return Response({"error": "Unauthorized"}, status=403)

        plan = self.get_object()
        school_id = request.data.get("school_id")
        if not school_id:
            return Response({"error": "school_id is required."}, status=400)

        school = School.objects.filter(pk=school_id).first()
        if not school:
            return Response({"error": "School not found."}, status=404)

        days = plan.duration_days or 30
        school.subscribed_plan = plan
        school.plan_type = plan.feature_tier
        school.plan_amount = plan.price
        school.plan_status = "Active"
        school.plan_start_date = date.today()
        school.plan_expiry_date = date.today() + timedelta(days=days)
        if request.data.get("transaction_id"):
            school.transaction_id = request.data.get("transaction_id")
        school.save()

        from core.models import ActivityLog

        ActivityLog.objects.create(
            school=None,
            name=request.user.username,
            action=f"assigned plan '{plan.name}' to school '{school.name}'",
            avatar="A",
        )
        return Response(
            {
                "message": f"Plan '{plan.name}' activated for {school.name}.",
                "school": SchoolSerializer(school, context={"request": request}).data,
            }
        )
