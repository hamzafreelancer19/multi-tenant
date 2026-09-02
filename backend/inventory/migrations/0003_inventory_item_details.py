from django.db import migrations, models
import django.db.models.deletion


def backfill_skus(apps, schema_editor):
    InventoryItem = apps.get_model("inventory", "InventoryItem")
    by_school = {}
    for item in InventoryItem.objects.order_by("id"):
        if item.sku:
            continue
        n = by_school.get(item.school_id, 0) + 1
        sku = f"INV-{n:04d}"
        while InventoryItem.objects.filter(school_id=item.school_id, sku=sku).exists():
            n += 1
            sku = f"INV-{n:04d}"
        item.sku = sku
        item.save(update_fields=["sku"])
        by_school[item.school_id] = n


class Migration(migrations.Migration):

    dependencies = [
        ("inventory", "0002_alter_inventoryitem_school"),
    ]

    operations = [
        migrations.AddField(
            model_name="inventoryitem",
            name="sku",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AddField(
            model_name="inventoryitem",
            name="unit",
            field=models.CharField(
                choices=[
                    ("pcs", "Pieces"),
                    ("set", "Set"),
                    ("box", "Box"),
                    ("pack", "Pack"),
                    ("pair", "Pair"),
                    ("kg", "Kilogram"),
                    ("ltr", "Litre"),
                    ("mtr", "Meter"),
                ],
                default="pcs",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="inventoryitem",
            name="min_stock",
            field=models.PositiveIntegerField(default=5),
        ),
        migrations.AddField(
            model_name="inventoryitem",
            name="location",
            field=models.CharField(blank=True, default="", max_length=120),
        ),
        migrations.AddField(
            model_name="inventoryitem",
            name="supplier",
            field=models.CharField(blank=True, default="", max_length=150),
        ),
        migrations.AddField(
            model_name="inventoryitem",
            name="notes",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AlterField(
            model_name="inventoryitem",
            name="unit_price",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name="stocklog",
            name="recorded_by",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AlterField(
            model_name="stocklog",
            name="reason",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AlterField(
            model_name="stocklog",
            name="item",
            field=models.ForeignKey(
                db_constraint=False,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="logs",
                to="inventory.inventoryitem",
            ),
        ),
        migrations.AlterModelOptions(
            name="inventoryitem",
            options={"ordering": ["item_name"]},
        ),
        migrations.AlterModelOptions(
            name="stocklog",
            options={"ordering": ["-date", "-id"]},
        ),
        migrations.RunPython(backfill_skus, migrations.RunPython.noop),
    ]
