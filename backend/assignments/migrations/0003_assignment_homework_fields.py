from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("assignments", "0002_alter_assignment_school"),
        ("teachers", "0004_teacher_profile_fields"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="assignment",
            options={"ordering": ["due_date", "-id"]},
        ),
        migrations.AddField(
            model_name="assignment",
            name="assignment_type",
            field=models.CharField(choices=[("Homework", "Homework"), ("Project", "Project"), ("Worksheet", "Worksheet"), ("Quiz", "Quiz"), ("Practical", "Practical"), ("Reading", "Reading")], default="Homework", max_length=20),
        ),
        migrations.AddField(
            model_name="assignment",
            name="attachment_url",
            field=models.CharField(blank=True, default="", max_length=500),
        ),
        migrations.AddField(
            model_name="assignment",
            name="due_time",
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="assignment",
            name="notes",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="assignment",
            name="posted_by",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AddField(
            model_name="assignment",
            name="status",
            field=models.CharField(choices=[("Assigned", "Assigned"), ("Draft", "Draft"), ("Closed", "Closed")], default="Assigned", max_length=20),
        ),
        migrations.AddField(
            model_name="assignment",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterField(
            model_name="assignment",
            name="class_name",
            field=models.CharField(max_length=80),
        ),
        migrations.AlterField(
            model_name="assignment",
            name="description",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AlterField(
            model_name="assignment",
            name="max_marks",
            field=models.PositiveIntegerField(default=100),
        ),
        migrations.AlterField(
            model_name="assignment",
            name="teacher",
            field=models.ForeignKey(blank=True, db_constraint=False, null=True, on_delete=django.db.models.deletion.SET_NULL, to="teachers.teacher"),
        ),
    ]
