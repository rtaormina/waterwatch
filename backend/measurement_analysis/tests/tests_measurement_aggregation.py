"""Tests for measurement collection Endpoints."""

from datetime import timedelta

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
            local_date="2025-11-01",
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
            local_date="2025-04-03",
            local_time="16:25:34",
        )
        cls.temperature3 = Temperature.objects.create(
            measurement=cls.measurement3,
            value=18.0,
            sensor="Test Sensor",
            time_waited=timedelta(seconds=1),
        )

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
        response = self.client.get(f"/api/measurements/aggregated/?boundary_geometry={boundary_geometry}")
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
        response = self.client.get(f"/api/measurements/aggregated/?boundary_geometry={boundary_geometry}")
        assert response.status_code == 200
        data = response.json()
        assert len(data["measurements"]) == 1
        assert data["count"] == 1
        assert data["measurements"][0]["location"]["latitude"] == 4.0
        assert data["measurements"][0]["location"]["longitude"] == 3.0
        assert data["measurements"][0]["count"] == 2
        assert data["measurements"][0]["avg_temperature"] == 19.0

    def test_invalid_boundary_geometry(self):
        """Test the handling of an invalid boundary geometry."""
        boundary_geometry = "INVALID_GEOMETRY"
        response = self.client.get(f"/api/measurements/aggregated/?boundary_geometry={boundary_geometry}")
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert data["error"] == "Invalid boundary_geometry"

    def test_calendar_month_filter(self):
        """Test that passing month=10 returns only October measurements."""
        response = self.client.get("/api/measurements/aggregated/?month=10")
        assert response.status_code == 200, response.content
        data = response.json()
        assert data["count"] == 1
        assert data["measurements"][0]["max_temperature"] == 20.0
        months = 0
        for m in data["measurements"]:
            months = months + m["count"]
        assert months == 1

    def test_calendar_months_filter(self):
        """Test that passing month=10,11 returns October and November measurements."""
        response = self.client.get("/api/measurements/aggregated/?month=10,11")
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 2
        assert data["measurements"][0]["max_temperature"] == 25.5
        assert data["measurements"][1]["max_temperature"] == 20.0

        months = 0
        for m in data["measurements"]:
            months = months + m["count"]
        assert months == 2

    def test_past_30_days_filter(self):
        """Test that passing month=0 returns only data from the last 30 days."""
        from datetime import timedelta

        from django.utils import timezone

        today = timezone.now().date()

        old = Measurement.objects.create(
            location="POINT(5 5)",
            local_date=(today - timedelta(days=40)).isoformat(),
            local_time="00:00:00",
        )
        recent = Measurement.objects.create(
            location="POINT(6 6)",
            local_date=(today - timedelta(days=10)).isoformat(),
            local_time="00:00:00",
        )

        Measurement.objects.filter(pk=old.pk).update(timestamp=(timezone.now() - timedelta(days=40)))
        Measurement.objects.filter(pk=recent.pk).update(timestamp=(timezone.now() - timedelta(days=10)))

        response = self.client.get("/api/measurements/aggregated/?month=0")
        assert response.status_code == 200, response.content
        data = response.json()

        locations = {(m["location"]["latitude"], m["location"]["longitude"]) for m in data["measurements"]}
        assert (6.0, 6.0) in locations
        assert (1.0, 2.0) not in locations
        assert (3.0, 4.0) not in locations
        assert (5.0, 5.0) not in locations

    def test_invalid_text_month_filter(self):
        """Test that passing non 1-12 parameters returns 400."""
        response = self.client.get("/api/measurements/aggregated/?month=0,abc10")
        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "Invalid month parameter; must be 0 or comma-separated 1-12"

    def test_invalid_out_of_range_month_filter(self):
        """Test that passing out of range parameters returns 400."""
        response = self.client.get("/api/measurements/aggregated/?month=13,-1")
        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "No valid month numbers provided; must be 0 or 1-12"

    def test_some_valid_month_filter(self):
        """Test that passing out of range parameters returns 400."""
        response = self.client.get("/api/measurements/aggregated/?month=13,-1,4")
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 1
        assert data["measurements"][0]["max_temperature"] == 18.0

        months = 0
        for m in data["measurements"]:
            months = months + m["count"]
        assert months == 1
