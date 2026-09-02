from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("classes", "0003_schoolclass_profile_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="schoolclass",
            name="shift",
            field=models.CharField(
                choices=[
                    ("Morning", "Morning"),
                    ("Afternoon", "Afternoon"),
                    ("Evening", "Evening"),
                ],
                default="Morning",
                max_length=20,
            ),
        ),
    ]
