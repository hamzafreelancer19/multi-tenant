from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("attendance", "0004_attendance_register_fields"),
        ("teachers", "0005_teacher_login_user"),
        ("schools", "0020_enrollment_incharge_test"),
    ]

    operations = [
        migrations.CreateModel(
            name="TeacherAttendance",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("date", models.DateField()),
                (
                    "status",
                    models.CharField(
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
                ("remarks", models.CharField(blank=True, default="", max_length=255)),
                ("marked_by", models.CharField(blank=True, default="", max_length=100)),
                ("updated_at", models.DateTimeField(auto_now=True, null=True)),
                (
                    "school",
                    models.ForeignKey(
                        db_constraint=False,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="schools.school",
                    ),
                ),
                (
                    "teacher",
                    models.ForeignKey(
                        db_constraint=False,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="attendance_records",
                        to="teachers.teacher",
                    ),
                ),
            ],
            options={
                "ordering": ["-date", "teacher_id"],
                "unique_together": {("school", "teacher", "date")},
            },
        ),
    ]
