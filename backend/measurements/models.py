"""Define models associated with Measurements."""

from campaigns.models import Campaign
from django.contrib.auth.models import User
from django.contrib.gis.db import models as geomodels
from django.db import models


# Create your models here.
class Measurement(models.Model):
    """Model for measurement table in database.

    Attributes
    ----------
    water_source_choices : dict
        Dictionary defining the possible water source types
    timestamp : datetime.datetime
        Datetime for when the measurement was taken
    location : Point
        Point containing the latitude and longitude of where the measurement was taken
    flag : bool, default = True
        Flag for if the measurement is suspicious in any way
    water_source : str
        Source where the water used for the measurement came from (e.g., tap, well,  etc.)
    campaigns : QuerySet[Campaign]
        Indicate campaign(s) the measurement is part of
    user : User, optional
        User that took the measurement
    """

    water_source_choices = {
        "well": "well",
    }
    timestamp = models.DateTimeField(auto_now_add=True)
    location = geomodels.PointField(srid=4326)
    flag = models.BooleanField(default=False)
    water_source = models.CharField(max_length=255, choices=list(water_source_choices.items()))
    campaigns = models.ManyToManyField(Campaign, blank=True)
    user = models.ForeignKey(User, blank=True, null=True, on_delete=models.DO_NOTHING)

    def __str__(self):
        return f"Measurement: {self.timestamp} - {self.location} - {self.water_source}"


class Temperature(models.Model):
    """Model for recording temperature measurements in the database.

    Attributes
    ----------
    measurement : Measurement
        Associated Measurement for metric
    sensor : str
        The type of the sensor that was used to record the temperature
    value : float
        The temperature recorded temperature with single decimal place precision
    time_waited : datetime.timedelta
        The time duration between placing the sensor into the water and reading the temperature
    """

    measurement = models.OneToOneField(Measurement, on_delete=models.CASCADE, null=False)
    sensor = models.CharField(max_length=255)
    value = models.DecimalField(max_digits=4, decimal_places=1)
    time_waited = models.DurationField()

    def __str__(self):
        return f"Temperature: {self.value} - {self.sensor} - {self.time_waited}"
