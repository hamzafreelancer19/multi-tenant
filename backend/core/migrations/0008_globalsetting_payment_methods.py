from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0007_globalsetting_platform_controls"),
    ]

    operations = [
        migrations.AddField(
            model_name="globalsetting",
            name="payment_methods",
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text="Platform payment details shown to schools when buying a plan",
            ),
        ),
    ]
