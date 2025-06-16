"""Tests for Temperature class."""

from datetime import timedelta
from math import isclose

from django.contrib.gis.geos import Point
from django.test import TestCase

from measurements.models import Measurement, Temperature


class TemperatureTest(TestCase):
    """Test cases for Temperature class."""

    @classmethod
    def setUpTestData(cls):
        """Set up test data for the test cases."""
        # Measurement and Temperature instances to test flagging
        cls.measurement1 = Measurement.objects.create(
            location=Point(1, 1),
            flag=False,
            water_source="WeLl",
        )
        cls.measurement2 = Measurement.objects.create(
            location=Point(2, 2),
            flag=True,
            water_source="tap",
        )

        cls.temperature1 = Temperature.objects.create(
            measurement=cls.measurement1,
            sensor="Test Sensor",
            value=40.0,
            time_waited=timedelta(seconds=1),
        )
        cls.temperature2 = Temperature.objects.create(
            measurement=cls.measurement2,
            sensor="Test Sensor",
            value=40.1,
            time_waited=timedelta(seconds=1),
        )

    def test_temperature_persistence_correct_values(self):
        """Tests that the temperature instance is saved correctly."""
        retrieved_temp1 = Temperature.objects.get(id=self.temperature1.id)

        assert retrieved_temp1.sensor == self.temperature1.sensor
        assert isclose(retrieved_temp1.value, self.temperature1.value)
        assert retrieved_temp1.time_waited == self.temperature1.time_waited
        assert retrieved_temp1.measurement == self.measurement1

        retrieved_temp2 = Temperature.objects.get(id=self.temperature2.id)

        assert retrieved_temp2.sensor == self.temperature2.sensor
        assert isclose(retrieved_temp2.value, self.temperature2.value)
        assert retrieved_temp2.time_waited == self.temperature2.time_waited
        assert retrieved_temp2.measurement == self.measurement2
