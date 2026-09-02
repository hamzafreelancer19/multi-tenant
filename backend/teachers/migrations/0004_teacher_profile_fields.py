from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("teachers", "0003_alter_teacher_school"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="teacher",
            options={"ordering": ["-id"]},
        ),
        migrations.AddField(
            model_name="teacher",
            name="address",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="teacher",
            name="city",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AddField(
            model_name="teacher",
            name="cnic",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AddField(
            model_name="teacher",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        migrations.AddField(
            model_name="teacher",
            name="date_of_birth",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="teacher",
            name="designation",
            field=models.CharField(blank=True, default="Subject Teacher", max_length=50),
        ),
        migrations.AddField(
            model_name="teacher",
            name="emergency_phone",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AddField(
            model_name="teacher",
            name="employee_id",
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.AddField(
            model_name="teacher",
            name="gender",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AddField(
            model_name="teacher",
            name="joining_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="teacher",
            name="notes",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="teacher",
            name="phone",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AddField(
            model_name="teacher",
            name="qualification",
            field=models.CharField(blank=True, default="", max_length=120),
        ),
        migrations.AddField(
            model_name="teacher",
            name="status",
            field=models.CharField(default="Active", max_length=20),
        ),
        migrations.AlterField(
            model_name="teacher",
            name="rating",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=3, null=True),
        ),
    ]
