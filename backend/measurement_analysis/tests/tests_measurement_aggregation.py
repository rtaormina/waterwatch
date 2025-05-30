"""Tests for measurement collection Endpoints."""

from datetime import date, timedelta

from django.db import connection
from django.test import TestCase
from measurements.models import Measurement, Temperature


class MeasurementAnalysisTests(TestCase):
    """Test cases for measurement collection Endpoints."""

    @classmethod
    def setUp(cls):
        """Set up test data."""
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
                    ST_GeomFromText('POLYGON((0 0, 5 0, 5 5, 0 5, 0 0))', 4326)
                );
            """)
        cls.measurement = Measurement.objects.create(
            location="POINT(1.0 2.0)",
            local_date="2025-10-01",
            local_time="12:34:56",
        )
        cls.temperature = Temperature.objects.create(
            measurement=cls.measurement,
            value=25.5,
            sensor="Test Sensor",
            time_waited=timedelta(seconds=1),
        )
        cls.measurement2 = Measurement.objects.create(
            location="POINT(3.0 4.0)",
            local_date="2025-10-02",
            local_time="14:25:36",
        )
        cls.temperature2 = Temperature.objects.create(
            measurement=cls.measurement2,
            value=20.0,
            sensor="Test Sensor",
            time_waited=timedelta(seconds=1),
        )
        cls.measurement3 = Measurement.objects.create(
            location="POINT(3.0 4.0)",
            local_date="2025-10-03",
            local_time="16:25:34",
        )
        cls.temperature3 = Temperature.objects.create(
            measurement=cls.measurement3,
            value=18.0,
            sensor="Test Sensor",
            time_waited=timedelta(seconds=1),
        )

    def test_get_view(self):
        """Test the retrieval of all measurement."""
        response = self.client.get("/api/measurements/")
        assert response.status_code == 200
        data = response.json()
        assert data[0]["location"]["latitude"] == 2.0
        assert data[0]["location"]["longitude"] == 1.0
        assert data[0]["local_date"] == (date(2025, 10, 1)).isoformat()
        assert data[0]["metrics"][0]["value"] == 25.5
        assert data[1]["location"]["latitude"] == 4.0
        assert data[1]["location"]["longitude"] == 3.0
        assert data[1]["local_date"] == (date(2025, 10, 2)).isoformat()
        assert data[1]["metrics"][0]["value"] == 20.0
        assert data[2]["location"]["latitude"] == 4.0
        assert data[2]["location"]["longitude"] == 3.0
        assert data[2]["local_date"] == (date(2025, 10, 3)).isoformat()
        assert data[2]["metrics"][0]["value"] == 18.0

    def test_measurement_aggregation(self):
        """Test the aggregation of measurements."""
        response = self.client.get("/api/measurements/aggregated/")
        assert response.status_code == 200
        data = response.json()
        assert "measurements" in data
        assert len(data["measurements"]) == 2
        assert data["count"] == 2
        assert data["measurements"][0]["location"]["latitude"] == 4.0
        assert data["measurements"][0]["location"]["longitude"] == 3.0
        assert data["measurements"][0]["count"] == 2
        assert data["measurements"][0]["avg_temperature"] == 19.0
        assert data["measurements"][1]["location"]["latitude"] == 2.0
        assert data["measurements"][1]["location"]["longitude"] == 1.0
        assert data["measurements"][1]["count"] == 1
        assert data["measurements"][1]["avg_temperature"] == 25.5

    def test_measurement_within_boundary(self):
        """Test the retrieval of measurements within a specified boundary."""
        boundary_geometry = "POLYGON((0 0, 0 3, 3 3, 3 0, 0 0))"
        response = self.client.get(f"/api/measurements/aggregated/?boundry_geometry={boundary_geometry}")
        assert response.status_code == 200
        data = response.json()
        assert "measurements" in data
        assert len(data["measurements"]) == 1
        assert data["count"] == 1
        assert data["measurements"][0]["location"]["latitude"] == 2.0
        assert data["measurements"][0]["location"]["longitude"] == 1.0
        assert data["measurements"][0]["count"] == 1
        assert data["measurements"][0]["avg_temperature"] == 25.5

    def test_measurement_multiple_in_boundary_with_aggregation(self):
        """Test the retrieval of multiple measurements in a different specified boundary with aggregation."""
        boundary_geometry = "POLYGON((2 2, 2 5, 5 5, 5 2, 2 2))"
        response = self.client.get(f"/api/measurements/aggregated/?boundry_geometry={boundary_geometry}")
        assert response.status_code == 200
        data = response.json()
        assert len(data["measurements"]) == 1
        assert data["count"] == 1
        assert data["measurements"][0]["location"]["latitude"] == 4.0
        assert data["measurements"][0]["location"]["longitude"] == 3.0
        assert data["measurements"][0]["count"] == 2
        assert data["measurements"][0]["avg_temperature"] == 19.0

    def test_measurement_multiple_in_boundary(self):
        """Test the retrieval of multiple measurements in a different specified boundary."""
        boundary_geometry = "POLYGON((2 2, 2 5, 5 5, 5 2, 2 2))"
        response = self.client.get(f"/api/measurements/?boundry_geometry={boundary_geometry}")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

        # Check the first measurement
        assert data[0]["location"]["latitude"] == 4.0
        assert data[0]["location"]["longitude"] == 3.0
        assert data[0]["local_date"] == "2025-10-02"
        assert data[0]["metrics"][0]["value"] == 20.0

        # Check the second measurement
        assert data[1]["location"]["latitude"] == 4.0
        assert data[1]["location"]["longitude"] == 3.0
        assert data[1]["local_date"] == "2025-10-03"
        assert data[1]["metrics"][0]["value"] == 18.0

    def test_invalid_boundary_geometry(self):
        """Test the handling of an invalid boundary geometry."""
        boundary_geometry = "INVALID_GEOMETRY"
        response = self.client.get(f"/api/measurements/aggregated/?boundry_geometry={boundary_geometry}")
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert data["error"] == "Invalid boundry_geometry format"
