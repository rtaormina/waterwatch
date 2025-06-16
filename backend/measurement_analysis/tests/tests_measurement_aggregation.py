"""Comprehensive test cases for measurement analysis endpoints."""

import json
from datetime import UTC, datetime, timedelta
from unittest.mock import patch

from django.core.cache import cache
from django.db import connection
from django.test import TestCase
from django.utils import timezone
from measurements.models import Measurement, Temperature


class MeasurementAnalysisBaseTest(TestCase):
    """Base test class with common setup for measurement analysis tests."""

    @classmethod
    def setUpClass(cls):
        """Set up test data that persists across all tests."""
        super().setUpClass()
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

    def setUp(self):
        """Set up test data for each test."""
        # Clear cache before each test
        cache.clear()

        # Create measurements with specific dates for predictable testing
        # November 2025 measurement
        self.measurement_nov = Measurement.objects.create(
            location="POINT(1.0 2.0)",
            local_date="2025-11-01",
            local_time="12:34:56",
            timestamp=datetime(2025, 11, 1, 12, 34, 56, tzinfo=UTC),
        )
        self.temperature_nov = Temperature.objects.create(
            measurement=self.measurement_nov,
            value=25.5,
            sensor="Test Sensor",
            time_waited=timedelta(seconds=1),
        )

        # October 2025 measurement
        self.measurement_oct = Measurement.objects.create(
            location="POINT(3.0 4.0)",
            local_date="2025-10-02",
            local_time="14:25:36",
            timestamp=datetime(2025, 10, 2, 14, 25, 36, tzinfo=UTC),
        )
        self.temperature_oct = Temperature.objects.create(
            measurement=self.measurement_oct,
            value=20.0,
            sensor="Test Sensor",
            time_waited=timedelta(seconds=1),
        )

        # April 2025 measurement (older)
        self.measurement_apr = Measurement.objects.create(
            location="POINT(3.0 4.0)",
            local_date="2025-04-03",
            local_time="16:25:34",
            timestamp=datetime(2025, 4, 3, 16, 25, 34, tzinfo=UTC),
        )
        self.temperature_apr = Temperature.objects.create(
            measurement=self.measurement_apr,
            value=18.0,
            sensor="Test Sensor",
            time_waited=timedelta(seconds=1),
        )


class AnalyzedMeasurementsViewTests(MeasurementAnalysisBaseTest):
    """Test suite for the analyzed_measurements_view."""

    def test_post_request_success(self):
        """Test successful POST request to analyzed measurements endpoint."""
        response = self.client.post(
            "/api/measurements/aggregated/", data=json.dumps({}), content_type="application/json"
        )

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "measurements" in data
        assert "count" in data
        assert "status" in data
        assert data["status"] == "success"


class MeasurementAggregationBasicTests(MeasurementAnalysisBaseTest):
    """Test basic aggregation functionality."""

    def test_measurement_aggregation_groups_by_location_and_month(self):
        """Test that aggregation correctly groups by location AND month."""
        response = self.client.post(
            "/api/measurements/aggregated/", data=json.dumps({}), content_type="application/json"
        )

        assert response.status_code == 200
        data = response.json()

        # Groups by location AND month, so we expect 3 groups:
        # - Point(3,4) in October (1 measurement)
        # - Point(3,4) in April (1 measurement)
        # - Point(1,2) in November (1 measurement)
        assert len(data["measurements"]) == 3
        assert data["count"] == 3

        # Verify each group has count=1 since they're grouped by location+month
        for measurement in data["measurements"]:
            assert measurement["count"] == 1
            # Verify required fields exist
            assert "location" in measurement
            assert "avg_temperature" in measurement
            assert "min_temperature" in measurement
            assert "max_temperature" in measurement
            assert "latitude" in measurement["location"]
            assert "longitude" in measurement["location"]

    def test_aggregation_values_accuracy_multiple_measurements_same_location_month(self):
        """Test that aggregation calculations are accurate with multiple measurements."""
        # Create another measurement at same location in same month as October measurement
        measurement_oct_2 = Measurement.objects.create(
            location="POINT(3.0 4.0)",  # Same location as measurement_oct
            local_date="2025-10-15",  # Same month as measurement_oct
            local_time="16:25:34",
            timestamp=datetime(2025, 10, 15, 16, 25, 34, tzinfo=UTC),
        )
        Temperature.objects.create(
            measurement=measurement_oct_2,
            value=30.0,  # Different temperature
            sensor="Test Sensor",
            time_waited=timedelta(seconds=1),
        )

        response = self.client.post(
            "/api/measurements/aggregated/",
            data=json.dumps({"month": 10}),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()

        # Should have one aggregated result for the location in October
        assert data["count"] == 1
        measurement = data["measurements"][0]

        # Verify aggregation calculations
        assert measurement["count"] == 2  # Two measurements at this location/month
        assert measurement["avg_temperature"] == 25.0  # (20.0 + 30.0) / 2
        assert measurement["min_temperature"] == 20.0
        assert measurement["max_temperature"] == 30.0

    def test_empty_request_body_handled_gracefully(self):
        """Test that empty request body is handled properly."""
        response = self.client.post(
            "/api/measurements/aggregated/",
            data="",
            content_type="application/json",
        )
        assert response.status_code == 200
        data = response.json()
        assert "measurements" in data
        assert data["count"] == 3

    def test_no_measurements_returns_empty_result(self):
        """Test behavior when no measurements match criteria."""
        # Delete all measurements
        _delete_all_measurements()

        response = self.client.post(
            "/api/measurements/aggregated/",
            data=json.dumps({}),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 0
        assert data["measurements"] == []
        assert data["status"] == "success"


class MonthFilteringTests(MeasurementAnalysisBaseTest):
    """Test month-based filtering functionality."""

    def test_single_calendar_month_filter(self):
        """Test filtering by a single calendar month."""
        response = self.client.post(
            "/api/measurements/aggregated/",
            data=json.dumps({"month": 10}),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()

        assert data["count"] == 1
        assert data["measurements"][0]["max_temperature"] == 20.0

    def test_multiple_calendar_months_filter(self):
        """Test filtering by multiple calendar months."""
        response = self.client.post(
            "/api/measurements/aggregated/",
            data=json.dumps({"month": [10, 11]}),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()

        assert data["count"] == 2
        # Should have one measurement for October and one for November
        temperatures = {m["max_temperature"] for m in data["measurements"]}
        assert 25.5 in temperatures  # November measurement
        assert 20.0 in temperatures  # October measurement

    def test_string_month_parameter_single(self):
        """Test that month as string works correctly."""
        response = self.client.post(
            "/api/measurements/aggregated/",
            data=json.dumps({"month": "10"}),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 1

    def test_comma_separated_months_string(self):
        """Test that comma-separated months as string work."""
        response = self.client.post(
            "/api/measurements/aggregated/",
            data=json.dumps({"month": "10,11"}),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 2

    def test_month_zero_parameter_integer(self):
        """Test that month=0 (integer) filters for last 30 days."""
        today = timezone.now().date()

        # Create a recent measurement (within last 30 days)
        recent_measurement = Measurement.objects.create(
            location="POINT(7 7)",
            local_date=(today - timedelta(days=5)).isoformat(),
            local_time="00:00:00",
            timestamp=timezone.now() - timedelta(days=5),
        )
        Temperature.objects.create(
            measurement=recent_measurement,
            value=22.0,
            sensor="Test Sensor",
            time_waited=timedelta(seconds=1),
        )

        response = self.client.post(
            "/api/measurements/aggregated/",
            data=json.dumps({"month": 0}),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()

        # Should only include the recent measurement
        locations = {(m["location"]["latitude"], m["location"]["longitude"]) for m in data["measurements"]}
        assert (7.0, 7.0) in locations

        # Verify old measurements are excluded
        assert (1.0, 2.0) not in locations  # November measurement (old)
        assert (3.0, 4.0) not in locations  # October/April measurements (old)

    def test_past_30_days_filter_detailed(self):
        """Test detailed behavior of last 30 days filter."""
        today = timezone.now().date()

        # Create measurements with specific ages
        old_measurement = Measurement.objects.create(
            location="POINT(5 5)",
            local_date=(today - timedelta(days=40)).isoformat(),
            local_time="00:00:00",
            timestamp=timezone.now() - timedelta(days=40),
        )
        Temperature.objects.create(
            measurement=old_measurement,
            value=15.0,
            sensor="Test Sensor",
            time_waited=timedelta(seconds=1),
        )

        recent_measurement = Measurement.objects.create(
            location="POINT(6 6)",
            local_date=(today - timedelta(days=10)).isoformat(),
            local_time="00:00:00",
            timestamp=timezone.now() - timedelta(days=10),
        )
        Temperature.objects.create(
            measurement=recent_measurement,
            value=28.0,
            sensor="Test Sensor",
            time_waited=timedelta(seconds=1),
        )

        response = self.client.post(
            "/api/measurements/aggregated/",
            data=json.dumps({"month": 0}),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()

        locations = {(m["location"]["latitude"], m["location"]["longitude"]) for m in data["measurements"]}
        temperatures = {m["max_temperature"] for m in data["measurements"]}

        # Recent measurement should be included
        assert (6.0, 6.0) in locations
        assert 28.0 in temperatures

        # Old measurements should be excluded
        assert (5.0, 5.0) not in locations
        assert 15.0 not in temperatures


class MonthParameterValidationTests(MeasurementAnalysisBaseTest):
    """Test month parameter validation and error handling."""

    def test_invalid_text_month_filter(self):
        """Test that passing invalid text parameters returns 400."""
        response = self.client.post(
            "/api/measurements/aggregated/",
            data=json.dumps({"month": "0,abc10"}),
            content_type="application/json",
        )

        assert response.status_code == 400
        data = response.json()
        # now raised by our code when int conversion fails
        assert data["error"] == "Invalid month parameter; must be integers or comma-separated integers"

    def test_invalid_out_of_range_month_filter(self):
        """Test that passing out of range parameters returns 400."""
        response = self.client.post(
            "/api/measurements/aggregated/",
            data=json.dumps({"month": "13,-1"}),
            content_type="application/json",
        )

        assert response.status_code == 400
        data = response.json()
        # now raised by our code listing the offending values
        assert data["error"] == "Month(s) out of range 1-12: [13, -1]"

    def test_some_valid_some_invalid_month_filter(self):
        """Test that passing some valid and some invalid month parameters breaks."""
        response = self.client.post(
            "/api/measurements/aggregated/",
            data=json.dumps({"month": "13,-1,4"}),
            content_type="application/json",
        )

        assert response.status_code == 400
        data = response.json()
        # mixing valid (4) with invalid (13, -1) still triggers the same out-of-range error
        assert data["error"] == "Month(s) out of range 1-12: [13, -1]"

    def test_empty_month_list_returns_all_data(self):
        """Test that empty month list is treated like no filter (returns all data)."""
        response = self.client.post(
            "/api/measurements/aggregated/",
            data=json.dumps({"month": []}),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 3
        assert len(data["measurements"]) == 3

    def test_no_month_parameter_returns_all_data(self):
        """Test that omitting month parameter returns all data."""
        response = self.client.post(
            "/api/measurements/aggregated/",
            data=json.dumps({}),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 3
        assert len(data["measurements"]) == 3

    def test_null_month_parameter_returns_all_data(self):
        """Test that null month parameter returns all data."""
        response = self.client.post(
            "/api/measurements/aggregated/",
            data=json.dumps({"month": None}),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 3
        assert len(data["measurements"]) == 3

    def test_zero_string_month_parameter(self):
        """Test that month='0' works for last 30 days."""
        # Create a recent measurement
        today = timezone.now().date()
        recent_measurement = Measurement.objects.create(
            location="POINT(8 8)",
            local_date=(today - timedelta(days=2)).isoformat(),
            local_time="00:00:00",
            timestamp=timezone.now() - timedelta(days=2),
        )
        Temperature.objects.create(
            measurement=recent_measurement,
            value=24.0,
            sensor="Test Sensor",
            time_waited=timedelta(seconds=1),
        )

        response = self.client.post(
            "/api/measurements/aggregated/",
            data=json.dumps({"month": "0"}),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()

        # Should include recent measurement
        locations = {(m["location"]["latitude"], m["location"]["longitude"]) for m in data["measurements"]}
        assert (8.0, 8.0) in locations


class CachingFunctionalityTests(MeasurementAnalysisBaseTest):
    """Test caching functionality for measurement aggregation."""

    def test_basic_caching_functionality(self):
        """Test that caching works correctly for month-based queries."""
        # First request should hit the database
        response1 = self.client.post(
            "/api/measurements/aggregated/",
            data=json.dumps({"month": 10}),
            content_type="application/json",
        )

        assert response1.status_code == 200
        data1 = response1.json()

        # Second identical request should use cache
        response2 = self.client.post(
            "/api/measurements/aggregated/",
            data=json.dumps({"month": 10}),
            content_type="application/json",
        )

        assert response2.status_code == 200
        data2 = response2.json()

        # Results should be identical
        assert data1 == data2

    def test_multiple_months_caching_separately(self):
        """Test that multiple months are cached separately."""
        # Request for October (should cache October results)
        response1 = self.client.post(
            "/api/measurements/aggregated/",
            data=json.dumps({"month": 10}),
            content_type="application/json",
        )
        assert response1.status_code == 200

        # Request for November (should cache November results)
        response2 = self.client.post(
            "/api/measurements/aggregated/",
            data=json.dumps({"month": 11}),
            content_type="application/json",
        )
        assert response2.status_code == 200

        # Request for both months should combine cached results
        response3 = self.client.post(
            "/api/measurements/aggregated/",
            data=json.dumps({"month": [10, 11]}),
            content_type="application/json",
        )

        assert response3.status_code == 200
        data = response3.json()
        assert data["count"] == 2

    @patch("measurement_analysis.views.get_cached_results_for_months")
    @patch("measurement_analysis.views.cache_results_by_month")
    def test_cache_hit_behavior(self, mock_cache_set, mock_cache_get):
        """Test behavior when cache hit occurs."""
        # Mock a cache hit
        mock_aggregated_data = [
            {
                "location": {"latitude": 3.0, "longitude": 4.0},
                "count": 1,
                "avg_temperature": 20.0,
                "min_temperature": 20.0,
                "max_temperature": 20.0,
            }
        ]
        mock_cache_get.return_value = (mock_aggregated_data, [])  # cached_results, missing_months

        response = self.client.post(
            "/api/measurements/aggregated/",
            data=json.dumps({"month": 10}),
            content_type="application/json",
        )
        assert response.status_code == 200
        data = response.json()

        # Should return cached data
        assert data["measurements"] == mock_aggregated_data
        assert data["count"] == 1

        # Should have called cache get but not cache set
        mock_cache_get.assert_called_once()
        mock_cache_set.assert_not_called()

    @patch("measurement_analysis.views.get_cached_results_for_months")
    @patch("measurement_analysis.views.cache_results_by_month")
    def test_cache_miss_behavior(self, mock_cache_set, mock_cache_get):
        """Test behavior when cache miss occurs."""
        # Mock a cache miss
        mock_cache_get.return_value = ([], [10])  # cached_results, missing_months

        response = self.client.post(
            "/api/measurements/aggregated/",
            data=json.dumps({"month": 10}),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()

        # Should fetch fresh data and cache it
        assert data["count"] == 1  # Should have fetched the October measurement

        mock_cache_get.assert_called_once()
        mock_cache_set.assert_called_once()

    @patch("measurement_analysis.views.get_cached_results_for_months")
    @patch("measurement_analysis.views.cache_results_by_month")
    def test_partial_cache_hit_behavior(self, mock_cache_set, mock_cache_get):
        """Test behavior with partial cache hit (some months cached, some not)."""
        # Mock partial cache hit - November cached, October not
        mock_cached_november = [
            {
                "location": {"latitude": 1.0, "longitude": 2.0},
                "count": 1,
                "avg_temperature": 25.5,
                "min_temperature": 25.5,
                "max_temperature": 25.5,
            }
        ]
        mock_cache_get.return_value = (mock_cached_november, [10])  # cached November, missing October

        response = self.client.post(
            "/api/measurements/aggregated/",
            data=json.dumps({"month": [10, 11]}),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()

        # Should combine cached November data with fresh October data
        assert data["count"] == 2

        # Should contain both November (cached) and October (fresh) measurements
        temperatures = {m["max_temperature"] for m in data["measurements"]}
        assert 25.5 in temperatures  # November (cached)
        assert 20.0 in temperatures  # October (fresh)

        mock_cache_get.assert_called_once()
        mock_cache_set.assert_called_once()

    def test_no_caching_for_non_month_queries(self):
        """Test that queries without month parameter don't use caching."""
        with patch("measurement_analysis.views.get_cached_results_for_months") as mock_cache_get:
            response = self.client.post(
                "/api/measurements/aggregated/",
                data=json.dumps({}),  # No month parameter
                content_type="application/json",
            )

            assert response.status_code == 200
            # Should not attempt to use caching
            mock_cache_get.assert_not_called()


class ResponseStructureTests(MeasurementAnalysisBaseTest):
    """Test response structure and data format."""

    def test_complete_response_structure(self):
        """Test that response has correct and complete structure."""
        response = self.client.post(
            "/api/measurements/aggregated/",
            data=json.dumps({}),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()

        # Check top-level structure
        required_top_level_fields = ["measurements", "count", "status"]
        for field in required_top_level_fields:
            assert field in data, f"Missing required field: {field}"

        assert data["status"] == "success"
        assert isinstance(data["count"], int)
        assert isinstance(data["measurements"], list)

        # Check measurement structure if measurements exist
        if data["measurements"]:
            measurement = data["measurements"][0]
            required_measurement_fields = ["location", "count", "avg_temperature", "min_temperature", "max_temperature"]
            for field in required_measurement_fields:
                assert field in measurement, f"Missing required measurement field: {field}"

            # Check location structure
            location = measurement["location"]
            required_location_fields = ["latitude", "longitude"]
            for field in required_location_fields:
                assert field in location, f"Missing required location field: {field}"

            # Check data types
            assert isinstance(measurement["count"], int | float | type(None))
            assert isinstance(measurement["avg_temperature"], int | float | type(None))
            assert isinstance(measurement["min_temperature"], int | float | type(None))
            assert isinstance(measurement["max_temperature"], int | float | type(None))
            assert isinstance(location["latitude"], int | float)
            assert isinstance(location["longitude"], int | float)

    def test_empty_results_structure(self):
        """Test response structure when no results are found."""
        # Delete all measurements
        _delete_all_measurements()

        response = self.client.post(
            "/api/measurements/aggregated/",
            data=json.dumps({}),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()

        # Should still have proper structure
        assert "measurements" in data
        assert "count" in data
        assert "status" in data

        # Should be empty
        assert data["measurements"] == []
        assert data["count"] == 0
        assert data["status"] == "success"


class HelperFunctionTests(TestCase):
    """Test helper functions used in measurement analysis."""

    def test_parse_month_parameter_none(self):
        """Test parse_month_parameter with None input."""
        from measurement_analysis.views import parse_month_parameter

        result = parse_month_parameter(None)
        assert result == []

    def test_parse_month_parameter_zero(self):
        """Test parse_month_parameter with zero input."""
        from measurement_analysis.views import parse_month_parameter

        result = parse_month_parameter(0)
        assert result == [0]

    def test_parse_month_parameter_single_int(self):
        """Test parse_month_parameter with single integer."""
        from measurement_analysis.views import parse_month_parameter

        result = parse_month_parameter(5)
        assert result == [5]

    def test_parse_month_parameter_comma_separated_string(self):
        """Test parse_month_parameter with comma-separated string."""
        from measurement_analysis.views import parse_month_parameter

        result = parse_month_parameter("1,2,3")
        assert result == [1, 2, 3]

    def test_parse_month_parameter_list(self):
        """Test parse_month_parameter with list input."""
        from measurement_analysis.views import parse_month_parameter

        result = parse_month_parameter([1, 2, 3])
        assert result == [1, 2, 3]

    def test_parse_month_parameter_invalid_values(self):
        """Test parse_month_parameter with invalid values."""
        from measurement_analysis.views import parse_month_parameter

        with self.assertRaises(ValueError) as cm:
            parse_month_parameter("abc")
        assert "integers or comma-separated integers" in str(cm.exception)

    def test_parse_month_parameter_out_of_range(self):
        """Test parse_month_parameter with out of range values."""
        from measurement_analysis.views import parse_month_parameter

        with self.assertRaises(ValueError) as cm:
            parse_month_parameter("13,14,15")
        assert "Month(s) out of range 1-12" in str(cm.exception)

    def test_parse_month_parameter_mixed_valid_invalid(self):
        """Test parse_month_parameter with mix of valid, invalid, and zero values."""
        from measurement_analysis.views import parse_month_parameter

        # Any presence of 0 should override to [0]
        result = parse_month_parameter("1,13,5,0,15")
        assert result == [0]

    def test_parse_month_parameter_empty_string(self):
        """Test parse_month_parameter with empty string."""
        from measurement_analysis.views import parse_month_parameter

        result = parse_month_parameter("")
        assert result == []

    def test_parse_month_parameter_whitespace_handling(self):
        """Test parse_month_parameter handles whitespace correctly."""
        from measurement_analysis.views import parse_month_parameter

        result = parse_month_parameter(" 1 , 2 , 3 ")
        assert result == [1, 2, 3]

    def test_apply_boundary_filter_valid_geometry(self):
        """Test apply_boundary_filter with valid geometry."""
        from measurements.models import Measurement

        from measurement_analysis.views import apply_boundary_filter

        # Create test queryset
        queryset = Measurement.objects.all()

        # Valid GeoJSON polygon
        polygon_geojson = '{"type": "Polygon", "coordinates": [[[0, 0], [5, 0], [5, 5], [0, 5], [0, 0]]]}'

        # Should not raise an exception
        result = apply_boundary_filter(queryset, polygon_geojson)
        assert result is not None

    def test_apply_boundary_filter_none_geometry(self):
        """Test apply_boundary_filter with None geometry."""
        from measurements.models import Measurement

        from measurement_analysis.views import apply_boundary_filter

        queryset = Measurement.objects.all()

        # Should return original queryset unchanged
        result = apply_boundary_filter(queryset, None)
        assert result == queryset

    def test_apply_boundary_filter_empty_geometry(self):
        """Test apply_boundary_filter with empty geometry."""
        from measurements.models import Measurement

        from measurement_analysis.views import apply_boundary_filter

        queryset = Measurement.objects.all()

        # Should return original queryset unchanged
        result = apply_boundary_filter(queryset, "")
        assert result == queryset

    def test_apply_boundary_filter_invalid_geometry(self):
        """Test apply_boundary_filter with invalid geometry."""
        from measurements.models import Measurement

        from measurement_analysis.views import apply_boundary_filter

        queryset = Measurement.objects.all()
        invalid_geometry = "invalid geometry string"

        with self.assertRaises(ValueError) as context:
            apply_boundary_filter(queryset, invalid_geometry)

        assert "Invalid boundary_geometry format" in str(context.exception)

    def test_apply_month_filter_empty_months(self):
        """Test apply_month_filter with empty months list."""
        from measurements.models import Measurement

        from measurement_analysis.views import apply_month_filter

        queryset = Measurement.objects.all()

        # Should return original queryset unchanged
        result = apply_month_filter(queryset, [])
        assert result == queryset

    def test_apply_month_filter_last_30_days(self):
        """Test apply_month_filter with month 0 (last 30 days)."""
        from measurements.models import Measurement

        from measurement_analysis.views import apply_month_filter

        queryset = Measurement.objects.all()

        # Should filter for last 30 days
        result = apply_month_filter(queryset, [0])

        # Verify the filter was applied (we can't easily test the exact SQL without hitting DB)
        assert result is not None
        assert result != queryset

    def test_apply_month_filter_calendar_months(self):
        """Test apply_month_filter with calendar months."""
        from measurements.models import Measurement

        from measurement_analysis.views import apply_month_filter

        queryset = Measurement.objects.all()

        # Should filter for specific months
        result = apply_month_filter(queryset, [1, 2, 3])

        # Verify the filter was applied
        assert result is not None
        assert result != queryset

    def test_apply_month_filter_mixed_zero_and_months(self):
        """Test apply_month_filter with mix of 0 and calendar months."""
        from measurements.models import Measurement

        from measurement_analysis.views import apply_month_filter

        queryset = Measurement.objects.all()

        # When 0 is present, should only filter for last 30 days
        result = apply_month_filter(queryset, [0, 1, 2])

        # Should apply last 30 days filter (0 takes precedence)
        assert result is not None
        assert result != queryset

    def test_build_cache_key_basic(self):
        """Test build_cache_key with basic parameters."""
        from measurement_analysis.views import build_cache_key

        result = build_cache_key("test_type", 5)
        assert result == "test_type:month:5"

    def test_build_cache_key_with_boundary(self):
        """Test build_cache_key with boundary geometry."""
        from measurement_analysis.views import build_cache_key

        boundary = '{"type": "Polygon", "coordinates": [[[0, 0], [1, 1]]]}'
        result = build_cache_key("test_type", 5, boundary)

        # Should include boundary hash
        assert "test_type:month:" in result
        assert "5" in result
        # Should contain 8-character hash
        parts = result.split(":")
        assert len(parts) == 4  # test_type:month:hash:5
        assert len(parts[2]) == 8  # Hash part should be 8 characters

    def test_build_cache_key_last_30_days(self):
        """Test build_cache_key for last 30 days (month=0)."""
        from measurement_analysis.views import build_cache_key

        with patch("measurement_analysis.views.timezone") as mock_timezone:
            mock_timezone.now.return_value.date.return_value.isoformat.return_value = "2025-06-15"

            result = build_cache_key("test_type", 0)
            assert result == "test_type:last30days:2025-06-15"

    def test_build_cache_key_last_30_days_with_boundary(self):
        """Test build_cache_key for last 30 days with boundary."""
        from measurement_analysis.views import build_cache_key

        boundary = '{"type": "Polygon"}'

        with patch("measurement_analysis.views.timezone") as mock_timezone:
            mock_timezone.now.return_value.date.return_value.isoformat.return_value = "2025-06-15"

            result = build_cache_key("test_type", 0, boundary)
            assert "test_type:last30days:" in result
            assert "2025-06-15" in result

    def test_get_cached_results_for_months_all_cached(self):
        """Test get_cached_results_for_months when all months are cached."""
        from measurement_analysis.views import get_cached_results_for_months

        # Mock cache to return data for all months
        with patch("measurement_analysis.views.cache") as mock_cache:
            mock_cache.get.return_value = [{"test": "data"}]

            cached_results, missing_months = get_cached_results_for_months("test_type", [1, 2], None)

            assert len(cached_results) == 2  # Two months worth of data
            assert missing_months == []

    def test_get_cached_results_for_months_none_cached(self):
        """Test get_cached_results_for_months when nothing is cached."""
        from measurement_analysis.views import get_cached_results_for_months

        # Mock cache to return None (cache miss)
        with patch("measurement_analysis.views.cache") as mock_cache:
            mock_cache.get.return_value = None

            cached_results, missing_months = get_cached_results_for_months("test_type", [1, 2], None)

            assert cached_results == []
            assert missing_months == [1, 2]

    def test_get_cached_results_for_months_partial_cached(self):
        """Test get_cached_results_for_months with partial cache hits."""
        from measurement_analysis.views import get_cached_results_for_months

        # Mock cache to return data for some months
        def mock_cache_get(key):
            if "month:1" in key:
                return [{"month": 1, "data": "test"}]
            return None

        with patch("measurement_analysis.views.cache") as mock_cache:
            mock_cache.get.side_effect = mock_cache_get

            cached_results, missing_months = get_cached_results_for_months("test_type", [1, 2], None)

            assert len(cached_results) == 1  # One month cached
            assert missing_months == [2]  # One month missing

    def test_cache_results_by_month_empty_inputs(self):
        """Test cache_results_by_month with empty inputs."""
        from measurement_analysis.views import cache_results_by_month

        with patch("measurement_analysis.views.cache") as mock_cache:
            # Should not crash with empty inputs
            cache_results_by_month("test_type", [], [])
            cache_results_by_month("test_type", [{"test": "data"}], [])
            cache_results_by_month("test_type", [], [1, 2])

            # Should not have called cache.set
            mock_cache.set.assert_not_called()

    def test_cache_results_by_month_last_30_days(self):
        """Test cache_results_by_month for last 30 days."""
        from measurement_analysis.views import cache_results_by_month

        results = [{"test": "data"}]

        with patch("measurement_analysis.views.cache") as mock_cache:
            cache_results_by_month("test_type", results, [0])

            # Should call cache.set once for the last 30 days
            mock_cache.set.assert_called_once()
            call_args = mock_cache.set.call_args
            assert "last30days" in call_args[0][0]  # Cache key should contain "last30days"
            assert call_args[0][1] == results  # Should cache the results

    def test_cache_results_by_month_aggregated_measurements(self):
        """Test cache_results_by_month for aggregated measurements."""
        from measurement_analysis.views import cache_results_by_month

        results = [
            {"month": 1, "data": "test1"},
            {"month": 2, "data": "test2"},
            {"month": 1, "data": "test3"},  # Another result for month 1
        ]

        with patch("measurement_analysis.views.cache") as mock_cache:
            cache_results_by_month("aggregated_measurements", results, [1, 2])

            # Should call cache.set twice (once for each month)
            assert mock_cache.set.call_count == 2

            # Verify the calls were made with correct data
            calls = mock_cache.set.call_args_list

            # Check that results were grouped by month
            cached_data = {}
            for call in calls:
                key, data, timeout = call[0]
                if "month:1" in key:
                    cached_data[1] = data
                elif "month:2" in key:
                    cached_data[2] = data

            # Month 1 should have 2 results, month 2 should have 1
            assert len(cached_data[1]) == 2
            assert len(cached_data[2]) == 1


class ErrorHandlingTests(MeasurementAnalysisBaseTest):
    """Test error handling in various edge cases."""

    def test_database_error_handling(self):
        """Test handling of database errors."""
        with patch("measurement_analysis.views._perform_aggregation") as mock_aggregation:
            # Simulate database error
            mock_aggregation.side_effect = Exception("Database connection failed")

            response = self.client.post(
                "/api/measurements/aggregated/",
                data=json.dumps({"month": 10}),
                content_type="application/json",
            )

            assert response.status_code == 500
            data = response.json()
            assert data["error"] == "Internal server error"

    def test_serialization_error_handling(self):
        """Test handling of serialization errors."""
        with patch("measurement_analysis.views.MeasurementAggregatedSerializer") as mock_serializer:
            # Simulate serialization error
            mock_serializer.side_effect = Exception("Serialization failed")

            response = self.client.post(
                "/api/measurements/aggregated/",
                data=json.dumps({"month": 10}),
                content_type="application/json",
            )

            assert response.status_code == 500
            data = response.json()
            assert data["error"] == "Internal server error"

    def test_large_month_parameter_handling(self):
        """Test handling of unusually large month parameters."""
        # Test with very large list of months
        large_month_list = list(range(1, 13)) * 100  # 1200 months

        response = self.client.post(
            "/api/measurements/aggregated/",
            data=json.dumps({"month": large_month_list}),
            content_type="application/json",
        )

        # Should handle gracefully (filter to valid months 1-12)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"


def _delete_all_measurements():
    with connection.cursor() as cursor:
        cursor.execute("DELETE FROM measurements_measurement_campaigns;")
        cursor.execute("DELETE FROM measurements_temperature;")
        cursor.execute("DELETE FROM measurements_measurement;")
