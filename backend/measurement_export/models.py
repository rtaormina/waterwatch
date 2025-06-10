"""Define models associated with measurement export."""

from django.contrib.auth.models import User
from django.contrib.gis.db import models
from django.contrib.gis.db.models import indexes as gis_indexes


class Location(models.Model):
    """Model for location in database.

    Attributes
    ----------
    country_name : str
        Dictionary defining the possible water source types
    continent: str
        Datetime for when the measurement was taken
    geom: MultiPolygonField
        MultiPolygonField for country's bounds
    """

    country_name = models.CharField(max_length=100)
    continent = models.CharField(max_length=50)
    geom = models.MultiPolygonField(srid=4326)

    class Meta:
        managed = False
        db_table = "locations"
        permissions = [
            ("can_export", "can export measurements"),
        ]
        indexes = [
            models.Index(fields=["continent"]),
            models.Index(fields=["country_name"]),
            models.Index(fields=["continent", "country_name"]),
            gis_indexes.GistIndex(fields=["geom"]),
        ]


class Preset(models.Model):
    """Model for measurement export preset.

    Attributes
    ----------
    name : str
        Name of the preset
    description : str
        Description of the preset
    filters : dict
        Dictionary defining the filters for the preset
    created_by : User
        User who created the preset
    created_at : datetime
        Datetime for when the preset was created
    updated_at : datetime
        Datetime for when the preset was last updated
    is_public : bool
        Boolean indicating if the preset is public
    """

    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    filters = models.JSONField(default=dict, blank=True, null=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_public = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
