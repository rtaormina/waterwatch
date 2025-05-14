"""Tests for Temperature class."""

from datetime import timedelta

from django.contrib.gis.geos import Point
from django.core.exceptions import ValidationError
from django.test import TestCase

from measurements.models import Measurement, Temperature


class MeasurementTest(TestCase):
    """Test cases for Temperature class."""

    @classmethod
    def setUpTestData(cls):
        """Set up test data for the test cases."""
        # Temperature instances to test the bounds of values
        cls.temp_below_0 = Temperature(
            measurement=None,
            sensor="Test Sensor",
            value=-0.1,
            time_waited=timedelta(seconds=1),
        )
        cls.temp_above_100 = Temperature(
            measurement=None,
            sensor="Test Sensor",
            value=100.1,
            time_waited=timedelta(seconds=1),
        )
        cls.temp_0 = Temperature(
            measurement=None,
            sensor="Test Sensor",
            value=-0.0,
            time_waited=timedelta(seconds=1),
        )

        cls.measurement_100 = Measurement(
            location=Point(1, 1),
            flag=False,
            water_source="well",
        )
        cls.temp_100 = Temperature(
            measurement=cls.measurement_100,
            sensor="Test Sensor",
            value=100.0,
            time_waited=timedelta(seconds=1),
        )

        # Temperature instances to test time_waited
        cls.temp_time_negative = Temperature(
            measurement=None,
            sensor="Test Sensor",
            value=25.0,
            time_waited=timedelta(seconds=-1),
        )

        # Measurement and Temperature instances to test flagging
        cls.measurement_flagged = Measurement(
            location=None,
            flag=False,
            water_source="well",
        )
        cls.measurement_not_flagged = Measurement(
            location=None,
            flag=False,
            water_source="well",
        )
        cls.temp_not_flagged = Temperature(
            measurement=cls.measurement_not_flagged,
            sensor="Test Sensor",
            value=40.0,
            time_waited=timedelta(seconds=1),
        )
        cls.temp_flagged = Temperature(
            measurement=cls.measurement_flagged,
            sensor="Test Sensor",
            value=40.1,
            time_waited=timedelta(seconds=1),
        )

    def test_temperature_lower_bound(self):
        """Tests that the clean method for the lower bound of temperature."""
        with self.assertRaises(ValidationError):
            self.temp_below_0.clean()

        self.temp_0.clean()
        assert self.temp_0.value == 0.0

    def test_temperature_upper_bound(self):
        """Tests that the clean method for the lower bound of temperature."""
        with self.assertRaises(ValidationError):
            self.temp_above_100.clean()

        self.temp_100.clean()
        assert self.temp_100.value == 100.0

    def test_time_waited_negative_throws_error(self):
        """Tests that the clean method raises a ValidationError for negative time waited."""
        with self.assertRaises(ValidationError):
            self.temp_time_negative.clean()

    def test_temperature_flagged(self):
        """Tests that the clean method sets the flag field correctly."""
        self.temp_flagged.clean()
        assert self.temp_flagged.measurement.flag is True

    def test_temperature_not_flagged(self):
        """Tests that the clean method does not set the flag field incorrectly."""
        self.temp_not_flagged.clean()
        assert self.temp_not_flagged.measurement.flag is False

    def test_temperature_persistance_correct_values(self):
        """Tests that the temperature instance is saved correctly."""
        self.measurement_100.save()
        temp = Temperature.objects.create(
            measurement=self.measurement_100,
            sensor="Persistent Sensor",
            value=25.5,
            time_waited=timedelta(minutes=1, seconds=30),
        )

        retrieved_temp = Temperature.objects.get(id=temp.id)

        assert retrieved_temp.sensor == "Persistent Sensor"
        assert retrieved_temp.value == 25.5
        assert retrieved_temp.time_waited == timedelta(minutes=1, seconds=30)
        assert retrieved_temp.measurement == self.measurement_100
