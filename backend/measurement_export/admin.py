"""Add Measurement Export to Admin view."""

from django.contrib import admin

from .models import Preset


# Register your models here.
@admin.register(Preset)
class PresetAdmin(admin.ModelAdmin):
    """Admin view for Preset."""

    list_display = (
        "name",
        "description",
        "created_by",
        "created_at",
        "updated_at",
        "is_public",
    )
    list_display_links = ("name",)
    search_fields = [
        "name",
        "description",
        "created_by__username",
    ]
    fieldsets = [
        (
            None,
            {
                "fields": [
                    "name",
                    "description",
                    "filters",
                    "created_by",
                    "is_public",
                ],
            },
        ),
    ]
