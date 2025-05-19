from datetime import datetime
from zoneinfo import ZoneInfo

from django.contrib.gis.geos import Point
from django.test import TestCase

from measurements.models import Measurement


class MeasurementTest(TestCase):
    """Test cases for Temperature class."""

    @classmethod
    def setUpTestData(cls):
        """Set up test data for the test cases."""
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

        cls.original_tz = datetime(2023, 10, 1, 20, 0, tzinfo=ZoneInfo("America/New_York"))

        cls.timezone1 = Measurement(
            location=Point(3, 3),
            flag=True,
            timestamp="2023-10-01T12:00:00",
            timestamp_local=cls.original_tz,
            water_source="tap",
        )

    def test_measurement_persistance(self):
        """Test persistance of measurement."""
        retrieved_meas1 = Measurement.objects.get(id=self.measurement1.id)

        assert retrieved_meas1.location == self.measurement1.location
        assert retrieved_meas1.flag == self.measurement1.flag
        assert retrieved_meas1.water_source == self.measurement1.water_source

        retrieved_meas2 = Measurement.objects.get(id=self.measurement2.id)

        assert retrieved_meas2.location == self.measurement2.location
        assert retrieved_meas2.flag == self.measurement2.flag
        assert retrieved_meas2.water_source == self.measurement2.water_source

    def test_measurement_timezone(self):
        """Test timezone data persistance."""
        retrieved_meas1 = Measurement.objects.get(id=self.timezone1.id)

        assert retrieved_meas1.timestamp == self.timezone1.timestamp
        assert retrieved_meas1.timestamp_local == self.original_tz
