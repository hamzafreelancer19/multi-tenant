from django.core.management.base import BaseCommand

from students.services import backfill_missing_logins


class Command(BaseCommand):
    help = "Create parent (name-based) and student portal logins for existing students."

    def handle(self, *args, **options):
        result = backfill_missing_logins()
        self.stdout.write(
            self.style.SUCCESS(
                f"Created {result['parents_created']} parent logins and {result['students_created']} student logins."
            )
        )
