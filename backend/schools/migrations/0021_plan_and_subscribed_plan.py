from django.db import migrations, models
import django.db.models.deletion


DEFAULT_PLANS = [
    {
        "code": "basic",
        "name": "Basic Plan",
        "description": "Core school management for small campuses.",
        "price": 1500,
        "duration_days": 30,
        "student_limit": 100,
        "teacher_limit": 5,
        "feature_tier": "Basic",
        "features": [
            "Student Management",
            "Teacher Profiles",
            "Attendance Tracking",
            "Admission Requests",
            "School Profile",
        ],
        "locked_features": [
            "AI Assistant",
            "Fees & Payments",
            "Exams & Results",
            "Notice Board",
            "Library",
            "Bus Tracking",
        ],
        "color": "#F15A24",
        "is_popular": False,
        "sort_order": 1,
    },
    {
        "code": "business",
        "name": "Business Plan",
        "description": "Operations suite with AI and fee tools.",
        "price": 3500,
        "duration_days": 30,
        "student_limit": 500,
        "teacher_limit": 30,
        "feature_tier": "Business",
        "features": [
            "All Basic Features",
            "AI Assistant",
            "Fee & Salary Management",
            "Exams & Marksheets",
            "Notice Board",
            "SMS/WhatsApp Alerts",
        ],
        "locked_features": [
            "Library System",
            "Bus Routes",
            "Timetable & Homework",
        ],
        "color": "#FF8C42",
        "is_popular": True,
        "sort_order": 2,
    },
    {
        "code": "pro",
        "name": "Ultimate Pro",
        "description": "Full Classora platform with priority support.",
        "price": 6000,
        "duration_days": 30,
        "student_limit": None,
        "teacher_limit": None,
        "feature_tier": "Pro",
        "features": [
            "Everything Included",
            "Classora AI Assistant",
            "Library Management",
            "Transport & Fleet",
            "Timetables & Homework",
            "AI Performance Predictor",
            "24/7 Priority Support",
        ],
        "locked_features": [],
        "color": "#0F172A",
        "is_popular": False,
        "sort_order": 3,
    },
]


def seed_plans(apps, schema_editor):
    Plan = apps.get_model("schools", "Plan")
    for row in DEFAULT_PLANS:
        Plan.objects.update_or_create(code=row["code"], defaults=row)


def unseed_plans(apps, schema_editor):
    Plan = apps.get_model("schools", "Plan")
    Plan.objects.filter(code__in=[p["code"] for p in DEFAULT_PLANS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("schools", "0020_enrollment_incharge_test"),
    ]

    operations = [
        migrations.CreateModel(
            name="Plan",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.SlugField(max_length=40, unique=True)),
                ("name", models.CharField(max_length=100)),
                ("description", models.TextField(blank=True, default="")),
                ("price", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("duration_days", models.PositiveIntegerField(default=30)),
                ("student_limit", models.PositiveIntegerField(blank=True, help_text="Null = unlimited students", null=True)),
                ("teacher_limit", models.PositiveIntegerField(blank=True, help_text="Null = unlimited teachers", null=True)),
                (
                    "feature_tier",
                    models.CharField(
                        choices=[("Basic", "Basic"), ("Business", "Business"), ("Pro", "Pro")],
                        default="Basic",
                        help_text="Unlocks sidebar features up to this tier",
                        max_length=20,
                    ),
                ),
                ("features", models.JSONField(blank=True, default=list)),
                ("locked_features", models.JSONField(blank=True, default=list)),
                ("color", models.CharField(default="#F15A24", max_length=20)),
                ("is_active", models.BooleanField(default=True)),
                ("is_popular", models.BooleanField(default=False)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["sort_order", "price", "name"],
            },
        ),
        migrations.AddField(
            model_name="school",
            name="subscribed_plan",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="schools",
                to="schools.plan",
            ),
        ),
        migrations.RunPython(seed_plans, unseed_plans),
    ]
