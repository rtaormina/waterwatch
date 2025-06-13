"""Test cases for the measurement views."""

import json
from datetime import timedelta
from unittest.mock import patch

from django.contrib.gis.geos import Point, Polygon
from django.http import HttpResponse, HttpResponseNotAllowed
from django.test import Client, TestCase
from django.utils import timezone

from measurements.models import Measurement, Temperature


class MeasurementViewTest(TestCase):
    """Test suite for the measurement_view."""

    def setUp(self):
        """Set up the test client before each test."""
        self.client = Client()

    @patch("measurements.views.export_all_view")
    def test_get_request_calls_export_all_view(self, mock_export_all_view):
        """Test that a GET request correctly calls export_all_view.

        The mock is configured to return a valid HttpResponse to prevent
        TypeErrors in the Django test client's middleware.

        Parameters
        ----------
        mock_export_all_view : MagicMock
            A mock of the `export_all_view` function.
        """
        # Configure the mock to return a valid response
        mock_export_all_view.return_value = HttpResponse(status=200)

        self.client.get("/api/measurements/")
        mock_export_all_view.assert_called_once()

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
        assert isinstance(response, HttpResponseNotAllowed)


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
        assert isinstance(response, HttpResponseNotAllowed)


class TemperatureViewTest(TestCase):
    """Test suite for the temperature_view."""

    def setUp(self):
        """Set up test data and client."""
        self.client = Client()
        self.polygon = Polygon.from_bbox((0, 0, 10, 10))
        now = timezone.now()

        # Create test data, providing a value for the non-nullable 'time_waited' field.
        measurement_in = Measurement.objects.create(location=Point(5, 5), timestamp=now)
        Temperature.objects.create(measurement=measurement_in, value=25.5, time_waited=timedelta(seconds=10))

        measurement_out = Measurement.objects.create(location=Point(15, 15), timestamp=now)
        Temperature.objects.create(measurement=measurement_out, value=30.0, time_waited=timedelta(seconds=20))

        Measurement.objects.create(location=Point(1, 1), timestamp=now)

    def test_get_all_temperatures(self):
        """Test retrieving all temperature measurements."""
        # Note the trailing slash to match urls.py
        response = self.client.get("/api/measurements/temperatures/")
        assert response.status_code == 200
        assert json.loads(response.content) == ["25.5", "30.0"]

    def test_get_temperatures_within_boundary(self):
        """Test filtering temperature measurements by a boundary."""
        url = f"/api/measurements/temperatures/?boundary_geometry={self.polygon.wkt}"
        response = self.client.get(url)
        assert response.status_code == 200
        assert json.loads(response.content) == ["25.5"]

    def test_invalid_boundary_geometry(self):
        """Test request with an invalid boundary geometry."""
        url = "/api/measurements/temperatures/?boundary_geometry=INVALID_GEOMETRY"
        response = self.client.get(url)
        assert response.status_code == 400
        assert json.loads(response.content) == {"error": "Invalid boundary_geometry format"}
