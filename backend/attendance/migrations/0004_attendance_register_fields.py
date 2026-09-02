from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("attendance", "0003_alter_attendance_school"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="attendance",
            options={"ordering": ["-date", "student_id"]},
        ),
        migrations.AddField(
            model_name="attendance",
            name="marked_by",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AddField(
            model_name="attendance",
            name="remarks",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="attendance",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, null=True),
        ),
        migrations.AlterField(
            model_name="attendance",
            name="status",
            field=models.CharField(
                choices=[
                    ("Present", "Present"),
                    ("Absent", "Absent"),
                    ("Late", "Late"),
                    ("Leave", "Leave"),
                ],
                default="Present",
                max_length=20,
            ),
        ),
    ]
