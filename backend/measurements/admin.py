"""Add Measurements to Admin view."""

from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin

from .models import Measurement, Temperature


# Register your models here.
@admin.register(Measurement)
class MeasurementAdmin(GISModelAdmin):
    """Admin view for Measurements."""

    list_display = (
        "flag",
        "water_source",
        "timestamp",
        "location",
        "user",
    )
    list_display_links = ("flag",)
    readonly_fields = ("timestamp",)
    search_fields = [
        "flag",
        "water_source",
        "timestamp",
        "location",
    ]
    fieldsets = [
        (
            None,
            {
                "fields": [
                    "flag",
                    "water_source",
                    "campaigns",
                ],
            },
        ),
        (
            "Region",
            {
                "classes": ["collapse"],
                "fields": ["location"],
            },
        ),
    ]


@admin.register(Temperature)
class TemperatureAdmin(admin.ModelAdmin):
    """Admin view for Temperature."""

    list_display = (
        "measurement",
        "value",
        "sensor",
        "time_waited",
    )
    list_display_links = ("value",)
    search_fields = [
        "value",
        "sensor",
    ]
