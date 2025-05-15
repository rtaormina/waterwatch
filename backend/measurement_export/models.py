"""Define models associated with measurement export."""

from django.contrib.gis.db import models


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
