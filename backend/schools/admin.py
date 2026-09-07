from datetime import date, timedelta

from django.contrib import admin
from .models import School, Enrollment, Plan


def activate_school_plan(school):
    """Activate a plan on a school (shared by API + Django admin)."""
    plan = school.subscribed_plan
    days = (plan.duration_days if plan else 30) or 30
    school.plan_status = "Active"
    school.plan_start_date = date.today()
    school.plan_expiry_date = date.today() + timedelta(days=days)
    if plan:
        school.plan_type = plan.feature_tier
        school.plan_amount = plan.price
    school.save()
    return school


def clear_school_plan(school):
    school.plan_status = "Inactive"
    school.plan_type = "None"
    school.transaction_id = ""
    school.subscribed_plan = None
    school.plan_start_date = None
    school.plan_expiry_date = None
    school.save()
    return school


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "code",
        "price",
        "feature_tier",
        "duration_days",
        "student_limit",
        "teacher_limit",
        "is_active",
        "sort_order",
    )
    list_filter = ("feature_tier", "is_active", "is_popular")
    search_fields = ("name", "code")
    ordering = ("sort_order", "price")


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "domain",
        "status_styled",
        "plan_type",
        "plan_status_styled",
        "plan_amount",
        "transaction_id",
        "created_at",
    )
    list_filter = ("status", "plan_type", "plan_status")
    search_fields = ("name", "domain", "code", "transaction_id")
    readonly_fields = ("code", "database_name")
    actions = [
        "approve_schools",
        "reject_schools",
        "approve_plans",
        "reject_plans",
    ]

    def status_styled(self, obj):
        from django.utils.html import format_html

        colors = {
            "Approved": "green",
            "Pending": "orange",
            "Rejected": "red",
        }
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colors.get(obj.status, "black"),
            obj.status,
        )

    status_styled.short_description = "School status"
    status_styled.admin_order_field = "status"

    def plan_status_styled(self, obj):
        from django.utils.html import format_html

        colors = {
            "Active": "green",
            "Pending": "#c2410c",
            "Inactive": "#64748b",
        }
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colors.get(obj.plan_status, "black"),
            obj.plan_status,
        )

    plan_status_styled.short_description = "Plan status"
    plan_status_styled.admin_order_field = "plan_status"

    @admin.action(description="Approve selected schools")
    def approve_schools(self, request, queryset):
        rows_updated = queryset.update(status="Approved")
        message_bit = "1 school was" if rows_updated == 1 else f"{rows_updated} schools were"
        self.message_user(request, f"{message_bit} successfully marked as Approved.")

    @admin.action(description="Reject / suspend selected schools")
    def reject_schools(self, request, queryset):
        rows_updated = queryset.update(status="Rejected")
        message_bit = "1 school was" if rows_updated == 1 else f"{rows_updated} schools were"
        self.message_user(request, f"{message_bit} successfully marked as Rejected.")

    @admin.action(description="Accept / approve selected plans")
    def approve_plans(self, request, queryset):
        from core.models import ActivityLog

        count = 0
        skipped = 0
        for school in queryset.select_related("subscribed_plan"):
            if school.plan_status != "Pending":
                skipped += 1
                continue
            activate_school_plan(school)
            ActivityLog.objects.create(
                school=None,
                name=request.user.username,
                action=f"approved '{school.plan_type}' plan for school '{school.name}' (Django admin)",
                avatar="A",
            )
            count += 1
        if count:
            self.message_user(request, f"{count} plan(s) accepted / activated.")
        if skipped:
            self.message_user(
                request,
                f"{skipped} school(s) skipped (plan was not Pending).",
                level="WARNING",
            )

    @admin.action(description="Reject selected plans")
    def reject_plans(self, request, queryset):
        from core.models import ActivityLog

        count = 0
        for school in queryset:
            if school.plan_status == "Inactive" and school.plan_type in ("None", "", None):
                continue
            clear_school_plan(school)
            ActivityLog.objects.create(
                school=None,
                name=request.user.username,
                action=f"rejected plan request for school '{school.name}' (Django admin)",
                avatar="R",
            )
            count += 1
        self.message_user(request, f"{count} plan(s) rejected / cleared.")

    fieldsets = (
        ("Basic Information", {"fields": ("name", "code", "domain", "status")}),
        (
            "Subscription Details",
            {
                "fields": (
                    "subscribed_plan",
                    "plan_type",
                    "plan_status",
                    "plan_amount",
                    "transaction_id",
                    "plan_start_date",
                    "plan_expiry_date",
                ),
                "description": (
                    "Pending plans: tick the school checkbox(es) → Action dropdown → "
                    '"Accept / approve selected plans" → Go.'
                ),
            },
        ),
        (
            "Branding & Assets",
            {
                "fields": (
                    "logo",
                    "favicon",
                    "dashboard_primary_color",
                    "dashboard_secondary_color",
                    "dashboard_accent_color",
                )
            },
        ),
        (
            "Landing Page Design",
            {
                "fields": (
                    "landing_primary_color",
                    "landing_secondary_color",
                    "landing_hero_title",
                    "landing_hero_subtitle",
                    "landing_hero_image_url",
                    "landing_center_image_url",
                    "landing_about_text",
                    "landing_contact_email",
                    "landing_contact_phone",
                    "landing_show_stats",
                    "landing_features",
                    "landing_testimonials",
                    "landing_programs",
                    "landing_languages",
                    "landing_copy",
                )
            },
        ),
        (
            "Infrastructure",
            {"fields": ("database_name", "ai_api_key"), "classes": ("collapse",)},
        ),
    )


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = (
        "student_name",
        "class_applying",
        "school",
        "father_name",
        "father_phone",
        "status_styled",
        "created_at",
    )
    list_filter = ("status", "school", "class_applying", "gender")
    search_fields = ("student_name", "father_name", "father_phone", "email", "class_applying")
    actions = ["accept_enrollments", "reject_enrollments"]

    def status_styled(self, obj):
        from django.utils.html import format_html

        colors = {
            "Accepted": "green",
            "Pending": "orange",
            "Rejected": "red",
        }
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colors.get(obj.status, "black"),
            obj.status,
        )

    status_styled.short_description = "Status"

    @admin.action(description="Accept selected enrollments")
    def accept_enrollments(self, request, queryset):
        queryset.update(status="Accepted")
        self.message_user(request, "Selected enrollments have been marked as Accepted.")

    @admin.action(description="Reject selected enrollments")
    def reject_enrollments(self, request, queryset):
        queryset.update(status="Rejected")
        self.message_user(request, "Selected enrollments have been marked as Rejected.")
