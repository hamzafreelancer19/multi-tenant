from django.contrib import admin
from .models import School, Enrollment

@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ('name', 'domain', 'status', 'plan_type', 'plan_status', 'created_at')
    list_filter = ('status', 'plan_type', 'plan_status')
    search_fields = ('name', 'domain', 'code')
    readonly_fields = ('code', 'database_name')
    
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
    list_display = ('student_name', 'school', 'status', 'created_at')
    list_filter = ('status', 'school')
    search_fields = ('student_name', 'father_name', 'father_phone')
