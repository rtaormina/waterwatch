"""Tests for export strategies and factories."""

import csv
import io
import json
import xml.etree.ElementTree as ET
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from django.db import connection
from django.http import HttpResponse, JsonResponse, StreamingHttpResponse
from django.test import TestCase
from measurements.models import Campaign, Measurement, Temperature

from measurement_export.factories import STRATEGIES, get_strategy
from measurement_export.strategies import (
    CsvExport,
    ExportStrategy,
    GeoJsonExport,
    JsonExport,
    XmlExport,
    prettify_xml,
)


class MockQuerySet:
    """Mock QuerySet for testing streaming functionality."""

    def __init__(self, data):
        self.data = data

    def iterator(self, chunk_size=None):  # noqa: ARG002
        """Mock iterator method."""
        yield from self.data


class ExportFactoriesTests(TestCase):
    """Test cases for export factories."""

    def test_strategies_dict_contains_all_formats(self):
        """Test that STRATEGIES dict contains all expected formats."""
        expected_formats = ["csv", "json", "xml", "geojson"]
        for format_key in expected_formats:
            assert format_key in STRATEGIES

    def test_strategies_dict_instances(self):
        """Test that STRATEGIES contains correct strategy instances."""
        assert isinstance(STRATEGIES["csv"], CsvExport)
        assert isinstance(STRATEGIES["json"], JsonExport)
        assert isinstance(STRATEGIES["xml"], XmlExport)
        assert isinstance(STRATEGIES["geojson"], GeoJsonExport)

    def test_get_strategy_valid_formats(self):
        """Test get_strategy returns correct strategy for valid formats."""
        assert isinstance(get_strategy("csv"), CsvExport)
        assert isinstance(get_strategy("json"), JsonExport)
        assert isinstance(get_strategy("xml"), XmlExport)
        assert isinstance(get_strategy("geojson"), GeoJsonExport)

    def test_get_strategy_invalid_format_defaults_to_json(self):
        """Test get_strategy defaults to JsonExport for invalid formats."""
        invalid_formats = ["invalid", "txt", "", None, 123]
        for invalid_format in invalid_formats:
            strategy = get_strategy(invalid_format)
            assert isinstance(strategy, JsonExport)

    def test_get_strategy_case_sensitivity(self):
        """Test get_strategy is case sensitive."""
        # Should default to JSON for uppercase
        assert isinstance(get_strategy("CSV"), JsonExport)
        assert isinstance(get_strategy("JSON"), JsonExport)


class ExportStrategiesBaseTests(TestCase):
    """Base test cases for export strategies."""

    @classmethod
    def setUpTestData(cls):
        """Set up test data for the test cases."""
        user = get_user_model()
        cls.superuser = user.objects.create_superuser(
            username="testsuperuser", email="superuser@example.com", password="superpassword"
        )

        # Create test locations table
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

        # Create test campaign
        cls.campaign = Campaign.objects.create(
            name="Test Campaign",
            description="Test campaign description",
            start_time="2024-01-01T00:00:00Z",
            end_time="2024-12-31T23:59:59Z",
            region="MULTIPOLYGON(((0 0, 1 0, 1 1, 0 1, 0 0)))",
        )

        # Create test measurements
        cls.measurement1 = Measurement.objects.create(
            location=Point(0.5, 0.5),
            flag=False,
            water_source="well",
        )
        cls.measurement2 = Measurement.objects.create(
            location=Point(1.5, 1.5),
            flag=True,
            water_source="network",
        )

        # Add campaign to measurement
        cls.measurement1.campaigns.add(cls.campaign)

        # Create test temperatures
        cls.temperature1 = Temperature.objects.create(
            measurement=cls.measurement1,
            sensor="Test Sensor",
            value=25.5,
            time_waited=timedelta(seconds=30),
        )
        cls.temperature2 = Temperature.objects.create(
            measurement=cls.measurement2,
            sensor="Second Test Sensor",
            value=30.0,
            time_waited=timedelta(seconds=60),
        )

    def setUp(self):
        """Set up test data for each test."""
        self.sample_data = [
            {
                "id": 1,
                "timestamp": "2024-01-01T12:00:00Z",
                "latitude": 52.0,
                "longitude": 4.5,
                "flag": False,
                "water_source": "well",
            },
            {
                "id": 2,
                "timestamp": "2024-01-02T12:00:00Z",
                "latitude": 53.0,
                "longitude": 5.5,
                "flag": True,
                "water_source": "network",
            },
        ]

        self.sample_extra_data = {
            "metrics": {
                1: [{"sensor": "Test Sensor", "value": 25.5, "time_waited": "0:00:30"}],
                2: [{"sensor": "Second Sensor", "value": 30.0, "time_waited": "0:01:00"}],
            },
            "campaigns": {1: ["Test Campaign"], 2: []},
        }


class CsvExportTests(ExportStrategiesBaseTests):
    """Test cases for CSV export strategy."""

    def setUp(self):
        super().setUp()
        self.csv_export = CsvExport()

    def test_csv_export_inheritance(self):
        """Test that CsvExport inherits from ExportStrategy."""
        assert isinstance(self.csv_export, ExportStrategy)

    def test_csv_export_with_list_data(self):
        """Test CSV export with list data (non-streaming)."""
        response = self.csv_export.export(self.sample_data, self.sample_extra_data)

        assert isinstance(response, HttpResponse)
        assert response["Content-Type"] == "text/csv"
        assert response["Content-Disposition"] == 'attachment; filename="measurements.csv"'

        # Parse CSV content
        content = response.content.decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))
        rows = list(reader)

        assert len(rows) == 2
        assert "id" in rows[0]
        assert "metrics" in rows[0]
        assert "campaigns" in rows[0]

    def test_csv_export_with_queryset_streaming(self):
        """Test CSV export with QuerySet (streaming)."""
        mock_qs = MockQuerySet(self.sample_data)
        response = self.csv_export.export(mock_qs, self.sample_extra_data)

        assert isinstance(response, StreamingHttpResponse)
        assert response["Content-Type"] == "text/csv"

        # Collect streamed content
        content = b"".join(response.streaming_content).decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))
        rows = list(reader)

        assert len(rows) == 2
        assert "metrics" in rows[0]

    def test_csv_export_empty_data(self):
        """Test CSV export with empty data."""
        response = self.csv_export.export([], None)

        assert isinstance(response, HttpResponse)
        assert response.content.decode("utf-8") == ""

    def test_csv_export_no_extra_data(self):
        """Test CSV export without extra data."""
        response = self.csv_export.export(self.sample_data, None)

        content = response.content.decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))
        rows = list(reader)

        # Should have empty metrics and campaigns
        assert json.loads(rows[0]["metrics"]) == []
        assert json.loads(rows[0]["campaigns"]) == []

    def test_csv_get_metrics_for_row(self):
        """Test _get_metrics_for_row method."""
        metrics_dict = {1: [{"sensor": "test"}], 2: []}

        # Test existing row
        result = self.csv_export._get_metrics_for_row(1, metrics_dict)
        assert result == [{"sensor": "test"}]

        # Test non-existing row
        result = self.csv_export._get_metrics_for_row(999, metrics_dict)
        assert result == []

        # Test None metrics_dict
        result = self.csv_export._get_metrics_for_row(1, None)
        assert result == []

    def test_csv_get_campaigns_for_row(self):
        """Test _get_campaigns_for_row method."""
        campaigns_dict = {1: ["Campaign 1"], 2: []}

        # Test existing row
        result = self.csv_export._get_campaigns_for_row(1, campaigns_dict)
        assert result == ["Campaign 1"]

        # Test non-existing row
        result = self.csv_export._get_campaigns_for_row(999, campaigns_dict)
        assert result == []

        # Test None campaigns_dict
        result = self.csv_export._get_campaigns_for_row(1, None)
        assert result == []


class JsonExportTests(ExportStrategiesBaseTests):
    """Test cases for JSON export strategy."""

    def setUp(self):
        super().setUp()
        self.json_export = JsonExport()

    def test_json_export_inheritance(self):
        """Test that JsonExport inherits from ExportStrategy."""
        assert isinstance(self.json_export, ExportStrategy)

    def test_json_export_with_list_data(self):
        """Test JSON export with list data (non-streaming)."""
        response = self.json_export.export(self.sample_data, self.sample_extra_data)

        assert isinstance(response, JsonResponse)

        # Parse JSON content
        data = json.loads(response.content.decode("utf-8"))

        assert len(data) == 2
        assert "metrics" in data[0]
        assert "campaigns" in data[0]
        assert data[0]["metrics"] == [{"sensor": "Test Sensor", "value": 25.5, "time_waited": "0:00:30"}]

    def test_json_export_with_queryset_streaming(self):
        """Test JSON export with QuerySet (streaming)."""
        mock_qs = MockQuerySet(self.sample_data)
        response = self.json_export.export(mock_qs, self.sample_extra_data)

        assert isinstance(response, StreamingHttpResponse)
        assert response["Content-Type"] == "application/json"

        # Collect streamed content
        content = b"".join(response.streaming_content).decode("utf-8")
        data = json.loads(content)

        assert len(data) == 2
        assert "metrics" in data[0]

    def test_json_export_empty_data(self):
        """Test JSON export with empty data."""
        response = self.json_export.export([], None)

        data = json.loads(response.content.decode("utf-8"))
        assert data == []

    def test_json_export_no_extra_data(self):
        """Test JSON export without extra data."""
        response = self.json_export.export(self.sample_data, None)

        data = json.loads(response.content.decode("utf-8"))

        # Should have empty metrics and campaigns
        assert data[0]["metrics"] == []
        assert data[0]["campaigns"] == []


class GeoJsonExportTests(ExportStrategiesBaseTests):
    """Test cases for GeoJSON export strategy."""

    def setUp(self):
        super().setUp()
        self.geojson_export = GeoJsonExport()

    def test_geojson_export_inheritance(self):
        """Test that GeoJsonExport inherits from ExportStrategy."""
        assert isinstance(self.geojson_export, ExportStrategy)

    def test_geojson_export_with_list_data(self):
        """Test GeoJSON export with list data (non-streaming)."""
        response = self.geojson_export.export(self.sample_data, self.sample_extra_data)

        assert isinstance(response, HttpResponse)
        assert response["Content-Type"] == "application/geo+json"
        assert response["Content-Disposition"] == 'attachment; filename="measurements.geojson"'

        # Parse GeoJSON content
        data = json.loads(response.content.decode("utf-8"))

        assert data["type"] == "FeatureCollection"
        assert len(data["features"]) == 2

        feature = data["features"][0]
        assert feature["type"] == "Feature"
        assert feature["geometry"]["type"] == "Point"
        assert feature["geometry"]["coordinates"] == [4.5, 52.0]  # [lon, lat]
        assert "metrics" in feature["properties"]

    def test_geojson_export_with_queryset_streaming(self):
        """Test GeoJSON export with QuerySet (streaming)."""
        mock_qs = MockQuerySet(self.sample_data)
        response = self.geojson_export.export(mock_qs, self.sample_extra_data)

        assert isinstance(response, StreamingHttpResponse)
        assert response["Content-Type"] == "application/geo+json"
        assert response["Content-Disposition"] == 'attachment; filename="measurements.geojson"'

        # Collect streamed content
        content = b"".join(response.streaming_content).decode("utf-8")
        data = json.loads(content)

        assert data["type"] == "FeatureCollection"
        assert len(data["features"]) == 2

    def test_geojson_feature_creation(self):
        """Test _feature method."""
        item = {"id": 1, "latitude": 52.0, "longitude": 4.5, "water_source": "well", "metrics": [], "campaigns": []}

        feature = self.geojson_export._feature(item)

        assert feature["type"] == "Feature"
        assert feature["geometry"]["type"] == "Point"
        assert feature["geometry"]["coordinates"] == [4.5, 52.0]
        assert "latitude" not in feature["properties"]
        assert "longitude" not in feature["properties"]
        assert "water_source" in feature["properties"]

    def test_geojson_feature_missing_coordinates(self):
        """Test _feature method with missing coordinates."""
        item_no_lat = {"id": 1, "longitude": 4.5}
        item_no_lon = {"id": 1, "latitude": 52.0}
        item_no_coords = {"id": 1}

        assert self.geojson_export._feature(item_no_lat) is None
        assert self.geojson_export._feature(item_no_lon) is None
        assert self.geojson_export._feature(item_no_coords) is None

    def test_geojson_export_filters_invalid_features(self):
        """Test that GeoJSON export filters out features with invalid coordinates."""
        data_with_invalid = [*self.sample_data, {"id": 3, "water_source": "well"}]
        response = self.geojson_export.export(data_with_invalid, None)
        data = json.loads(response.content.decode("utf-8"))

        # Should only have 2 valid features, not 3
        assert len(data["features"]) == 2


class XmlExportTests(ExportStrategiesBaseTests):
    """Test cases for XML export strategy."""

    def setUp(self):
        super().setUp()
        self.xml_export = XmlExport()

    def test_xml_export_inheritance(self):
        """Test that XmlExport inherits from ExportStrategy."""
        assert isinstance(self.xml_export, ExportStrategy)

    def test_xml_export_with_list_data(self):
        """Test XML export with list data."""
        response = self.xml_export.export(self.sample_data, self.sample_extra_data)

        assert isinstance(response, HttpResponse)
        assert response["Content-Type"] == "application/xml"
        assert response["Content-Disposition"] == 'attachment; filename="measurements.xml"'

        # Parse XML content
        root = ET.fromstring(response.content.decode("utf-8"))

        assert root.tag == "measurements"
        measurements = root.findall("measurement")
        assert len(measurements) == 2

        # Check first measurement structure
        first_measurement = measurements[0]
        assert first_measurement.find("metrics") is not None
        assert first_measurement.find("campaigns") is not None
        assert first_measurement.find("latitude") is not None
        assert first_measurement.find("longitude") is not None

    def test_xml_export_with_queryset(self):
        """Test XML export with QuerySet (always builds full XML)."""
        mock_qs = MockQuerySet(self.sample_data)
        response = self.xml_export.export(mock_qs, self.sample_extra_data)

        assert isinstance(response, HttpResponse)  # Always HttpResponse, never streaming

        root = ET.fromstring(response.content.decode("utf-8"))
        measurements = root.findall("measurement")
        assert len(measurements) == 2

    def test_xml_append_measurement_with_metrics(self):
        """Test _append_measurement method with metrics."""
        root = ET.Element("test")
        item = {
            "id": 1,
            "water_source": "well",
            "metrics": [{"sensor": "Test", "value": 25.5}],
            "campaigns": ["Test Campaign"],
            "latitude": 52.0,
            "longitude": 4.5,
        }

        self.xml_export._append_measurement(root, item)

        # Check structure
        assert root.find("metrics") is not None
        assert root.find("campaigns") is not None
        assert root.find("water_source") is not None
        assert root.find("latitude") is not None
        assert root.find("longitude") is not None

        # Check metrics structure
        metrics = root.find("metrics")
        metric = metrics.find("metric")
        assert metric.find("sensor").text == "Test"
        assert metric.find("value").text == "25.5"

    def test_xml_append_measurement_empty_metrics(self):
        """Test _append_measurement method with empty metrics."""
        root = ET.Element("test")
        item = {"id": 1, "water_source": "well", "metrics": [], "campaigns": [], "latitude": 52.0, "longitude": 4.5}

        self.xml_export._append_measurement(root, item)

        # Should not have metrics or campaigns elements when empty
        assert root.find("metrics") is None
        assert root.find("campaigns") is None
        assert root.find("water_source") is not None


class PrettifyXmlTests(TestCase):
    """Test cases for prettify_xml function."""

    def test_prettify_xml_basic(self):
        """Test prettify_xml with basic XML element."""
        root = ET.Element("root")
        child = ET.SubElement(root, "child")
        child.text = "test"

        result = prettify_xml(root)

        assert isinstance(result, bytes)
        xml_str = result.decode("utf-8")
        assert "<?xml" in xml_str
        assert "<root>" in xml_str
        assert "<child>test</child>" in xml_str
        assert "</root>" in xml_str

    def test_prettify_xml_nested(self):
        """Test prettify_xml with nested elements."""
        root = ET.Element("root")
        parent = ET.SubElement(root, "parent")
        child = ET.SubElement(parent, "child")
        child.text = "nested"

        result = prettify_xml(root)
        xml_str = result.decode("utf-8")

        # Check that indentation is present (2 spaces)
        lines = xml_str.split("\n")
        indented_lines = [line for line in lines if line.startswith("  ")]
        assert len(indented_lines) > 0


class ExportStrategiesErrorHandlingTests(TestCase):
    """Test error handling in export strategies."""

    def test_csv_export_with_malformed_data(self):
        """Test CSV export handles malformed data gracefully."""
        malformed_data = [
            {"id": 1, "complex_field": {"nested": "value"}},
            {"id": 2, "list_field": [1, 2, 3]},
        ]

        csv_export = CsvExport()
        response = csv_export.export(malformed_data, None)

        # Should not raise an exception
        assert isinstance(response, HttpResponse)

        # Complex fields should be JSON serialized
        content = response.content.decode("utf-8")
        assert '"nested"' in content  # JSON serialized nested dict
        assert "[1, 2, 3]" in content  # JSON serialized list

    def test_geojson_export_with_string_coordinates(self):
        """Test GeoJSON export handles string coordinates."""
        data_with_string_coords = [
            {
                "id": 1,
                "latitude": "52.0",  # String instead of float
                "longitude": "4.5",  # String instead of float
                "water_source": "well",
            }
        ]

        geojson_export = GeoJsonExport()
        response = geojson_export.export(data_with_string_coords, None)

        data = json.loads(response.content.decode("utf-8"))
        feature = data["features"][0]

        # Should convert to float
        assert feature["geometry"]["coordinates"] == [4.5, 52.0]

    def test_xml_export_with_special_characters(self):
        """Test XML export handles special characters properly."""
        data_with_special_chars = [
            {
                "id": 1,
                "description": 'Test with <special> & characters "quotes"',
                "metrics": [],
                "campaigns": [],
            }
        ]

        xml_export = XmlExport()
        response = xml_export.export(data_with_special_chars, None)

        # Should not raise an exception and should be valid XML
        root = ET.fromstring(response.content.decode("utf-8"))
        measurement = root.find("measurement")
        description = measurement.find("description")

        # XML should properly escape special characters
        assert description.text is not None
