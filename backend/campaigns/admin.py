"""Add Campaigns to Admin view."""

from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin
from django.contrib.gis.geos import GEOSGeometry

from .models import Campaign


@admin.register(Campaign)
class CampaignAdmin(GISModelAdmin):
    """Define the admin view for Campaign."""

    def get_form(self, request, obj=None, **kwargs):
        """Override get_form to allow empty geometry fields.

        This allows the region field to be empty in the admin form.

        Parameters
        ----------
        request : HttpRequest
            The request object.
        obj : Campaign, optional
            The Campaign instance being edited, if any.
        **kwargs : dict
            Additional keyword arguments for the form.

        Returns
        -------
        ModelForm
            The form class for the Campaign model with the region field set as not required.
        """
        form = super().get_form(request, obj, **kwargs)
        form.base_fields["region"].required = False
        return form

    def save_model(self, request, obj, form, change):
        """Save the model instance.

        If no region is selected, set it to the world region.

        Parameters
        ----------
        request : HttpRequest
            The request object.
        obj : Campaign
            The Campaign instance being saved.
        form : ModelForm
            The form used to save the Campaign instance.
        change : bool
            Whether the object is being changed or created.
        """
        # If no region is selected, set it to world
        if not obj.region or obj.region.empty:
            try:
                # Define world bounds as a constant
                world_wkt = "MULTIPOLYGON(((-180 -90, 180 -90, 180 90, -180 90, -180 -90)))"
                world = GEOSGeometry(world_wkt, srid=4326)

                # Get the field's SRID
                field_srid = self.model._meta.get_field("region").srid

                # Transform if necessary
                if world.srid != field_srid:
                    world.transform(field_srid)

                obj.region = world
            except Exception as e:
                # Log the error but continue saving the model
                print(f"Error setting world region: {e!s}")

        super().save_model(request, obj, form, change)

    def get_fieldsets(self, request, obj=None):
        """Override get_fieldsets to add help text to the region field.

        Adds a note about leaving the region empty for world coverage.

        Parameters
        ----------
        request : HttpRequest
            The request object.
        obj : Campaign, optional
            The Campaign instance being edited, if any.

        Returns
        -------
        list
            The fieldsets for the Campaign model in the admin view, with a description for the region field.
        """
        fieldsets = super().get_fieldsets(request, obj)
        # Add help text to the region fieldset
        fieldsets[1][1]["fields"] = ["region"]
        fieldsets[1][1]["description"] = "Leave empty to include the whole world"
        return fieldsets

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
                "fields": ["region"],
            },
        ),
    ]
