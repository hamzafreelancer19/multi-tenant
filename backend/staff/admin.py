from django.contrib import admin
from .models import Staff, Payroll


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = (
        "employee_id",
        "name",
        "role",
        "shift",
        "phone",
        "salary",
        "joining_date",
        "status",
        "school",
    )
    list_filter = ("role", "shift", "status", "school")
    search_fields = ("name", "phone", "email", "employee_id", "cnic")


@admin.register(Payroll)
class PayrollAdmin(admin.ModelAdmin):
    list_display = ("receipt_no", "staff", "month", "year", "amount_paid", "bonus", "deduction", "payment_date", "status")
    list_filter = ("month", "year", "status", "payment_method", "staff__school")
    search_fields = ("staff__name", "receipt_no")
