from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("chat", "0001_chat_threads_messages"),
    ]

    operations = [
        migrations.AddField(
            model_name="chatmessage",
            name="attachment_name",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="chatmessage",
            name="attachment_type",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AddField(
            model_name="chatmessage",
            name="attachment_url",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AlterField(
            model_name="chatmessage",
            name="body",
            field=models.TextField(blank=True, default=""),
        ),
    ]
