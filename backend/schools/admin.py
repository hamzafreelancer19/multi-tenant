from django.contrib import admin
from .models import School, Enrollment

@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ('name', 'domain', 'status_styled', 'plan_type', 'plan_status', 'created_at')
    list_filter = ('status', 'plan_type', 'plan_status')
    search_fields = ('name', 'domain', 'code')
    readonly_fields = ('code', 'database_name')
    actions = ['approve_schools', 'reject_schools']
    
    def status_styled(self, obj):
        from django.utils.html import format_html
        colors = {
            'Approved': 'green',
            'Pending': 'orange',
            'Rejected': 'red',
        }
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colors.get(obj.status, 'black'),
            obj.status
        )
    status_styled.short_description = 'Status'

    def approve_schools(self, request, queryset):
        rows_updated = queryset.update(status='Approved')
        if rows_updated == 1:
            message_bit = "1 school was"
        else:
            message_bit = f"{rows_updated} schools were"
        self.message_user(request, f"{message_bit} successfully marked as Approved.")
    approve_schools.short_description = "Approve selected schools"

    def reject_schools(self, request, queryset):
        rows_updated = queryset.update(status='Rejected')
        if rows_updated == 1:
            message_bit = "1 school was"
        else:
            message_bit = f"{rows_updated} schools were"
        self.message_user(request, f"{message_bit} successfully marked as Rejected.")
    reject_schools.short_description = "Reject selected schools"
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'code', 'domain', 'status')
        }),
        ('Subscription Details', {
            'fields': ('plan_type', 'plan_status', 'plan_amount', 'transaction_id', 'plan_start_date', 'plan_expiry_date')
        }),
        ('Infrastructure', {
            'fields': ('database_name',),
            'classes': ('collapse',)
        }),
    )

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student_name', 'school', 'status_styled', 'created_at')
    list_filter = ('status', 'school')
    search_fields = ('student_name', 'father_name', 'father_phone')
    actions = ['accept_enrollments', 'reject_enrollments']

    def status_styled(self, obj):
        from django.utils.html import format_html
        colors = {
            'Accepted': 'green',
            'Pending': 'orange',
            'Rejected': 'red',
        }
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colors.get(obj.status, 'black'),
            obj.status
        )
    status_styled.short_description = 'Status'

    def accept_enrollments(self, request, queryset):
        queryset.update(status='Accepted')
        self.message_user(request, "Selected enrollments have been marked as Accepted.")
    accept_enrollments.short_description = "Accept selected enrollments"

    def reject_enrollments(self, request, queryset):
        queryset.update(status='Rejected')
        self.message_user(request, "Selected enrollments have been marked as Rejected.")
    reject_enrollments.short_description = "Reject selected enrollments"
