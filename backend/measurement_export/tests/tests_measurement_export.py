"""Tests for exporting measurement Endpoints."""

import xml.etree.ElementTree as ET
from datetime import timedelta

from django.contrib.gis.geos import Point
from django.db import connection
from django.test import TestCase
from measurements.models import Measurement, Temperature


class ExportMeasurementTests(TestCase):
    """Test cases for exporting measurement Endpoints."""

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
            cursor.execute("""
                INSERT INTO locations (country_name, continent, geom)
                VALUES (
                    'Atlantis',
                    'The Ocean',
                    ST_GeomFromText('POLYGON((1 1, 2 1, 2 2, 1 2, 1 1))', 4326)
                );
            """)
        cls.measurement1 = Measurement.objects.create(
            location=Point(0.5, 0.5),
            flag=False,
            water_source="Well",
        )
        cls.measurement2 = Measurement.objects.create(
            location=Point(1.5, 1.5),
            flag=True,
            water_source="tap",
        )
        cls.temperature1 = Temperature.objects.create(
            measurement=cls.measurement1,
            sensor="Test Sensor",
            value=40.0,
            time_waited=timedelta(seconds=1),
        )
        cls.temperature2 = Temperature.objects.create(
            measurement=cls.measurement2,
            sensor="Second Test Sensor",
            value=40.1,
            time_waited=timedelta(seconds=1),
        )

    def test_empty_export_xml(self):
        Measurement.objects.all().delete()
        Temperature.objects.all().delete()
        response = self.client.get("/api/measurements/?format=xml")
        assert response.status_code == 200
        root = ET.fromstring(response.content)

        assert root.tag == "measurements"
        entries = root.findall("measurement")
        assert len(entries) == 0

    def test_export_measurements_xml(self):
        response = self.client.get("/api/measurements/?format=xml")
        assert response.status_code == 200

        root = ET.fromstring(response.content)

        assert root.tag == "measurements"
        entries = root.findall("measurement")
        assert len(entries) == 2

        first = entries[0]
        second = entries[1]

        first_value = first.find("metrics/metric/value").text
        first_sensor = first.find("metrics/metric/sensor").text
        assert float(first_value) == 40.0
        assert first_sensor == "Test Sensor"

        second_value = second.find("metrics/metric/value").text
        second_sensor = second.find("metrics/metric/sensor").text
        assert float(second_value) == 40.1
        assert second_sensor == "Second Test Sensor"

        assert first.find("country").text == "Netherlands"
        assert second.find("continent").text == "The Ocean"

    def test_empty_export_csv(self):
        import csv
        import io

        Measurement.objects.all().delete()
        Temperature.objects.all().delete()
        response = self.client.get("/api/measurements/?format=csv")
        assert response.status_code == 200

        content = response.content.decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))

        rows = list(reader)
        assert len(rows) == 0

    def test_export_measurements_csv(self):
        import csv
        import io

        response = self.client.get("/api/measurements/?format=csv")
        assert response.status_code == 200

        content = response.content.decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))

        rows = list(reader)
        assert len(rows) == 2
        m1 = rows[0]
        m2 = rows[1]

        assert m1["country"] == "Netherlands"
        assert m1["continent"] == "Europe"
        assert m2["country"] == "Atlantis"
        assert m2["continent"] == "The Ocean"

        m1_metric = m1["metrics"]
        m2_metric = m2["metrics"]
        assert (
            m1_metric == '[{"metric_type": "temperature", "sensor": "Test Sensor", "value": 40.0, "time_waited": 1.0}]'
        )
        assert (
            m2_metric
            == '[{"metric_type": "temperature", "sensor": "Second Test Sensor", "value": 40.1, "time_waited": 1.0}]'
        )

    def test_empty_export_json(self):
        Measurement.objects.all().delete()
        Temperature.objects.all().delete()
        response = self.client.get("/api/measurements/?format=json")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0

    def test_export_measurements_json(self):
        response = self.client.get("/api/measurements/?format=json")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        m1 = data[0]
        m2 = data[1]

        assert m1["country"] == "Netherlands"
        assert m1["continent"] == "Europe"
        assert m2["country"] == "Atlantis"
        assert m2["continent"] == "The Ocean"

        m1_metric = m1["metrics"][0]
        m2_metric = m2["metrics"][0]

        assert m1_metric["value"] == 40.0
        assert m1_metric["sensor"] == "Test Sensor"

        assert m2_metric["value"] == 40.1
        assert m2_metric["sensor"] == "Second Test Sensor"

    def test_empty_export_geojson(self):
        Measurement.objects.all().delete()
        Temperature.objects.all().delete()
        response = self.client.get("/api/measurements/?format=geojson")
        assert response.status_code == 200

        data = response.json()
        assert data["type"] == "FeatureCollection"
        features = data["features"]
        assert len(features) == 0

    def test_export_measurements_geojson(self):
        response = self.client.get("/api/measurements/?format=geojson")
        assert response.status_code == 200

        data = response.json()
        assert data["type"] == "FeatureCollection"
        features = data["features"]
        assert len(features) == 2

        f1 = features[0]["properties"]
        f2 = features[1]["properties"]

        assert f1["country"] == "Netherlands"
        assert f1["continent"] == "Europe"
        assert f1["metrics"][0]["value"] == 40.0
        assert f1["metrics"][0]["sensor"] == "Test Sensor"

        assert f2["country"] == "Atlantis"
        assert f2["continent"] == "The Ocean"
        assert f2["metrics"][0]["value"] == 40.1
        assert f2["metrics"][0]["sensor"] == "Second Test Sensor"
