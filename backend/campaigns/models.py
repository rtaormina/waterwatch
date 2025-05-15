"""Define models associated with campaigns."""

from django.contrib.gis.db import models as geomodels
from django.db import models


# Create your models here.
class Campaign(models.Model):
    """Model for Campaign table in Database.

    Attributes
    ----------
    region : MultiPolygonField
        The campaigns associated region
    start_time : datetime.datetime
        The start date and time of the campaign
    end_time : datetime.datetime
        The end date and time of the campaign
    name : str
        The name of the campaign
    description : str
        The description of the campaign
    """

    region = geomodels.MultiPolygonField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    name = models.CharField(max_length=255)
    description = models.TextField()

    def __str__(self):
        return f"Campaign: {self.name} ({self.format_time()})"

    def format_time(self):
        """Format the start and end time of the campaign."""
        return f"{self.start_time.strftime('%Y-%m-%d %H:%M')} - {self.end_time.strftime('%Y-%m-%d %H:%M')}"
