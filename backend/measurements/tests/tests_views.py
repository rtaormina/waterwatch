"""Test cases for the measurement views."""

import json
from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock, patch

from django.contrib.gis.geos import Point, Polygon
from django.core.cache import cache
from django.http import HttpResponse
from django.test import Client, TestCase
from django.utils import timezone

from measurements.models import Measurement, Temperature


class MeasurementViewTest(TestCase):
    """Test suite for the measurement_view."""

    def setUp(self):
        """Set up the test client before each test."""
        self.client = Client()

    @patch("measurements.views.get_all_measurements")
    def test_get_request_calls_get_all_measurements(self, mock_get_all_measurements):
        """Test that a GET request correctly calls get_all_measurements.

        The mock is configured to return a valid HttpResponse to prevent
        TypeErrors in the Django test client's middleware.

        Parameters
        ----------
        mock_get_all_measurements : MagicMock
            A mock of the `get_all_measurements` function.
        """
        # Configure the mock to return a valid response
        mock_get_all_measurements.return_value = HttpResponse(status=200)

        self.client.get("/api/measurements/")
        mock_get_all_measurements.assert_called_once()

    @patch("measurements.views.add_measurement_view")
    def test_post_request_calls_add_measurement_view(self, mock_add_measurement_view):
        """Test that a POST request correctly calls add_measurement_view.

        Parameters
        ----------
        mock_add_measurement_view : MagicMock
            A mock of the `add_measurement_view` function.
        """
        mock_add_measurement_view.return_value = HttpResponse(status=201)

        self.client.post("/api/measurements/", data={})
        mock_add_measurement_view.assert_called_once()

    def test_disallowed_method_returns_405(self):
        """Test that a disallowed HTTP method returns a 405 status code."""
        response = self.client.put("/api/measurements/")
        assert response.status_code == 405


class GetAllMeasurementsTest(TestCase):
    """Test suite for the get_all_measurements function."""

    def setUp(self):
        """Set up test data."""
        self.client = Client()

    @patch("measurements.views.build_base_queryset")
    @patch("measurements.views.apply_location_annotations")
    @patch("measurements.views.prepare_measurement_data")
    def test_get_all_measurements_pipeline(self, mock_prepare, mock_annotate, mock_build):
        """Test that get_all_measurements calls the correct functions in order."""
        # Setup mocks
        mock_queryset = MagicMock()
        mock_annotated_qs = MagicMock()
        mock_data = [{"id": 1, "value": 25.5}]

        mock_build.return_value = mock_queryset
        mock_annotate.return_value = mock_annotated_qs
        mock_prepare.return_value = mock_data

        response = self.client.get("/api/measurements/")

        # Verify function calls
        mock_build.assert_called_once_with(ordered=True)
        mock_annotate.assert_called_once_with(mock_queryset)
        mock_prepare.assert_called_once_with(mock_annotated_qs)

        # Verify response
        assert response.status_code == 200
        assert json.loads(response.content) == mock_data


class MeasurementSearchTest(TestCase):
    """Test suite for the measurement_search view."""

    def setUp(self):
        """Set up the test client before each test."""
        self.client = Client()

    @patch("measurements.views.search_measurements_view")
    def test_post_request_calls_search_measurements_view(self, mock_search_view):
        """Test that a POST request calls the search_measurements_view.

        Parameters
        ----------
        mock_search_view : MagicMock
            A mock of the `search_measurements_view` function.
        """
        mock_search_view.return_value = HttpResponse(status=200)

        # Note the trailing slash to match urls.py
        self.client.post("/api/measurements/search/", data={})
        mock_search_view.assert_called_once()

    def test_get_request_returns_405(self):
        """Test that a GET request returns a 405 Method Not Allowed."""
        # Note the trailing slash to match urls.py
        response = self.client.get("/api/measurements/search/")
        assert response.status_code == 405


class TemperatureViewTest(TestCase):
    """Test suite for the temperature_view."""

    def setUp(self):
        """Set up test data and client."""
        self.client = Client()
        self.polygon = Polygon.from_bbox((0, 0, 10, 10))
        now = timezone.now()

        # Clear cache before each test
        cache.clear()

        # Create test data with different months for testing month filtering
        jan_date = datetime(2024, 1, 15, tzinfo=UTC)
        feb_date = datetime(2024, 2, 15, tzinfo=UTC)

        # Measurements within boundary
        measurement_jan = Measurement.objects.create(
            location=Point(5, 5), timestamp=jan_date, local_date=jan_date.date()
        )
        Temperature.objects.create(measurement=measurement_jan, value=25.5, time_waited=timedelta(seconds=10))

        measurement_feb = Measurement.objects.create(
            location=Point(6, 6), timestamp=feb_date, local_date=feb_date.date()
        )
        Temperature.objects.create(measurement=measurement_feb, value=26.5, time_waited=timedelta(seconds=15))

        # Measurement outside boundary
        measurement_out = Measurement.objects.create(location=Point(15, 15), timestamp=now, local_date=now.date())
        Temperature.objects.create(measurement=measurement_out, value=30.0, time_waited=timedelta(seconds=20))

        # Measurement without temperature
        Measurement.objects.create(location=Point(1, 1), timestamp=now, local_date=now.date())

    def test_get_all_temperatures_no_filters(self):
        """Test retrieving all temperature measurements without filters."""
        response = self.client.post("/api/measurements/temperatures/", json.dumps({}), content_type="application/json")
        assert response.status_code == 200
        temperatures = json.loads(response.content)
        # Should return all temperature values
        assert len(temperatures) == 3
        assert set(temperatures) == {"25.5", "26.5", "30.0"}

    def test_get_temperatures_within_boundary(self):
        """Test filtering temperature measurements by a boundary."""
        response = self.client.post(
            "/api/measurements/temperatures/",
            json.dumps({"boundary_geometry": self.polygon.wkt}),
            content_type="application/json",
        )
        assert response.status_code == 200
        temperatures = json.loads(response.content)
        # Should only return temperatures within the boundary
        assert len(temperatures) == 2
        assert set(temperatures) == {"25.5", "26.5"}

    def test_get_temperatures_by_month(self):
        """Test filtering temperature measurements by month."""
        response = self.client.post(
            "/api/measurements/temperatures/",
            json.dumps({"month": 1}),  # January
            content_type="application/json",
        )
        assert response.status_code == 200
        temperatures = json.loads(response.content)
        assert temperatures == ["25.5"]

    def test_get_temperatures_by_multiple_months(self):
        """Test filtering temperature measurements by multiple months."""
        response = self.client.post(
            "/api/measurements/temperatures/",
            json.dumps({"month": [1, 2]}),  # January and February
            content_type="application/json",
        )
        assert response.status_code == 200
        temperatures = json.loads(response.content)
        assert len(temperatures) == 2
        assert set(temperatures) == {"25.5", "26.5"}

    def test_get_temperatures_boundary_and_month_filter(self):
        """Test combining boundary and month filters."""
        response = self.client.post(
            "/api/measurements/temperatures/",
            json.dumps({"boundary_geometry": self.polygon.wkt, "month": 1}),
            content_type="application/json",
        )
        assert response.status_code == 200
        temperatures = json.loads(response.content)
        assert temperatures == ["25.5"]

    @patch("measurements.views.parse_month_parameter")
    def test_invalid_month_parameter(self, mock_parse_month):
        """Test handling of invalid month parameter."""
        mock_parse_month.side_effect = ValueError("Invalid month parameter")

        response = self.client.post(
            "/api/measurements/temperatures/",
            json.dumps({"month": "invalid"}),
            content_type="application/json",
        )
        assert response.status_code == 400
        assert json.loads(response.content) == {"error": "Invalid month parameter"}

    def test_invalid_boundary_geometry(self):
        """Test request with an invalid boundary geometry."""
        with patch("measurements.views.apply_boundary_filter") as mock_filter:
            mock_filter.side_effect = ValueError("Invalid boundary_geometry format")

            response = self.client.post(
                "/api/measurements/temperatures/",
                json.dumps({"boundary_geometry": "INVALID_GEOMETRY"}),
                content_type="application/json",
            )
            assert response.status_code == 400
            assert json.loads(response.content) == {"error": "Invalid boundary_geometry format"}

    @patch("measurements.views.logger")
    def test_internal_server_error_handling(self, mock_logger):
        """Test handling of unexpected exceptions."""
        with patch("measurements.views._build_temperature_queryset") as mock_build:
            mock_build.side_effect = Exception("Database error")

            response = self.client.post(
                "/api/measurements/temperatures/",
                json.dumps({}),
                content_type="application/json",
            )
            assert response.status_code == 500
            assert json.loads(response.content) == {"error": "Internal server error"}
            mock_logger.exception.assert_called_once_with("Error in temperature_view")


class TemperatureCachingTest(TestCase):
    """Test suite for temperature view caching functionality."""

    def setUp(self):
        """Set up test data for caching tests."""
        self.client = Client()
        cache.clear()

        # Create test temperature data
        jan_date = datetime(2024, 1, 15, tzinfo=UTC)
        measurement = Measurement.objects.create(location=Point(5, 5), timestamp=jan_date, local_date=jan_date.date())
        Temperature.objects.create(measurement=measurement, value=25.5, time_waited=timedelta(seconds=10))

    @patch("measurements.views._get_cached_temperature_results_for_months")
    @patch("measurements.views._cache_temperature_results_by_month")
    def test_cache_hit_returns_cached_data(self, mock_cache_set, mock_cache_get):
        """Test that cached data is returned when available."""
        # Mock cache hit
        mock_cache_get.return_value = (["25.5"], [])  # cached_results, missing_months

        response = self.client.post(
            "/api/measurements/temperatures/",
            json.dumps({"month": 1}),
            content_type="application/json",
        )

        assert response.status_code == 200
        assert json.loads(response.content) == ["25.5"]
        mock_cache_get.assert_called_once()
        mock_cache_set.assert_not_called()

    @patch("measurements.views._get_cached_temperature_results_for_months")
    @patch("measurements.views._cache_temperature_results_by_month")
    def test_cache_miss_fetches_and_caches_data(self, mock_cache_set, mock_cache_get):
        """Test that missing data is fetched and cached."""
        # Mock cache miss
        mock_cache_get.return_value = ([], [1])  # cached_results, missing_months

        response = self.client.post(
            "/api/measurements/temperatures/",
            json.dumps({"month": 1}),
            content_type="application/json",
        )

        assert response.status_code == 200
        temperatures = json.loads(response.content)
        assert temperatures == ["25.5"]

        mock_cache_get.assert_called_once()
        mock_cache_set.assert_called_once()

    @patch("measurements.views._get_cached_temperature_results_for_months")
    @patch("measurements.views._cache_temperature_results_by_month")
    def test_partial_cache_hit_combines_data(self, mock_cache_set, mock_cache_get):
        """Test combining cached and fresh data for partial cache hits."""
        # Mock partial cache hit
        mock_cache_get.return_value = (["20.0"], [1])  # some cached, some missing

        response = self.client.post(
            "/api/measurements/temperatures/",
            json.dumps({"month": [1, 2]}),
            content_type="application/json",
        )

        assert response.status_code == 200
        temperatures = json.loads(response.content)
        # Should combine cached data with fresh data
        assert "20.0" in temperatures  # cached data
        assert "25.5" in temperatures  # fresh data

        mock_cache_get.assert_called_once()
        mock_cache_set.assert_called_once()


class TemperatureHelperFunctionsTest(TestCase):
    """Test suite for temperature view helper functions."""

    def setUp(self):
        """Set up test data."""
        cache.clear()
        now = timezone.now()
        measurement = Measurement.objects.create(location=Point(5, 5), timestamp=now, local_date=now.date())
        Temperature.objects.create(measurement=measurement, value=25.5, time_waited=timedelta(seconds=10))

    def test_build_temperature_queryset_filters_null_temperatures(self):
        """Test that queryset correctly filters out null temperatures."""
        from measurements.views import _build_temperature_queryset

        # Create measurement without temperature
        Measurement.objects.create(location=Point(6, 6), timestamp=timezone.now(), local_date=timezone.now().date())

        queryset = _build_temperature_queryset()
        temperatures = list(queryset.values_list("temperature__value", flat=True))
        assert temperatures == [25.5]

    def test_build_temperature_cache_key_for_month(self):
        """Test cache key generation for month-based caching."""
        from measurements.views import _build_temperature_cache_key_for_month

        polygon = Polygon.from_bbox((0, 0, 10, 10))
        # Convert polygon to WKT string as expected by build_cache_key
        key = _build_temperature_cache_key_for_month(polygon.wkt, 1)

        # Should be a string containing relevant identifiers
        assert isinstance(key, str)
        assert "temperature_values" in key
        assert "1" in key

    @patch("measurements.views.cache")
    def test_cache_temperature_results_by_month_single_month(self, mock_cache):
        """Test caching results for a single month."""
        from measurements.views import _cache_temperature_results_by_month

        results = [25.5, 26.0]
        polygon = Polygon.from_bbox((0, 0, 10, 10))
        months = [1]

        # Create a queryset mock for the function to use
        with patch("measurements.views._build_temperature_queryset") as mock_queryset:
            mock_qs = MagicMock()
            mock_qs.annotate.return_value.values_list.return_value = [(25.5, 1), (26.0, 1)]
            mock_queryset.return_value = mock_qs

            _cache_temperature_results_by_month(results, polygon.wkt, months)
            mock_cache.set.assert_called_once()

    @patch("measurements.views.cache")
    def test_cache_temperature_results_by_month_last_30_days(self, mock_cache):
        """Test caching results for last 30 days (month=0)."""
        from measurements.views import _cache_temperature_results_by_month

        results = [25.5, 26.0]
        polygon = Polygon.from_bbox((0, 0, 10, 10))
        months = [0]  # Last 30 days

        _cache_temperature_results_by_month(results, polygon.wkt, months)
        mock_cache.set.assert_called_once()

    def test_cache_temperature_results_empty_data(self):
        """Test that empty data doesn't cause caching errors."""
        from measurements.views import _cache_temperature_results_by_month

        # Should not raise exceptions with empty data
        _cache_temperature_results_by_month([], None, [])
        _cache_temperature_results_by_month(None, None, None)
