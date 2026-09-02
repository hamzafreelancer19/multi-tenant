from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("transport", "0002_alter_route_school_alter_vehicle_school"),
        ("students", "0005_student_profile_fields"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="vehicle",
            options={"ordering": ["vehicle_no"]},
        ),
        migrations.AlterModelOptions(
            name="route",
            options={"ordering": ["route_name"]},
        ),
        migrations.AddField(
            model_name="vehicle",
            name="capacity",
            field=models.PositiveIntegerField(default=15),
        ),
        migrations.AddField(
            model_name="vehicle",
            name="conductor_name",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AddField(
            model_name="vehicle",
            name="conductor_phone",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AddField(
            model_name="vehicle",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        migrations.AddField(
            model_name="vehicle",
            name="notes",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="vehicle",
            name="vehicle_type",
            field=models.CharField(choices=[("Bus", "Bus"), ("Coaster", "Coaster"), ("Van", "Van"), ("Mini Bus", "Mini Bus")], default="Van", max_length=20),
        ),
        migrations.AlterField(
            model_name="vehicle",
            name="driver_phone",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AlterField(
            model_name="vehicle",
            name="status",
            field=models.CharField(choices=[("Active", "Active"), ("Maintenance", "Maintenance"), ("Inactive", "Inactive")], default="Active", max_length=20),
        ),
        migrations.AlterField(
            model_name="vehicle",
            name="vehicle_model",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AddField(
            model_name="route",
            name="end_point",
            field=models.CharField(blank=True, default="", max_length=120),
        ),
        migrations.AddField(
            model_name="route",
            name="evening_time",
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="route",
            name="morning_time",
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="route",
            name="notes",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="route",
            name="start_point",
            field=models.CharField(blank=True, default="", max_length=120),
        ),
        migrations.AddField(
            model_name="route",
            name="status",
            field=models.CharField(choices=[("Active", "Active"), ("Inactive", "Inactive")], default="Active", max_length=20),
        ),
        migrations.AddField(
            model_name="route",
            name="stops",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AlterField(
            model_name="route",
            name="route_fare",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AlterField(
            model_name="route",
            name="vehicle",
            field=models.ForeignKey(blank=True, db_constraint=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="routes", to="transport.vehicle"),
        ),
        migrations.CreateModel(
            name="RouteRider",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("stop_name", models.CharField(blank=True, default="", max_length=120)),
                ("notes", models.CharField(blank=True, default="", max_length=255)),
                ("route", models.ForeignKey(db_constraint=False, on_delete=django.db.models.deletion.CASCADE, related_name="riders", to="transport.route")),
                ("school", models.ForeignKey(db_constraint=False, on_delete=django.db.models.deletion.CASCADE, to="schools.school")),
                ("student", models.ForeignKey(db_constraint=False, on_delete=django.db.models.deletion.CASCADE, to="students.student")),
            ],
            options={
                "ordering": ["stop_name", "id"],
                "unique_together": {("school", "student")},
            },
        ),
    ]
