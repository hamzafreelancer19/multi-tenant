from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    # Add your custom fields to the list and forms
    list_display = ('username', 'email', 'phone', 'role', 'school', 'is_staff')
    list_filter = ('role', 'is_staff', 'school')
    
    # This allows you to edit the custom fields (role, school) in the admin panel
    fieldsets = UserAdmin.fieldsets + (
        ('Custom SaaS Fields', {'fields': ('role', 'school', 'phone')}),
    )
    
    # This is for the "Add User" form
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Custom SaaS Fields', {'fields': ('role', 'school', 'phone')}),
    )

admin.site.register(User, CustomUserAdmin)
