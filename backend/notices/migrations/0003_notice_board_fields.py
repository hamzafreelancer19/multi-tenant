from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("notices", "0002_alter_notice_school"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="notice",
            options={"ordering": ["-is_pinned", "-created_at"]},
        ),
        migrations.AddField(
            model_name="notice",
            name="audience",
            field=models.CharField(default="All", max_length=20),
        ),
        migrations.AddField(
            model_name="notice",
            name="category",
            field=models.CharField(default="General", max_length=20),
        ),
        migrations.AddField(
            model_name="notice",
            name="class_name",
            field=models.CharField(blank=True, default="", max_length=80),
        ),
        migrations.AddField(
            model_name="notice",
            name="expires_at",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="notice",
            name="is_pinned",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="notice",
            name="posted_by",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AddField(
            model_name="notice",
            name="priority",
            field=models.CharField(default="Normal", max_length=20),
        ),
    ]
