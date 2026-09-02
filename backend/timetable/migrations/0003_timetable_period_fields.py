from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("teachers", "0004_teacher_profile_fields"),
        ("timetable", "0002_alter_timetable_school"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="timetable",
            options={"ordering": ["day", "start_time"]},
        ),
        migrations.AddField(
            model_name="timetable",
            name="notes",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="timetable",
            name="period_type",
            field=models.CharField(default="Lecture", max_length=20),
        ),
        migrations.AlterField(
            model_name="timetable",
            name="class_name",
            field=models.CharField(max_length=80),
        ),
        migrations.AlterField(
            model_name="timetable",
            name="room_no",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AlterField(
            model_name="timetable",
            name="teacher",
            field=models.ForeignKey(
                blank=True,
                db_constraint=False,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="teachers.teacher",
            ),
        ),
    ]
