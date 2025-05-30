"""Create groups and superuser."""

import os

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Command(BaseCommand):
    """Base command to create superuser and groups with permissions."""

    help = "Create superuser and groups with permissions."

    def handle(self, *_args, **_options):
        """Create superuser and groups with permissions."""
        user = get_user_model()

        # === Create Superuser ===
        username = os.getenv("START_ADMIN_USER", default="admin")
        email = os.getenv("START_ADMIN_EMAIL", default="admin@example.com")
        password = os.getenv("START_ADMIN_PASSWORD", default="admin")

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
        perms = Permission.objects.filter(codename__in=["can_export"])
        group.permissions.add(*perms)

        # === Create Researcher User and Assign Group ===
        researcher_username = os.getenv("START_RESEARCHER_USER", default="researcher")
        researcher_email = os.getenv("START_RESEARCHER_EMAIL", default="researcher@example.com")
        researcher_password = os.getenv("START_RESEARCHER_PASSWORD", default="researcher")

        if not user.objects.filter(username=researcher_username).exists():
            researcher_user = user.objects.create_user(
                username=researcher_username, email=researcher_email, password=researcher_password
            )
            researcher_user.groups.add(group)
            print(f"User '{researcher_username}' created and added to 'researcher' group.")
        else:
            print(f"User '{researcher_username}' already exists.")

        self.stdout.write(self.style.SUCCESS("Superuser and groups created successfully."))
