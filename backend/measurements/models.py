"""Define models associated with Measurements."""

from campaigns.models import Campaign
from django.contrib.auth.models import User
from django.contrib.gis.db import models as geomodels
from django.db import models
from django.utils import timezone


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
        "network": "network",
        "rooftop tank": "rooftop tank",
        "well": "well",
        "other": "other",
    }
    timestamp = models.DateTimeField(auto_now_add=True)
    local_date = models.DateField(default=timezone.now)
    local_time = models.TimeField(default=timezone.now)
    location = geomodels.PointField(srid=4326)
    flag = models.BooleanField(default=True)
    water_source = models.CharField(max_length=255, choices=list(water_source_choices.items()))
    campaigns = models.ManyToManyField(Campaign, blank=True)
    user = models.ForeignKey(User, blank=True, null=True, on_delete=models.DO_NOTHING)

    class Meta:
        indexes = [
            geomodels.Index(fields=["location"]),
            models.Index(fields=["water_source"]),
            models.Index(fields=["local_date"]),
            models.Index(fields=["local_time"]),
            models.Index(fields=["local_date", "local_time"]),
        ]

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

    measurement = models.OneToOneField(Measurement, on_delete=models.CASCADE, null=False, default=None)
    sensor = models.CharField(max_length=255)
    value = models.DecimalField(max_digits=4, decimal_places=1)
    time_waited = models.DurationField()

    class Meta:
        """Meta class for Temperature model."""

        constraints = [
            models.CheckConstraint(
                check=models.Q(value__gte=0),
                name="temperature_value_greater_than_zero",
            ),
            models.CheckConstraint(
                check=models.Q(value__lte=100),
                name="temperature_value_less_than_100",
            ),
            models.UniqueConstraint(fields=["measurement"], name="unique_measurement_id"),
        ]
        indexes = [
            models.Index(fields=["value"]),
        ]

    def __str__(self):
        return f"Temperature: {self.value} - {self.sensor} - {self.time_waited}"
