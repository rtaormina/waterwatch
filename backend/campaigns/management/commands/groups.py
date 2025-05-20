"""Create groups and superuser."""

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    """Base command to create superuser and groups with permissions."""

    help = "Create superuser and groups with permissions."

    def handle(self):
        """Create superuser and groups with permissions."""
        user = get_user_model()

        # === Create Superuser ===
        username = "admin"
        email = "admin@example.com"
        password = "admin"

        if not user.objects.filter(username=username).exists():
            user.objects.create_superuser(username=username, email=email, password=password)
            print(f"Superuser '{username}' created.")
        else:
            print(f"Superuser '{username}' already exists.")

        # === Create Groups ===
        group_names = ["researcher"]

        for name in group_names:
            group, created = Group.objects.get_or_create(name=name)
            if created:
                print(f"Created group: {name}")
            else:
                print(f"Group already exists: {name}")

        # === Assign Permissions to Researcher Group ===
        group = Group.objects.get(name="researcher")
        perms = Permission.objects.filter(codename__in=["measurement_export.can_export"])
        group.permissions.add(*perms)

        # === Create Researcher User and Assign Group ===
        researcher_username = "researcher"
        researcher_email = "researcher@example.com"
        researcher_password = "researcher"

        if not user.objects.filter(username=researcher_username).exists():
            researcher_user = user.objects.create_user(
                username=researcher_username, email=researcher_email, password=researcher_password
            )
            researcher_user.groups.add(group)
            print(f"User '{researcher_username}' created and added to 'researcher' group.")
        else:
            print(f"User '{researcher_username}' already exists.")

        self.stdout.write(self.style.SUCCESS("Superuser and groups created successfully."))
