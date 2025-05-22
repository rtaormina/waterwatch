"""Tests for exporting serializers."""

from datetime import UTC, datetime, timedelta

from django.contrib.gis.geos import Point
from django.db import connection
from django.test import TestCase
from measurements.models import Measurement, Temperature

from measurement_export.serializers import MeasurementSerializer


class SerializerTests(TestCase):
    """Test cases for exporting serializers."""

    @classmethod
    def setUpTestData(cls):
        """Set up test data for the test cases."""
        with connection.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS locations (
                    id SERIAL PRIMARY KEY,
                    country_name VARCHAR(44),
                    continent VARCHAR(23),
                    geom geometry
                );
            """)
            cursor.execute("""
                INSERT INTO locations (country_name, continent, geom)
                VALUES (
                    'Netherlands',
                    'Europe',
                    ST_GeomFromText('POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))', 4326)
                );
            """)

        cls.measurement = Measurement.objects.create(
            location=Point(0.5, 0.5),
            timestamp="2025-05-21T17:34:03.283652+02:00",
            flag=False,
            water_source="Well",
        )
        cls.temperature = Temperature.objects.create(
            measurement=cls.measurement,
            sensor="Test Sensor",
            value=40.0,
            time_waited=timedelta(seconds=1),
        )
        cls.measurement2 = Measurement.objects.create(
            location=Point(0.5, 0.5),
            timestamp="2025-05-21T17:34:03.283652+02:00",
            flag=True,
            water_source="tap",
        )
        cls.temperature2 = Temperature.objects.create(
            measurement=cls.measurement2,
            sensor="Second Test Sensor",
            value=40.1,
            time_waited=timedelta(seconds=1),
        )

        cls.serializer = MeasurementSerializer(instance=cls.measurement)

    def test_get_location(self):
        """Test the location field."""
        expected_location = {
            "latitude": self.measurement.location.y,
            "longitude": self.measurement.location.x,
        }
        assert self.serializer.data["location"] == expected_location

    def test_get_country(self):
        """Test the country field."""
        expected_country = "Netherlands"
        assert self.serializer.data["country"] == expected_country

    def test_get_continent(self):
        """Test the continent field."""
        expected_continent = "Europe"
        assert self.serializer.data["continent"] == expected_continent

    def test_get_metrics(self):
        """Test the metrics field."""
        expected_metrics = [
            {
                "metric_type": "temperature",
                "sensor": self.temperature.sensor,
                "value": self.temperature.value,
                "time_waited": self.temperature.time_waited.total_seconds(),
            }
        ]
        assert self.serializer.data["metrics"] == expected_metrics

    def test_export_serializing(self):
        """Test the export of serialized data."""
        expected_data = [
            {
                "id": self.measurement.id,
                "timestamp": self.measurement.timestamp.astimezone(datetime.now(UTC).astimezone().tzinfo).isoformat(),
                "location": {
                    "latitude": self.measurement.location.y,
                    "longitude": self.measurement.location.x,
                },
                "flag": self.measurement.flag,
                "water_source": self.measurement.water_source,
                "campaigns": [],
                "user": self.measurement.user,
                "country": "Netherlands",
                "continent": "Europe",
                "metrics": [
                    {
                        "metric_type": "temperature",
                        "sensor": self.temperature.sensor,
                        "value": self.temperature.value,
                        "time_waited": self.temperature.time_waited.total_seconds(),
                    }
                ],
            },
            {
                "id": self.measurement2.id,
                "timestamp": self.measurement2.timestamp.astimezone(datetime.now(UTC).astimezone().tzinfo).isoformat(),
                "location": {
                    "latitude": self.measurement2.location.y,
                    "longitude": self.measurement2.location.x,
                },
                "flag": self.measurement2.flag,
                "water_source": self.measurement2.water_source,
                "campaigns": [],
                "user": self.measurement2.user,
                "country": "Netherlands",
                "continent": "Europe",
                "metrics": [
                    {
                        "metric_type": "temperature",
                        "sensor": self.temperature2.sensor,
                        "value": self.temperature2.value,
                        "time_waited": self.temperature2.time_waited.total_seconds(),
                    }
                ],
            },
        ]

        objects = Measurement.objects.all()
        data = MeasurementSerializer(objects, many=True).data

        assert data == expected_data
