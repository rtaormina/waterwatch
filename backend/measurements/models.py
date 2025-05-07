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
    location = geomodels.PointField()
    flag = models.BooleanField(default=False)
    water_source = models.CharField(max_length=255, choices=water_source_choices)
    campaigns = models.ManyToManyField(Campaign)
    user = models.ForeignKey(User, blank=True, null=True, on_delete=models.DO_NOTHING)

    def __str__(self):
        return f"<Measurement: {self.timestamp}; {self.location}; {self.water_source}>"


class Metric(models.Model):
    """Model for Metric table in database.

    Attributes
    ----------
    type_choice : dict
        A dictionary defining the possible metric types
    metric_type : str
        Type of measurement predefined by 'type_choices'
    measurement : Measurement
        Associated Measurement for metric
    """

    type_choices = {
        "temperature": "temperature",
        "turbidity": "turbidity",
        "hardness": "hardness",
    }
    metric_type = models.CharField(max_length=255, choices=type_choices)
    measurement = models.ForeignKey(Measurement, on_delete=models.CASCADE, null=True)

    class Meta:
        abstract = True


class Temperature(Metric):
    """Model for recording temperature measurements in the database.

    Attributes
    ----------
    metric_type : str
        Set to "temperature" to indicate the type
    sensor : str
        The type of the sensor that was used to record the temperature
    value : float
        The temperature recorded temperature with single decimal place precision
    time_waited : datetime.timedelta
        The time duration between placing the sensor into the water and reading the ttemperature
    """

    metric_type = "temperature"
    sensor = models.CharField(max_length=255)
    value = models.DecimalField(max_digits=4, decimal_places=1)
    time_waited = models.DurationField()

    def __str__(self):
        return f"<Temperature: {self.sensor}; {self.value}; {self.time_waited}>"
