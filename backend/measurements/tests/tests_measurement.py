from django.contrib.gis.geos import Point
from django.core.exceptions import ValidationError
from django.test import TestCase

from measurements.models import Measurement


class MeasurementTest(TestCase):
    """Test cases for Temperature class."""

    @classmethod
    def setUpTestData(cls):
        """Set up test data for the test cases."""
        cls.measurement_with_location = Measurement(
            location=Point(1, 1),
            flag=False,
            water_source="WeLl",
        )

        cls.measurement_without_location = Measurement(
            location=None,
            flag=False,
            water_source="well",
        )

    def test_clean_measurement_with_location(self):
        """Test clean method with valid location (also tests capitalization)."""
        self.measurement_with_location.clean()
        assert self.measurement_with_location.water_source == "well"

    def test_clean_measurement_without_location(self):
        """Test clean method with invalid location."""
        with self.assertRaises(ValidationError):
            self.measurement_without_location.clean()

    def test_measurement_persistance(self):
        """Test persistance of measurement."""
        meas = Measurement.objects.create(
            location=Point(1, 2),
            flag=False,
            water_source="well",
        )

        retrieved_meas = Measurement.objects.get(id=meas.id)

        assert retrieved_meas.location == "SRID=4326;POINT (1 2)"
        assert not retrieved_meas.flag
        assert retrieved_meas.water_source == "well"
