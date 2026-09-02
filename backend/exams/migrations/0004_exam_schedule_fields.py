from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("exams", "0003_alter_exam_school_alter_subject_school"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="exam",
            options={"ordering": ["-start_date", "-id"]},
        ),
        migrations.AddField(
            model_name="exam",
            name="subject",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AddField(
            model_name="exam",
            name="total_marks",
            field=models.PositiveIntegerField(default=100),
        ),
        migrations.AddField(
            model_name="exam",
            name="venue",
            field=models.CharField(blank=True, default="", max_length=80),
        ),
        migrations.AlterField(
            model_name="exam",
            name="class_name",
            field=models.CharField(blank=True, default="", max_length=80),
        ),
        migrations.AlterField(
            model_name="exam",
            name="description",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AlterField(
            model_name="exam",
            name="exam_type",
            field=models.CharField(
                choices=[
                    ("Midterm", "Midterm"),
                    ("Final", "Final"),
                    ("Monthly", "Monthly Test"),
                    ("Quiz", "Quiz"),
                    ("Other", "Other"),
                ],
                default="Monthly",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="examresult",
            name="grade",
            field=models.CharField(blank=True, default="", max_length=10),
        ),
        migrations.AlterField(
            model_name="examresult",
            name="remarks",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AlterField(
            model_name="examresult",
            name="marks_obtained",
            field=models.DecimalField(decimal_places=2, max_digits=6),
        ),
        migrations.AlterField(
            model_name="examresult",
            name="total_marks",
            field=models.DecimalField(decimal_places=2, default=100.0, max_digits=6),
        ),
        migrations.AlterField(
            model_name="subject",
            name="code",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
    ]
