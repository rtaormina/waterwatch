"""Config for api app."""

from django.apps import AppConfig


class ApiConfig(AppConfig):
    """Configuration class for the 'api' application.

    Attributes
    ----------
    default_auto_field : str
        Specifies the default type of primary key field to use for models in this app.
    name : str
        The full Python path to the application.
    """

    default_auto_field = "django.db.models.BigAutoField"
    name = "api"
