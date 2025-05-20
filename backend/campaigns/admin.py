"""Add Campaigns to Admin view."""

from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin

from .models import Campaign


# Register your models here.
@admin.register(Campaign)
class CampaignAdmin(GISModelAdmin):
    """Define the admin view for Campaign."""

    list_display = (
        "name",
        "region",
        "start_time",
        "end_time",
    )
    list_display_links = ("name",)
    search_fields = [
        "name",
        "description",
        "region",
        "start_time",
        "end_time",
    ]
    fieldsets = [
        (
            None,
            {
                "fields": ["name", "description", "start_time", "end_time"],
            },
        ),
        (
            "Region",
            {
                "classes": ["collapse"],
                "fields": ["region"],
            },
        ),
    ]
