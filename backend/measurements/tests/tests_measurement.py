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
