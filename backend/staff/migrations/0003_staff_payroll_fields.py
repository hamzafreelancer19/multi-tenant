from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("staff", "0002_alter_staff_school"),
    ]

    operations = [
        migrations.RunPython(
            lambda apps, schema: (
                apps.get_model("staff", "Staff").objects.filter(email__isnull=True).update(email=""),
                apps.get_model("staff", "Staff").objects.filter(phone__isnull=True).update(phone=""),
            ),
            migrations.RunPython.noop,
        ),
        migrations.AlterModelOptions(
            name="staff",
            options={"ordering": ["name"]},
        ),
        migrations.AlterModelOptions(
            name="payroll",
            options={"ordering": ["-payment_date", "-id"]},
        ),
        migrations.AddField(
            model_name="staff",
            name="address",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="staff",
            name="city",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AddField(
            model_name="staff",
            name="cnic",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AddField(
            model_name="staff",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        migrations.AddField(
            model_name="staff",
            name="date_of_birth",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="staff",
            name="emergency_phone",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AddField(
            model_name="staff",
            name="employee_id",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AddField(
            model_name="staff",
            name="gender",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AddField(
            model_name="staff",
            name="notes",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="staff",
            name="shift",
            field=models.CharField(choices=[("Morning", "Morning"), ("Evening", "Evening"), ("Full day", "Full day")], default="Morning", max_length=20),
        ),
        migrations.AlterField(
            model_name="staff",
            name="email",
            field=models.EmailField(blank=True, default="", max_length=254),
        ),
        migrations.AlterField(
            model_name="staff",
            name="joining_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="staff",
            name="phone",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AlterField(
            model_name="staff",
            name="role",
            field=models.CharField(choices=[("Admin", "Admin"), ("Accountant", "Accountant"), ("Clerk", "Clerk"), ("Receptionist", "Receptionist"), ("Librarian", "Librarian"), ("Lab Assistant", "Lab Assistant"), ("Driver", "Driver"), ("Conductor", "Conductor"), ("Security", "Security"), ("Peon", "Peon"), ("Aya", "Aya"), ("Cleaner", "Cleaner"), ("Other", "Other")], default="Other", max_length=50),
        ),
        migrations.AlterField(
            model_name="staff",
            name="salary",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name="payroll",
            name="bonus",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name="payroll",
            name="deduction",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name="payroll",
            name="payment_method",
            field=models.CharField(choices=[("Cash", "Cash"), ("Bank", "Bank"), ("JazzCash", "JazzCash"), ("EasyPaisa", "EasyPaisa"), ("Cheque", "Cheque")], default="Cash", max_length=20),
        ),
        migrations.AddField(
            model_name="payroll",
            name="receipt_no",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AddField(
            model_name="payroll",
            name="remarks",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AlterField(
            model_name="payroll",
            name="amount_paid",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AlterField(
            model_name="payroll",
            name="payment_date",
            field=models.DateField(),
        ),
        migrations.AlterField(
            model_name="payroll",
            name="staff",
            field=models.ForeignKey(db_constraint=False, on_delete=django.db.models.deletion.CASCADE, related_name="payslips", to="staff.staff"),
        ),
        migrations.AlterField(
            model_name="payroll",
            name="status",
            field=models.CharField(choices=[("Paid", "Paid"), ("Pending", "Pending")], default="Paid", max_length=20),
        ),
    ]
