"""creating super user and groups with permissions."""

import os

import django
from django.contrib.auth import Group, Permission, get_user_model

# Set up Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")  # replace with your project
django.setup()


User = get_user_model()

username = "admin"
email = "admin@example.com"
password = "admin123"

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username=username, email=email, password=password)
    print(f"Superuser '{username}' created.")
else:
    print(f"Superuser '{username}' already exists.")

# List of group names to create
group_names = ["researcher", "Editor", "Viewer"]
group = Group.objects.get(name="researcher")

for name in group_names:
    group, created = Group.objects.get_or_create(name=name)
    if created:
        print(f"Created group: {name}")
    else:
        print(f"Group already exists: {name}")

perms = Permission.objects.filter(codename__in=["measurement_export.can_export"])
group.permissions.add(*perms)
