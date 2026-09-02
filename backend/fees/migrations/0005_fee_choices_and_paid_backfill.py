from django.db import migrations, models
from django.db.models import F


def backfill_paid(apps, schema_editor):
    Fee = apps.get_model("fees", "Fee")
    Fee.objects.filter(status="Paid", paid_amount=0).update(paid_amount=F("amount"))


class Migration(migrations.Migration):

    dependencies = [
        ("fees", "0004_fee_ledger_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="fee",
            name="fee_type",
            field=models.CharField(
                choices=[
                    ("Tuition", "Tuition"),
                    ("Transport", "Transport"),
                    ("Admission", "Admission"),
                    ("Exam", "Exam"),
                    ("Lab", "Lab"),
                    ("Other", "Other"),
                ],
                default="Tuition",
                max_length=30,
            ),
        ),
        migrations.AlterField(
            model_name="fee",
            name="payment_method",
            field=models.CharField(
                blank=True,
                choices=[
                    ("Cash", "Cash"),
                    ("Bank", "Bank transfer"),
                    ("JazzCash", "JazzCash"),
                    ("EasyPaisa", "EasyPaisa"),
                    ("Cheque", "Cheque"),
                ],
                default="",
                max_length=20,
            ),
        ),
        migrations.RunPython(backfill_paid, migrations.RunPython.noop),
    ]
