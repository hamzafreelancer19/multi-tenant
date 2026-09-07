from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Create or update a Django admin superadmin (platform) user."

    def add_arguments(self, parser):
        parser.add_argument("--username", required=True)
        parser.add_argument("--password", required=True)
        parser.add_argument("--email", default="")

    def handle(self, *args, **options):
        User = get_user_model()
        username = (options["username"] or "").strip()
        password = options["password"] or ""
        email = (options["email"] or "").strip()

        if not username or not password:
            raise CommandError("username and password are required.")
        if len(password) < 6:
            raise CommandError("password must be at least 6 characters.")

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "role": "superadmin",
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
            },
        )
        user.email = email or user.email
        user.role = "superadmin"
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(password)
        user.save()

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} superadmin: {user.username}"))
