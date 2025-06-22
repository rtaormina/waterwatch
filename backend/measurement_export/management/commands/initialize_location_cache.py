"""
Management command to initialize location geometries cache.

This command should be run after the location table is populated
but before the application starts serving requests.
"""

from django.core.management.base import BaseCommand
from django.db import connection

from measurement_export.utils import initialize_location_geometries


class Command(BaseCommand):
    """Management command to initialize the location geometries cache.

    This command checks if the location table exists and has data,
    and initializes the geometries cache if conditions are met.

    If the `--force` option is provided, it will clear any existing cache
    and re-initialize the geometries cache regardless of the current state.

    Usage:
    python manage.py initialize_location_cache [--force]

    Options:
    --force: Force re-initialization of the cache even if it has already been initialized.
    """

    help = "Initialize location geometries cache from the database"

    def add_arguments(self, parser):
        """Add command line arguments for the management command.

        Parameters
        ----------
        parser : ArgumentParser
            The argument parser to which the command line arguments will be added.
        """
        parser.add_argument(
            "--force",
            action="store_true",
            help="Force re-initialization even if already initialized",
        )

    def handle(self, *_args, **options):
        """Handle the command execution.

        This method checks the existence and data of the location table,
        and initializes the geometries cache if conditions are met.

        Parameters
        ----------
        *_args : tuple
            Positional arguments passed to the command.
        **options : dict
            Keyword arguments passed to the command, including the `force` option.
        """
        force = options["force"]

        # Check if Location table exists
        table_names = connection.introspection.table_names()
        if "locations" not in table_names:
            self.stdout.write(
                self.style.ERROR("Location table does not exist. Please run the location setup command first.")
            )
            return

        # Check if Location table has data
        from measurement_export.models import Location

        location_count = Location.objects.count()

        if location_count == 0:
            self.stdout.write(
                self.style.WARNING("Location table is empty. Please populate it with location data first.")
            )
            return

        self.stdout.write(f"Found {location_count} location records.")

        if force:
            # Clear existing cache and force re-initialization
            from measurement_export.utils import clear_location_cache

            clear_location_cache()
            self.stdout.write("Cleared existing location cache.")

        try:
            # Initialize location geometries
            initialize_location_geometries()
            self.stdout.write(self.style.SUCCESS("Successfully initialized location geometries cache."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to initialize location geometries cache: {e!s}"))
