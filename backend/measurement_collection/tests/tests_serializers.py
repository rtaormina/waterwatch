"""Unit tests for serializers in the measurement collection app."""

from datetime import timedelta

from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from django.test import TestCase
from measurements.models import Campaign

from measurement_collection.serializers import MeasurementSerializer, TemperatureSerializer


class SerializerTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        """Set up test data for the tests."""
        Campaign.objects.create(
            name="Test Campaign",
            start_time="2025-05-15T00:00:00Z",
            end_time="2025-06-16T00:00:00Z",
            region=MultiPolygon(Polygon(((0, 0), (1, 0), (1, 1), (0, 1), (0, 0)))),
        )
        Campaign.objects.create(
            name="Wrong Campaign",
            start_time="2025-05-17T00:00:00Z",
            end_time="2025-06-18T00:00:00Z",
            region=MultiPolygon(Polygon(((0, 0), (1, 0), (1, 1), (0, 1), (0, 0)))),
        )

        cls.json_temp = {"sensor": "Test", "value": 25.0, "time_waited": timedelta(minutes=1)}
        cls.json_measurement_below_40 = {
            "timestamp_local": "2025-05-20T12:00:00Z",
            "location": Point(12.34567, 54.32109),
            "water_source": "well",
            "temperature": {"sensor": "Test Sensor", "value": 40.0, "time_waited": "00:01:00"},
        }
        cls.json_measurement_above_40 = {
            "timestamp_local": "2025-05-10T12:00:00Z",
            "location": Point(12.34567, 54.32109),
            "water_source": "well",
            "temperature": {"sensor": "Test Sensor", "value": 40.1, "time_waited": "00:01:00"},
        }
        cls.json_measurement_with_campaign = {
            "timestamp_local": "2025-05-15T12:00:00Z",
            "location": Point(0.5, 0.5),
            "water_source": "well",
            "temperature": {"sensor": "Test Sensor", "value": 40.0, "time_waited": "00:01:00"},
        }
        cls.measurement_serializer = MeasurementSerializer(data=cls.json_measurement_below_40)
        cls.temperature_serializer = TemperatureSerializer(data=cls.json_temp)

    def test_temperature_serializer(self):
        """Test the TemperatureSerializer."""
        assert self.temperature_serializer.is_valid(), self.temperature_serializer.errors

    def test_measurement_serializer_rounds_correctly(self):
        """Test the MeasurementSerializer rounds the location coordinates correctly."""
        assert self.measurement_serializer.is_valid(), self.measurement_serializer.errors
        measurement = self.measurement_serializer.save()

        assert measurement.location.x == round(12.34567, 3)
        assert measurement.location.y == round(54.32109, 3)

    def test_measurement_serializer_flags_correctly(self):
        """Test the MeasurementSerializer flags the measurement correctly."""
        assert self.measurement_serializer.is_valid(), self.measurement_serializer.errors
        measurement = self.measurement_serializer.save()
        assert measurement.flag

        self.measurement_serializer = MeasurementSerializer(data=self.json_measurement_above_40)

        assert self.measurement_serializer.is_valid(), self.measurement_serializer.errors
        measurement = self.measurement_serializer.save()
        assert not measurement.flag

    def test_measurement_serializer_campaign(self):
        """Test the MeasurementSerializer assigns the correct campaign."""
        assert self.measurement_serializer.is_valid(), self.measurement_serializer.errors
        measurement = self.measurement_serializer.save()
        assert measurement.campaigns.count() == 0

        self.measurement_serializer = MeasurementSerializer(data=self.json_measurement_with_campaign)
        assert self.measurement_serializer.is_valid(), self.measurement_serializer.errors
        measurement = self.measurement_serializer.save()
        assert measurement.campaigns.count() == 1
        assert measurement.campaigns.first().name == "Test Campaign"
