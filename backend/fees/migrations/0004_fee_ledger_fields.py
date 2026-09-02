from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("fees", "0003_alter_fee_school"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="fee",
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddField(
            model_name="fee",
            name="fee_type",
            field=models.CharField(default="Tuition", max_length=30),
        ),
        migrations.AddField(
            model_name="fee",
            name="late_fine",
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name="fee",
            name="month",
            field=models.CharField(blank=True, default="", max_length=7),
        ),
        migrations.AddField(
            model_name="fee",
            name="paid_amount",
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name="fee",
            name="payment_method",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AddField(
            model_name="fee",
            name="receipt_no",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AlterField(
            model_name="fee",
            name="remarks",
            field=models.TextField(blank=True, default=""),
        ),
    ]
