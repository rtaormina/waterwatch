"""Add Measurement Export to Admin view."""

from django import forms
from django.contrib import admin
from django_json_widget.widgets import JSONEditorWidget

from .models import Preset

# Register your models here.


class PresetAdminForm(forms.ModelForm):
    """Form for presets in the admin console."""

    class Meta:
        """Meta class for PresetAdminForm."""

        model = Preset
        fields = ["name", "description", "filters", "created_by", "is_public"]
        widgets = {
            "filters": JSONEditorWidget(
                options={
                    "mode": "code",
                    "mainMenuBar": False,
                    "statusBar": False,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "location": {
                                "type": "object",
                                "properties": {
                                    "continents": {"type": "array", "items": {"type": "string"}},
                                    "countries": {"type": "array", "items": {"type": "string"}},
                                },
                            },
                            "measurements": {
                                "type": "object",
                                "properties": {
                                    "temperature": {
                                        "type": "object",
                                        "properties": {
                                            "from": {"type": "string"},
                                            "to": {"type": "string"},
                                            "unit": {"type": "string", "enum": ["C", "F"]},
                                        },
                                    }
                                },
                            },
                            "dateRange": {
                                "type": "object",
                                "properties": {
                                    "from": {"type": "string"},
                                    "to": {"type": "string"},
                                },
                            },
                            "times": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "from": {"type": "string"},
                                        "to": {"type": "string"},
                                    },
                                },
                            },
                        },
                    },
                }
            ),
        }


@admin.register(Preset)
class PresetAdmin(admin.ModelAdmin):
    """Admin view for Preset."""

    form = PresetAdminForm

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
