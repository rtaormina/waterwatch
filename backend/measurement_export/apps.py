"""Config for measurement export app."""

from django.apps import AppConfig


class MeasurementExportConfig(AppConfig):
    """
    Configuration class for the 'measurement_export' application.

    Attributes
    ----------
    default_auto_field : str
        Specifies the default type of primary key field to use for models in this app.
    name : str
        The full Python path to the application.
    """

    default_auto_field = "django.db.models.BigAutoField"
    name = "measurement_export"

    def ready(self):
        """Import signals when the app is ready."""
        from . import signals  # noqa: F401
