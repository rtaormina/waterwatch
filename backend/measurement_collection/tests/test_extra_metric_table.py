"""Tests for measurement collection Endpoints."""

import xml.etree.ElementTree as ET
from datetime import timedelta

from django.contrib.gis.geos import Point
from django.db import connection, models
from django.test import TestCase
from measurements.models import Measurement, Temperature


class TestMetric(models.Model):
    measurement = models.OneToOneField(Measurement, on_delete=models.CASCADE, null=False, default=None)
    test_metric = models.CharField(max_length=255)

    class Meta:
        """meta."""

        db_table = "measurements_testmetric"
        managed = False  # We manage the table manually in SQL

    def __str__(self):
        return f"testmetric: {self.test_metric} - {self.measurement}"


class ExtraMetricTableTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        """Set up test data for the test cases."""
        # delete all the data in measurements, temperature, and TestMetric tables
        Temperature.objects.all().delete()

        Measurement.objects.all().delete()

        with connection.cursor() as cursor:
            # add countries to the locations table
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

            # create the extra metric table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS measurements_testmetric (
                    id SERIAL PRIMARY KEY,
                    measurement_id INTEGER REFERENCES measurements_measurement(id),
                    test_metric VARCHAR(255)
                );
            """)

            # add measurement with id 1
            cls.measurement1 = Measurement.objects.create(
                location=Point(1.5, 1.5),
                flag=True,
                water_source="tap",
            )

            # add temperature with measurement id 1
            cls.temperature1 = Temperature.objects.create(
                measurement=cls.measurement1,
                sensor="Test Sensor",
                value=40.0,
                time_waited=timedelta(seconds=1),
            )

            # add TestMetric with measurement id 1 using sql
            TestMetric.objects.create(measurement=cls.measurement1, test_metric="Test Metric 1")

            # add measurement with id 2
            cls.measurement2 = Measurement.objects.create(
                location=Point(2.5, 2.5),
                flag=False,
                water_source="well",
            )

            # add TestMetric with measurement id 2
            TestMetric.objects.create(measurement=cls.measurement2, test_metric="Test Metric 2")

    # testcase 1 --> test empty csv export
    def test_empty_export_xml(self):
        Temperature.objects.all().delete()
        TestMetric.objects.all().delete()
        Measurement.objects.all().delete()

        response = self.client.get("/api/measurements/?format=xml")
        assert response.status_code == 200
        root = ET.fromstring(response.content)

        assert root.tag == "measurements"
        entries = root.findall("measurement")
        assert len(entries) == 0

    # testcase 2 --> test if the measurement contains metric and temperature in columns xml
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
        first_test = first.find("metrics/metric/test_metric").text
        assert float(first_value) == 40.0
        assert first_sensor == "Test Sensor"
        assert first_test == "Test Metric 1"

        second_value = second.find("metrics/metric/test_metric").text
        assert second_value == "Test Metric 2"

    # testcase 3 --> test if the measurement contains metric and temperature in columns csv
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

        m1_metric = m1["metrics"]
        m2_metric = m2["metrics"]
        assert (
            m1_metric
            == '[{"metric_type": "temperature", "sensor": "Test Sensor", "value": 40.0, "time_waited": 1.0}, {"metric_type": "testmetric", "test_metric": "Test Metric 1"}]'
        )
        assert m2_metric == '[{"metric_type": "testmetric", "test_metric": "Test Metric 2"}]'

    # testcase 4 --> test if the measurement contains metric and temperature in columns json
    def test_export_measurements_json(self):
        response = self.client.get("/api/measurements/?format=json")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        m1 = data[0]
        m2 = data[1]

        m1_metric = m1["metrics"][0]
        m1_metric_2 = m1["metrics"][1]
        m2_metric = m2["metrics"][0]

        assert m1_metric["value"] == 40.0
        assert m1_metric["sensor"] == "Test Sensor"

        assert m1_metric_2["test_metric"] == "Test Metric 1"

        assert m2_metric["test_metric"] == "Test Metric 2"

    # testcase 5 --> test if the measurement contains metric and temperature in columns geojson
    def test_export_measurements_geojson(self):
        response = self.client.get("/api/measurements/?format=geojson")
        assert response.status_code == 200

        data = response.json()
        assert data["type"] == "FeatureCollection"
        features = data["features"]
        assert len(features) == 2

        f1 = features[0]["properties"]
        f2 = features[1]["properties"]

        assert f1["metrics"][0]["value"] == 40.0
        assert f1["metrics"][0]["sensor"] == "Test Sensor"
        assert f1["metrics"][1]["test_metric"] == "Test Metric 1"

        assert f2["metrics"][0]["test_metric"] == "Test Metric 2"
