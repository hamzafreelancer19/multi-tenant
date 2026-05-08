from django.contrib import admin
from .models import ActivityLog, Notification, GlobalSetting

@admin.register(GlobalSetting)
class GlobalSettingAdmin(admin.ModelAdmin):
    list_display = ('name', 'updated_at')
    
    # Restrict to only one instance if possible
    def has_add_permission(self, request):
        if self.model.objects.count() >= 1:
            return False
        return super().has_add_permission(request)

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('name', 'action', 'school', 'created_at')
    list_filter = ('school', 'created_at')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('message', 'school', 'is_read', 'created_at')
    list_filter = ('school', 'is_read')
