from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('schools', '0018_enrollment_application_details'),
    ]

    operations = [
        migrations.AddField(
            model_name='school',
            name='landing_copy',
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
