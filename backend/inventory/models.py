from django.db import models
from schools.models import School


class InventoryItem(models.Model):
    UNIT_CHOICES = [
        ("pcs", "Pieces"),
        ("set", "Set"),
        ("box", "Box"),
        ("pack", "Pack"),
        ("pair", "Pair"),
        ("kg", "Kilogram"),
        ("ltr", "Litre"),
        ("mtr", "Meter"),
    ]

    school = models.ForeignKey(School, on_delete=models.CASCADE, db_constraint=False)
    item_name = models.CharField(max_length=200)
    sku = models.CharField(max_length=20, blank=True, default="")
    category = models.CharField(max_length=100)
    quantity = models.IntegerField(default=0)
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES, default="pcs")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    min_stock = models.PositiveIntegerField(default=5)
    location = models.CharField(max_length=120, blank=True, default="")
    supplier = models.CharField(max_length=150, blank=True, default="")
    notes = models.TextField(blank=True, default="")
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["item_name"]

    def __str__(self):
        return self.item_name

    @property
    def low_stock(self):
        return self.quantity <= (self.min_stock or 0)


class StockLog(models.Model):
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, db_constraint=False, related_name="logs")
    change_type = models.CharField(max_length=10, choices=(("Add", "Add"), ("Remove", "Remove")))
    quantity = models.IntegerField()
    reason = models.CharField(max_length=255, blank=True, default="")
    recorded_by = models.CharField(max_length=100, blank=True, default="")
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-id"]

    def __str__(self):
        return f"{self.change_type} {self.quantity} for {self.item.item_name}"
