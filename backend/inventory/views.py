from django.db import transaction
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError

from .models import InventoryItem, StockLog
from .serializers import InventoryItemSerializer, StockLogSerializer
from core.utils import get_current_school, school_queryset
from core.mixins import SchoolOpsMixin
from core.models import ActivityLog


def next_sku(school):
    prefix = "INV-"
    codes = InventoryItem.objects.filter(school=school, sku__startswith=prefix).values_list("sku", flat=True)
    nums = []
    for code in codes:
        try:
            nums.append(int(str(code).replace(prefix, "", 1)))
        except (TypeError, ValueError):
            continue
    n = (max(nums) if nums else 0) + 1
    while InventoryItem.objects.filter(school=school, sku=f"{prefix}{n:04d}").exists():
        n += 1
    return f"{prefix}{n:04d}"


class InventoryItemViewSet(SchoolOpsMixin, viewsets.ModelViewSet):
    serializer_class = InventoryItemSerializer

    def get_queryset(self):
        qs = school_queryset(self.request, InventoryItem).order_by("item_name")
        category = self.request.query_params.get("category")
        if category and category != "All":
            qs = qs.filter(category=category)
        return qs

    def perform_create(self, serializer):
        school = get_current_school(self.request)
        qty = serializer.validated_data.get("quantity") or 0
        item = serializer.save(school=school, sku=next_sku(school), quantity=max(0, qty))
        if qty > 0:
            StockLog.objects.create(
                item=item,
                change_type="Add",
                quantity=qty,
                reason="Opening stock",
                recorded_by=getattr(self.request.user, "username", "") or "",
            )
        ActivityLog.objects.create(
            school=school,
            name=getattr(self.request.user, "username", "Admin"),
            action=f"added inventory item {item.item_name}",
            avatar="I",
        )

    def perform_update(self, serializer):
        item = serializer.save()
        school = get_current_school(self.request)
        ActivityLog.objects.create(
            school=school,
            name=getattr(self.request.user, "username", "Admin"),
            action=f"updated inventory item {item.item_name}",
            avatar="I",
        )

    def perform_destroy(self, instance):
        school = get_current_school(self.request)
        name = instance.item_name
        super().perform_destroy(instance)
        ActivityLog.objects.create(
            school=school,
            name=getattr(self.request.user, "username", "Admin"),
            action=f"deleted inventory item {name}",
            avatar="I",
        )


class StockLogViewSet(SchoolOpsMixin, viewsets.ModelViewSet):
    serializer_class = StockLogSerializer

    def get_queryset(self):
        qs = school_queryset(self.request, StockLog, lookup="item__school").select_related("item").order_by("-date", "-id")
        item_id = self.request.query_params.get("item")
        if item_id:
            qs = qs.filter(item_id=item_id)
        return qs

    def perform_create(self, serializer):
        school = get_current_school(self.request)
        item = serializer.validated_data["item"]
        if item.school_id != school.id:
            raise ValidationError("Item does not belong to this school.")
        qty = int(serializer.validated_data["quantity"])
        change = serializer.validated_data["change_type"]
        with transaction.atomic():
            locked = InventoryItem.objects.select_for_update().get(pk=item.pk)
            if change == "Remove" and locked.quantity < qty:
                raise ValidationError(f"Only {locked.quantity} {locked.unit} in stock for {locked.item_name}.")
            if change == "Add":
                locked.quantity += qty
            else:
                locked.quantity -= qty
            locked.save(update_fields=["quantity", "last_updated"])
            serializer.save(recorded_by=getattr(self.request.user, "username", "") or "")
        ActivityLog.objects.create(
            school=school,
            name=getattr(self.request.user, "username", "Admin"),
            action=f"{'restocked' if change == 'Add' else 'issued'} {qty} {item.item_name}",
            avatar="I",
        )
