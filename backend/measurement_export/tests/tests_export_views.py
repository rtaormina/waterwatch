"""Test suite for measurement export views."""

import json
from datetime import date, time, timedelta
from unittest.mock import patch

from campaigns.models import Campaign
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib.gis.geos import Point
from django.db import connection
from django.http import HttpResponse
from django.test import TestCase
from measurements.models import Measurement, Temperature
from rest_framework.test import APIClient


class ViewsTestCase(TestCase):
    """Test case for measurement export views."""

    @classmethod
    def setUpTestData(cls):
        """Set up test data for the test cases."""
        user_model = get_user_model()

        # Create users with different permissions
        cls.superuser = user_model.objects.create_superuser(
            username="testsuperuser", email="superuser@example.com", password="superpassword"
        )

        cls.staff_user = user_model.objects.create_user(
            username="staffuser", email="staff@example.com", password="staffpassword", is_staff=True
        )

        cls.researcher_user = user_model.objects.create_user(
            username="researcher", email="researcher@example.com", password="researcherpassword"
        )

        cls.regular_user = user_model.objects.create_user(
            username="regularuser", email="regular@example.com", password="regularpassword"
        )

        # Create researcher group and add user
        cls.researcher_group = Group.objects.create(name="researcher")
        cls.researcher_user.groups.add(cls.researcher_group)

        # Create locations table with test data
        with connection.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS locations (
                    id SERIAL PRIMARY KEY,
                    country_name VARCHAR(44),
                    continent VARCHAR(23),
                    geom geometry
                );
            """)
            cursor.execute("DELETE FROM locations;")
            # Europe
            cursor.execute("""
                INSERT INTO locations (country_name, continent, geom) VALUES
                ('Netherlands', 'Europe', ST_GeomFromText('POLYGON((3 51, 8 51, 8 54, 3 54, 3 51))', 4326)),
                ('Germany',    'Europe', ST_GeomFromText('POLYGON((8.1 47, 15 47, 15 55, 8.1 55, 8.1 47))', 4326)),
                ('France',     'Europe', ST_GeomFromText('POLYGON((-5 42, 8 42, 8 51, -5 51, -5 42))', 4326));
            """)
            # North America
            cursor.execute("""
                INSERT INTO locations (country_name, continent, geom) VALUES
                ('USA', 'North America', ST_GeomFromText('POLYGON((-125 25, -65 25, -65 49, -125 49, -125 25))', 4326)),
                ('Canada', 'North America', ST_GeomFromText('POLYGON((-140 41, -50 41, -50 83, -140 83, -140 41))', 4326));
            """)
            # Asia
            cursor.execute("""
                INSERT INTO locations (country_name, continent, geom) VALUES
                ('Japan', 'Asia', ST_GeomFromText('POLYGON((129 30, 146 30, 146 46, 129 46, 129 30))', 4326)),
                ('China', 'Asia', ST_GeomFromText('POLYGON((73 18, 135 18, 135 54, 73 54, 73 18))', 4326));
            """)

        # Create campaigns
        cls.campaign1 = Campaign.objects.create(
            name="Test Campaign",
            description="Test campaign description",
            start_time="2024-01-01T00:00:00Z",
            end_time="2024-12-31T23:59:59Z",
            region="MULTIPOLYGON(((0 0, 1 0, 1 1, 0 1, 0 0)))",
        )
        cls.campaign2 = Campaign.objects.create(
            name="Temperature Research",
            description="Temperature measurements",
            start_time="2024-01-01T00:00:00Z",
            end_time="2024-12-31T23:59:59Z",
            region="MULTIPOLYGON(((0 0, 1 0, 1 1, 0 1, 0 0)))",
        )

        # Create test measurements
        cls.measurement_netherlands = Measurement.objects.create(
            location=Point(5.5, 52.5),
            flag=False,
            water_source="network",
            local_date=date(2024, 1, 15),
            local_time=time(9, 30),
            user=cls.regular_user,
        )
        cls.measurement_netherlands.campaigns.add(cls.campaign1)

        cls.measurement_germany = Measurement.objects.create(
            location=Point(10, 50),
            flag=True,
            water_source="well",
            local_date=date(2024, 1, 20),
            local_time=time(14, 45),
            user=cls.researcher_user,
        )
        cls.measurement_germany.campaigns.add(cls.campaign1, cls.campaign2)

        cls.measurement_usa = Measurement.objects.create(
            location=Point(-100, 40),
            flag=False,
            water_source="rooftop tank",
            local_date=date(2024, 2, 1),
            local_time=time(22, 15),
            user=cls.staff_user,
        )

        cls.measurement_japan = Measurement.objects.create(
            location=Point(140, 35),
            flag=True,
            water_source="other",
            local_date=date(2024, 2, 10),
            local_time=time(6, 0),
            user=cls.superuser,
        )
        cls.measurement_japan.campaigns.add(cls.campaign2)

        # Create temperature measurements
        cls.temp_cold = Temperature.objects.create(
            measurement=cls.measurement_netherlands,
            sensor="Digital Thermometer",
            value=12.5,
            time_waited=timedelta(seconds=30),
        )
        cls.temp_warm = Temperature.objects.create(
            measurement=cls.measurement_germany,
            sensor="Analog Thermometer",
            value=25.0,
            time_waited=timedelta(seconds=45),
        )
        cls.temp_hot = Temperature.objects.create(
            measurement=cls.measurement_usa,
            sensor="Digital Thermometer",
            value=35.8,
            time_waited=timedelta(seconds=30),
        )
        cls.temp_very_hot = Temperature.objects.create(
            measurement=cls.measurement_japan,
            sensor="IR Thermometer",
            value=45.2,
            time_waited=timedelta(seconds=15),
        )

    def setUp(self):
        """Set up for each test."""
        self.client = APIClient()

    # Location List View Tests

    def test_location_list_returns_countries_by_continent(self):
        """Test that location_list returns countries grouped by continent."""
        response = self.client.get("/api/locations/")
        assert response.status_code == 200
        data = response.json()

        # Continents present
        assert "Europe" in data
        assert "North America" in data
        assert "Asia" in data
        # Specific countries
        assert set(data["Europe"]) == {"France", "Germany", "Netherlands"}
        assert set(data["North America"]) == {"USA", "Canada"}
        assert set(data["Asia"]) == {"Japan", "China"}

    def test_location_list_empty_database(self):
        """Test location_list with empty locations table."""
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM locations;")
        response = self.client.get("/api/locations/")
        assert response.status_code == 200
        assert response.json() == {}

    # Export All View Tests

    def test_export_all_view_returns_all_measurements(self):
        """Test that export_all_view returns all measurements with complete data."""
        response = self.client.get("/api/measurements/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 4  # four points inside polygons

        # Check keys on a sample measurement
        keys = set(data[0].keys())
        expected = {
            "id",
            "timestamp",
            "local_date",
            "local_time",
            "flag",
            "water_source",
            "user_id",
            "country",
            "continent",
            "latitude",
            "longitude",
            "metrics",
            "campaigns",
        }
        assert expected.issubset(keys)

    def test_export_all_view_includes_geographic_data(self):
        """Test that measurements include correct geographic annotations."""
        data = self.client.get("/api/measurements/").json()
        nl = next(m for m in data if m["country"] == "Netherlands")
        assert nl["continent"] == "Europe"
        assert nl["latitude"] == 52.5
        assert nl["longitude"] == 5.5

    def test_export_all_view_includes_metrics(self):
        """Test that measurements include associated metrics."""
        data = self.client.get("/api/measurements/").json()
        meas = next(m for m in data if m["metrics"])
        temp = next(x for x in meas["metrics"] if x["metric_type"] == "temperature")
        assert all(k in temp for k in ("value", "sensor", "time_waited"))

    def test_export_all_view_includes_campaigns(self):
        """Test that measurements include associated campaigns."""
        data = self.client.get("/api/measurements/").json()
        meas = next(m for m in data if m["campaigns"])
        assert isinstance(meas["campaigns"], list)
        assert meas["campaigns"]

    def test_export_all_view_with_boundary_geometry(self):
        """Test export_all_view with boundary geometry filter."""
        poly = "POLYGON((0 40, 20 40, 20 60, 0 60, 0 40))"
        data = self.client.get("/api/measurements/", {"boundary_geometry": poly}).json()
        assert {m["continent"] for m in data} == {"Europe"}

    def test_export_all_view_invalid_boundary_geometry(self):
        """Test export_all_view with invalid boundary geometry."""
        resp = self.client.get("/api/measurements/", {"boundary_geometry": "INVALID_GEOMETRY"})
        assert resp.status_code == 400
        assert "Invalid boundary_geometry format" in resp.json().get("error", "")

    def test_export_all_view_ordered_results(self):
        """Test that export_all_view returns results ordered by ID."""
        data = self.client.get("/api/measurements/").json()
        ids = [m["id"] for m in data]
        assert ids == sorted(ids)

    # Search Measurements View Tests

    def test_search_measurements_view_returns_statistics(self):
        """Test search_measurements_view returns count and average temperature."""
        resp = self.client.post("/api/measurements/search/", json.dumps({}), content_type="application/json")
        result = resp.json()
        assert resp.status_code == 200
        assert result["count"] == 4
        assert result["avgTemp"] > 0

    def test_search_measurements_view_with_filters(self):
        """Test search_measurements_view filters by continent correctly."""
        payload = {"location[continents]": ["Europe"]}
        result = self.client.post(
            "/api/measurements/search/", json.dumps(payload), content_type="application/json"
        ).json()
        # Netherlands + Germany
        assert result["count"] == 2

    def test_search_measurements_view_csv_export_permission_denied(self):
        """Test CSV export requires researcher permissions."""
        self.client.force_authenticate(user=self.regular_user)
        resp = self.client.post(
            "/api/measurements/search/", json.dumps({"format": "csv"}), content_type="application/json"
        )
        assert resp.status_code == 403
        assert "Forbidden" in resp.json().get("error", "")

    def test_search_measurements_view_csv_export_researcher_access(self):
        """Test CSV export works for researcher users."""
        self.client.force_authenticate(user=self.researcher_user)
        with patch("measurement_export.views.get_strategy") as mock_get_strategy:
            strat = mock_get_strategy.return_value
            strat.export.return_value = HttpResponse("CSV_DATA")

            self.client.post(
                "/api/measurements/search/", json.dumps({"format": "csv"}), content_type="application/json"
            )

            mock_get_strategy.assert_called_once_with("csv")
            strat.export.assert_called_once()

    def test_search_measurements_view_csv_export_staff_access(self):
        """Test CSV export works for staff users."""
        self.client.force_authenticate(user=self.staff_user)
        with patch("measurement_export.views.get_strategy") as mock_get_strategy:
            strat = mock_get_strategy.return_value
            strat.export.return_value = HttpResponse("CSV_DATA")

            self.client.post(
                "/api/measurements/search/", json.dumps({"format": "csv"}), content_type="application/json"
            )

            mock_get_strategy.assert_called_once_with("csv")

    def test_search_measurements_view_csv_export_superuser_access(self):
        """Test CSV export works for superusers."""
        self.client.force_authenticate(user=self.superuser)
        with patch("measurement_export.views.get_strategy") as mock_get_strategy:
            strat = mock_get_strategy.return_value
            strat.export.return_value = HttpResponse("CSV_DATA")

            self.client.post(
                "/api/measurements/search/", json.dumps({"format": "csv"}), content_type="application/json"
            )

            mock_get_strategy.assert_called_once_with("csv")

    def test_search_measurements_view_all_export_formats(self):
        """Test that all export formats are handled."""
        self.client.force_authenticate(user=self.researcher_user)
        for fmt in ["csv", "json", "xml", "geojson"]:
            with patch("measurement_export.views.get_strategy") as mock_get_strategy:
                strat = mock_get_strategy.return_value
                strat.export.return_value = HttpResponse(f"{fmt.upper()}_DATA")

                self.client.post(
                    "/api/measurements/search/", json.dumps({"format": fmt}), content_type="application/json"
                )
                mock_get_strategy.assert_called_once_with(fmt)

    def test_search_measurements_view_included_metrics_validation(self):
        """Test that measurements_included parameter is validated."""
        self.client.force_authenticate(user=self.researcher_user)
        with patch("measurement_export.views.get_strategy") as mock_get_strategy:
            strat = mock_get_strategy.return_value
            strat.export.return_value = HttpResponse("CSV_DATA")

            self.client.post(
                "/api/measurements/search/",
                json.dumps({"format": "csv", "measurements_included": "not_a_list"}),
                content_type="application/json",
            )
            strat.export.assert_called_once()
            args, kwargs = strat.export.call_args
            assert "metrics" in kwargs["extra_data"]

    def test_search_measurements_view_invalid_json(self):
        """Test search_measurements_view with invalid JSON."""
        resp = self.client.post("/api/measurements/search/", "INVALID_JSON", content_type="application/json")
        assert resp.status_code == 400
        assert "Invalid JSON" in resp.json().get("error", "")

    def test_search_measurements_view_empty_body(self):
        """Test search_measurements_view with empty request body."""
        resp = self.client.post("/api/measurements/search/", "", content_type="application/json")
        result = resp.json()
        assert resp.status_code == 200
        assert "count" in result
        assert "avgTemp" in result

    # Helper Function Tests

    def test_build_base_queryset_ordered(self):
        """Test build_base_queryset with ordering."""
        from measurement_export.views import build_base_queryset

        qs = build_base_queryset(ordered=True)
        assert qs.ordered

    def test_build_base_queryset_unordered(self):
        """Test build_base_queryset without ordering."""
        from measurement_export.views import build_base_queryset

        qs = build_base_queryset(ordered=False)
        assert not qs.ordered

    def test_apply_location_annotations(self):
        """Test apply_location_annotations adds geographic fields."""
        from measurement_export.views import apply_location_annotations, build_base_queryset

        qs = build_base_queryset()
        qs = apply_location_annotations(qs)
        m = qs.first()
        assert hasattr(m, "country")
        assert hasattr(m, "continent")
        assert hasattr(m, "latitude")
        assert hasattr(m, "longitude")

    def test_fetch_metrics_for_measurements(self):
        """Test fetch_metrics_for_measurements returns correct structure."""
        from measurement_export.views import fetch_metrics_for_measurements

        ids = [self.measurement_netherlands.id, self.measurement_germany.id]
        metrics = fetch_metrics_for_measurements(ids)
        assert set(metrics.keys()) == set(ids)
        for lst in metrics.values():
            for metric in lst:
                assert "metric_type" in metric

    def test_fetch_campaigns_for_measurements(self):
        """Test fetch_campaigns_for_measurements returns correct structure."""
        from measurement_export.views import fetch_campaigns_for_measurements

        ids = [self.measurement_netherlands.id, self.measurement_germany.id]
        campaigns = fetch_campaigns_for_measurements(ids)
        assert "Test Campaign" in campaigns[self.measurement_netherlands.id]
        assert "Temperature Research" in campaigns[self.measurement_germany.id]

    def test_prepare_measurement_data(self):
        """Test prepare_measurement_data combines all data correctly."""
        from measurement_export.views import (
            apply_location_annotations,
            build_base_queryset,
            prepare_measurement_data,
        )

        qs = build_base_queryset()
        qs = apply_location_annotations(qs)
        data = prepare_measurement_data(qs)
        assert isinstance(data, list)
        assert data
        for field in [
            "id",
            "timestamp",
            "local_date",
            "local_time",
            "flag",
            "water_source",
            "user_id",
            "country",
            "continent",
            "latitude",
            "longitude",
            "metrics",
            "campaigns",
        ]:
            assert field in data[0]

    # Edge Cases and Error Handling

    def test_export_all_view_no_measurements(self):
        """Test export_all_view when no measurements exist."""
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM measurements_temperature;")
            cursor.execute("DELETE FROM measurements_measurement_campaigns;")
            cursor.execute("DELETE FROM measurements_measurement;")
        resp = self.client.get("/api/measurements/")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_search_measurements_view_no_matching_measurements(self):
        """Test search with unrecognized continent yields all measurements."""
        payload = {"location[continents]": ["Antarctica"]}
        resp = self.client.post("/api/measurements/search/", json.dumps(payload), content_type="application/json")
        result = resp.json()
        # "Antarctica" is ignored; all 4 measurements returned
        assert result["count"] == 4
        assert result["avgTemp"] > 0

    def test_measurements_without_temperature(self):
        """Test handling of measurements without temperature metrics."""
        # Create a measurement outside any country polygon
        mt = Measurement.objects.create(
            location=Point(0, 0),
            flag=False,
            water_source="network",
            local_date=date(2024, 3, 1),
            local_time=time(12, 0),
            user=self.regular_user,
        )
        data = self.client.get("/api/measurements/").json()
        ids = [m["id"] for m in data]
        # It should be dropped by the inner join annotation
        assert mt.id not in ids
