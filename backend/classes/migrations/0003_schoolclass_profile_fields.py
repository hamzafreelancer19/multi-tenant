from django.db import migrations, models
import django.db.models.deletion


def fill_blank_sections(apps, schema_editor):
    SchoolClass = apps.get_model("classes", "SchoolClass")
    SchoolClass.objects.filter(section__isnull=True).update(section="")
    SchoolClass.objects.filter(room_no__isnull=True).update(room_no="")


class Migration(migrations.Migration):

    dependencies = [
        ("teachers", "0004_teacher_profile_fields"),
        ("classes", "0002_alter_schoolclass_school"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="schoolclass",
            options={"ordering": ["name", "section"], "verbose_name_plural": "Classes"},
        ),
        migrations.RunPython(fill_blank_sections, migrations.RunPython.noop),
        migrations.AddField(
            model_name="schoolclass",
            name="academic_year",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AddField(
            model_name="schoolclass",
            name="capacity",
            field=models.PositiveIntegerField(default=40),
        ),
        migrations.AddField(
            model_name="schoolclass",
            name="class_teacher",
            field=models.ForeignKey(
                blank=True,
                db_constraint=False,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="homeroom_classes",
                to="teachers.teacher",
            ),
        ),
        migrations.AddField(
            model_name="schoolclass",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        migrations.AddField(
            model_name="schoolclass",
            name="notes",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="schoolclass",
            name="shift",
            field=models.CharField(default="Morning", max_length=20),
        ),
        migrations.AddField(
            model_name="schoolclass",
            name="status",
            field=models.CharField(default="Active", max_length=20),
        ),
        migrations.AlterField(
            model_name="schoolclass",
            name="name",
            field=models.CharField(max_length=80),
        ),
        migrations.AlterField(
            model_name="schoolclass",
            name="room_no",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AlterField(
            model_name="schoolclass",
            name="section",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
    ]
