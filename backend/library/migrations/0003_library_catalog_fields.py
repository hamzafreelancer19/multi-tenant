from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("library", "0002_alter_book_school_alter_issuereturn_school"),
        ("students", "0005_student_profile_fields"),
    ]

    operations = [
        migrations.RunPython(
            lambda apps, schema: (
                apps.get_model("library", "Book").objects.filter(category__isnull=True).update(category="Textbook"),
                apps.get_model("library", "Book").objects.filter(isbn__isnull=True).update(isbn=""),
            ),
            migrations.RunPython.noop,
        ),
        migrations.AlterModelOptions(
            name="book",
            options={"ordering": ["title"]},
        ),
        migrations.AlterModelOptions(
            name="issuereturn",
            options={"ordering": ["-issue_date", "-id"]},
        ),
        migrations.AddField(
            model_name="book",
            name="accession_no",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AddField(
            model_name="book",
            name="condition",
            field=models.CharField(choices=[("New", "New"), ("Good", "Good"), ("Fair", "Fair"), ("Damaged", "Damaged")], default="Good", max_length=20),
        ),
        migrations.AddField(
            model_name="book",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        migrations.AddField(
            model_name="book",
            name="language",
            field=models.CharField(blank=True, default="English", max_length=40),
        ),
        migrations.AddField(
            model_name="book",
            name="notes",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="book",
            name="publisher",
            field=models.CharField(blank=True, default="", max_length=120),
        ),
        migrations.AddField(
            model_name="book",
            name="shelf_no",
            field=models.CharField(blank=True, default="", max_length=40),
        ),
        migrations.AlterField(
            model_name="book",
            name="category",
            field=models.CharField(choices=[("Textbook", "Textbook"), ("Story", "Story"), ("Reference", "Reference"), ("Science", "Science"), ("Islamiat", "Islamiat"), ("Fiction", "Fiction"), ("Magazine", "Magazine"), ("Other", "Other")], default="Textbook", max_length=30),
        ),
        migrations.AlterField(
            model_name="book",
            name="isbn",
            field=models.CharField(blank=True, default="", max_length=30),
        ),
        migrations.AlterField(
            model_name="book",
            name="quantity",
            field=models.PositiveIntegerField(default=1),
        ),
        migrations.AddField(
            model_name="issuereturn",
            name="issued_by",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AddField(
            model_name="issuereturn",
            name="remarks",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AlterField(
            model_name="issuereturn",
            name="book",
            field=models.ForeignKey(db_constraint=False, on_delete=django.db.models.deletion.CASCADE, related_name="issues", to="library.book"),
        ),
        migrations.AlterField(
            model_name="issuereturn",
            name="issue_date",
            field=models.DateField(default=django.utils.timezone.now),
        ),
        migrations.AlterField(
            model_name="issuereturn",
            name="status",
            field=models.CharField(choices=[("Issued", "Issued"), ("Returned", "Returned"), ("Lost", "Lost")], default="Issued", max_length=20),
        ),
        migrations.AlterField(
            model_name="issuereturn",
            name="student",
            field=models.ForeignKey(db_constraint=False, on_delete=django.db.models.deletion.CASCADE, to="students.student"),
        ),
    ]
