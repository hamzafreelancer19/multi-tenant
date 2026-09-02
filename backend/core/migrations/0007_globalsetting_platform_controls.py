from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0006_notification_read_receipts"),
    ]

    operations = [
        migrations.AlterField(
            model_name="globalsetting",
            name="name",
            field=models.CharField(default="Classora", max_length=100),
        ),
        migrations.AddField(
            model_name="globalsetting",
            name="support_email",
            field=models.EmailField(blank=True, default="", max_length=254),
        ),
        migrations.AddField(
            model_name="globalsetting",
            name="support_phone",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AddField(
            model_name="globalsetting",
            name="allow_signup",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="globalsetting",
            name="maintenance_mode",
            field=models.BooleanField(default=False),
        ),
    ]
