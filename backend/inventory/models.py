from django.db import models
from schools.models import School

class InventoryItem(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, db_constraint=False)
    item_name = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    quantity = models.IntegerField(default=0)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.item_name

class StockLog(models.Model):
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE)
    change_type = models.CharField(max_length=10, choices=(('Add', 'Add'), ('Remove', 'Remove')))
    quantity = models.IntegerField()
    reason = models.CharField(max_length=255, blank=True, null=True)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.change_type} {self.quantity} for {self.item.item_name}"
