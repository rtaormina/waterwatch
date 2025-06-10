"""Tests for the MeasurementSerializer in measurement_export."""

from datetime import date, time, timedelta
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from django.test import TestCase
from django.utils import timezone
from measurements.models import Measurement, Temperature

from measurement_export.serializers import MeasurementSerializer

# Get the User model
User = get_user_model()


class TestMeasurementSerializer(TestCase):
    """A comprehensive test suite for the MeasurementSerializer.

    This suite tests each field and method of the serializer under various
    conditions to ensure its correctness, including all fallback logic paths
    and proper handling of the serializer context.
    """

    @classmethod
    def setUpTestData(cls):
        """Set up non-modified objects used by all test methods."""
        cls.user = User.objects.create(username="testuser")
        now = timezone.now()

        # Measurement 1: Has a temperature, flag is False
        cls.measurement1 = Measurement.objects.create(
            location=Point(5.2913, 52.1326),  # Netherlands
            local_date=date(2025, 6, 10),
            local_time=time(18, 1, 0),
            timestamp=now,
            flag=False,
            water_source="Tap",
            user=cls.user,
        )
        Temperature.objects.create(
            measurement=cls.measurement1,
            sensor="Digital Thermometer",
            value=Decimal("21.5"),
            time_waited=timedelta(seconds=30),
        )

        # Measurement 2: No metrics, flag is True
        cls.measurement2 = Measurement.objects.create(
            location=Point(-74.0060, 40.7128),  # New York
            local_date=date(2025, 6, 11),
            local_time=time(12, 0, 0),
            timestamp=now - timedelta(days=1),
            flag=True,
            water_source="Bottled",
            user=cls.user,
        )

    def setUp(self):
        # Patch the reverse-geocode fallback globally for each test
        self.patcher = patch(
            "measurement_export.utils.lookup_location", return_value={"country": "Mock", "continent": "Mock"}
        )
        self.mock_lookup = self.patcher.start()

    def tearDown(self):
        # Stop the patcher after each test
        self.patcher.stop()

    def test_basic_fields_serialization(self):
        """Test that basic model fields are serialized correctly."""
        serializer = MeasurementSerializer(instance=self.measurement1)
        data = serializer.data

        assert data["id"] == self.measurement1.id
        assert data["water_source"] == "Tap"
        assert data["user"] == self.user.id
        assert data["local_date"] == "2025-06-10"
        assert data["local_time"] == "18:01:00"
        # Ensure timestamp is a properly formatted string
        assert "2025-06-10T" in data["timestamp"]

    def test_get_flag_inversion(self):
        """Test that the 'flag' field is correctly inverted."""
        # Test case 1: flag is False, should become True
        serializer1 = MeasurementSerializer(instance=self.measurement1)
        assert serializer1.data["flag"]

        # Test case 2: flag is True, should become False
        serializer2 = MeasurementSerializer(instance=self.measurement2)
        assert not serializer2.data["flag"]

    def test_get_location_fallback_to_geos(self):
        """Test get_location falls back to the GEOS Point object."""
        serializer = MeasurementSerializer(instance=self.measurement1)
        expected_location = {
            "latitude": 52.1326,
            "longitude": 5.2913,
        }
        assert serializer.data["location"] == expected_location

    def test_get_location_prefers_annotated_values(self):
        """Test get_location prefers annotated 'latitude' and 'longitude'."""
        # Simulate annotation by adding attributes to the instance
        self.measurement1.latitude = 99.9
        self.measurement1.longitude = -99.9

        serializer = MeasurementSerializer(instance=self.measurement1)
        expected_location = {
            "latitude": 99.9,
            "longitude": -99.9,
        }
        # The serializer should use the annotated values, not the original Point
        assert serializer.data["location"] == expected_location

        # Clean up the instance for other tests
        del self.measurement1.latitude
        del self.measurement1.longitude

    def test_get_country_continent_with_annotation(self):
        """Test get_country/get_continent prefer annotated values."""
        self.measurement2.country = "USA"
        self.measurement2.continent = "North America"

        serializer = MeasurementSerializer(instance=self.measurement2)
        assert serializer.data["country"] == "USA"
        assert serializer.data["continent"] == "North America"

        del self.measurement2.country
        del self.measurement2.continent

    def test_get_country_continent_with_context_map(self):
        """Test get_country/get_continent using the context location_map."""
        key = (self.measurement2.location.x, self.measurement2.location.y)
        context = {"location_map": {key: {"country": "United States", "continent": "NA"}}}

        serializer = MeasurementSerializer(instance=self.measurement2, context=context)
        assert serializer.data["country"] == "United States"
        assert serializer.data["continent"] == "NA"

    def test_get_country_continent_with_reverse_geocode_fallback(self):
        """Test the final fallback to reverse-geocoding, which should be mocked."""
        # Configure the mock to return a predictable dictionary
        self.mock_lookup.return_value = {
            "country": "Mock Country",
            "continent": "Mock Continent",
        }

        serializer = MeasurementSerializer(instance=self.measurement2)
        data = serializer.data

        # Assert that the mock was called with the correct coordinates
        self.mock_lookup.assert_called_with(lat=40.7128, lon=-74.0060)

        # Assert that the serializer used the data from the mocked function
        assert data["country"] == "Mock Country"
        assert data["continent"] == "Mock Continent"

    def test_get_metrics_without_context(self):
        """Test that get_metrics returns an empty list if no context is provided."""
        serializer = MeasurementSerializer(instance=self.measurement1)
        assert serializer.data["metrics"] == []

    def test_get_metrics_with_empty_included_list(self):
        """Test that get_metrics returns empty list if 'included_metrics' is empty."""
        context = {"included_metrics": []}
        serializer = MeasurementSerializer(instance=self.measurement1, context=context)
        assert serializer.data["metrics"] == []

    def test_get_metrics_with_specific_included_metric(self):
        """Test get_metrics serializes data for an included metric."""
        # Mock METRIC_MODELS to ensure test isolation
        with patch("measurement_export.serializers.METRIC_MODELS", [Temperature]):
            context = {"included_metrics": ["temperature"]}
            serializer = MeasurementSerializer(instance=self.measurement1, context=context)
            metrics_data = serializer.data["metrics"]

            assert len(metrics_data) == 1
            temp_data = metrics_data[0]

            assert temp_data["metric_type"] == "temperature"
            # Verify correct serialization of Decimal to float
            assert temp_data["value"] == 21.5
            # Verify correct serialization of timedelta to seconds
            assert temp_data["time_waited"] == 30
            assert temp_data["sensor"] == "Digital Thermometer"

    def test_get_metrics_handles_measurement_with_no_metrics(self):
        """Test get_metrics returns empty list for a measurement with no metrics attached."""
        with patch("measurement_export.serializers.METRIC_MODELS", [Temperature]):
            context = {"included_metrics": ["temperature"]}
            # self.measurement2 has no temperature object attached
            serializer = MeasurementSerializer(instance=self.measurement2, context=context)
            assert serializer.data["metrics"] == []
