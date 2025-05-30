"""Tests for exporting measurement Endpoints."""

import json
import xml.etree.ElementTree as ET
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from django.db import connection
from django.test import TestCase
from measurements.models import Measurement, Temperature


class ExportMeasurementTests(TestCase):
    """Test cases for exporting measurement Endpoints."""

    @classmethod
    def setUpTestData(cls):
        """Set up test data for the test cases."""
        user = get_user_model()
        cls.superuser = user.objects.create_superuser(
            username="testsuperuser", email="superuser@example.com", password="superpassword"
        )

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
                    'Moldova',
                    'Europe',
                    ST_GeomFromText('POLYGON((2 2, 3 2, 3 3, 2 3, 2 2))', 4326)
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
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS measurements_testmetric (
                    id SERIAL PRIMARY KEY,
                    measurement_id INTEGER REFERENCES measurements_measurement(id),
                    test_metric VARCHAR(255)
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
        cls.measurement3 = Measurement.objects.create(
            location=Point(2.5, 2.5),
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
        cls.temperature3 = Temperature.objects.create(
            measurement=cls.measurement3,
            sensor="Third Test Sensor",
            value=40.2,
            time_waited=timedelta(seconds=1),
        )

    def setUp(self):
        self.client.login(username="testsuperuser", password="superpassword")

    def test_source_filter(self):
        payload = {
            "location[continents]": ["Europe"],
            "location[countries]": ["Netherlands", "Moldova"],
            "measurements_included": ["waterSources", "temperature"],
            "measurements[waterSources]": ["Network"],
            "format": "xml",
        }
        response = self.client.post(
            "/api/measurements/search/", data=json.dumps(payload), content_type="application/json"
        )
        root = ET.fromstring(response.content)

        assert root.tag == "measurements"
        entries = root.findall("measurement")
        assert len(entries) == 0

        Measurement.objects.all().delete()
        Temperature.objects.all().delete()
        self.measurement1 = Measurement.objects.create(
            local_date="2025-05-25",
            local_time="14:30:00",
            location=Point(2.5, 2.5),
            flag=False,
            water_source="Well",
        )
        self.temperature1 = Temperature.objects.create(
            measurement=self.measurement1,
            sensor="Test Sensor",
            value=40.0,
            time_waited=timedelta(seconds=1),
        )
        self.measurement2 = Measurement.objects.create(
            local_date="2025-04-25",
            local_time="12:30:00",
            location=Point(0.5, 0.5),
            flag=False,
            water_source="network",
        )
        self.temperature2 = Temperature.objects.create(
            measurement=self.measurement2,
            sensor="Test Second Sensor",
            value=20.0,
            time_waited=timedelta(seconds=10),
        )
        payload = {
            "location[continents]": ["Europe"],
            "location[countries]": ["Netherlands", "Moldova"],
            "measurements_included": ["waterSources", "temperature"],
            "measurements[waterSources]": ["Network"],
            "format": "xml",
        }
        response = self.client.post(
            "/api/measurements/search/", data=json.dumps(payload), content_type="application/json"
        )
        root = ET.fromstring(response.content)

        assert root.tag == "measurements"
        entries = root.findall("measurement")
        print(entries)
        assert len(entries) == 1

        first = entries[0]

        first_value = first.find("metrics/metric/value").text
        first_sensor = first.find("metrics/metric/sensor").text
        assert float(first_value) == 20.0
        assert first_sensor == "Test Second Sensor"
        assert first.find("country").text == "Netherlands"

    def test_time_filter_multiple(self):
        Measurement.objects.all().delete()
        Temperature.objects.all().delete()
        self.measurement1 = Measurement.objects.create(
            local_date="2025-05-25",
            local_time="14:30:00",
            location=Point(2.5, 2.5),
            flag=False,
            water_source="Well",
        )
        self.temperature1 = Temperature.objects.create(
            measurement=self.measurement1,
            sensor="Test Sensor",
            value=40.0,
            time_waited=timedelta(seconds=1),
        )
        self.measurement2 = Measurement.objects.create(
            local_date="2025-04-25",
            local_time="12:30:00",
            location=Point(0.5, 0.5),
            flag=False,
            water_source="Well",
        )
        self.temperature2 = Temperature.objects.create(
            measurement=self.measurement2,
            sensor="Test Second Sensor",
            value=20.0,
            time_waited=timedelta(seconds=10),
        )
        payload = {
            "location[continents]": ["Europe"],
            "location[countries]": ["Netherlands", "Moldova"],
            "measurements_included": ["waterSources", "temperature"],
            "times": [{"from": "12:15", "to": "13:15"}, {"from": "14:15", "to": "15:15"}],
            "format": "xml",
        }
        response = self.client.post(
            "/api/measurements/search/", data=json.dumps(payload), content_type="application/json"
        )
        root = ET.fromstring(response.content)

        assert root.tag == "measurements"
        entries = root.findall("measurement")
        assert len(entries) == 2

        first = entries[1]
        second = entries[0]

        first_value = first.find("metrics/metric/value").text
        first_sensor = first.find("metrics/metric/sensor").text
        assert float(first_value) == 20.0
        assert first_sensor == "Test Second Sensor"
        assert first.find("country").text == "Netherlands"

        second_value = second.find("metrics/metric/value").text
        second_sensor = second.find("metrics/metric/sensor").text
        assert float(second_value) == 40.0
        assert second_sensor == "Test Sensor"
        assert second.find("country").text == "Moldova"

    def test_time_filter_singular(self):
        Measurement.objects.all().delete()
        Temperature.objects.all().delete()
        self.measurement1 = Measurement.objects.create(
            local_date="2025-05-25",
            local_time="14:30:00",
            location=Point(2.5, 2.5),
            flag=False,
            water_source="Well",
        )
        self.temperature1 = Temperature.objects.create(
            measurement=self.measurement1,
            sensor="Test Sensor",
            value=40.0,
            time_waited=timedelta(seconds=1),
        )
        self.measurement2 = Measurement.objects.create(
            local_date="2025-04-25",
            local_time="12:30:00",
            location=Point(0.5, 0.5),
            flag=False,
            water_source="Well",
        )
        self.temperature2 = Temperature.objects.create(
            measurement=self.measurement2,
            sensor="Test Second Sensor",
            value=20.0,
            time_waited=timedelta(seconds=10),
        )
        payload = {
            "location[continents]": ["Europe"],
            "location[countries]": ["Netherlands", "Moldova"],
            "measurements_included": ["waterSources", "temperature"],
            "times": [{"from": "12:15", "to": "13:15"}],
            "format": "xml",
        }
        response = self.client.post(
            "/api/measurements/search/", data=json.dumps(payload), content_type="application/json"
        )
        root = ET.fromstring(response.content)

        assert root.tag == "measurements"
        entries = root.findall("measurement")
        assert len(entries) == 1

        first = entries[0]

        first_value = first.find("metrics/metric/value").text
        first_sensor = first.find("metrics/metric/sensor").text
        assert float(first_value) == 20.0
        assert first_sensor == "Test Second Sensor"
        assert first.find("country").text == "Netherlands"

    def test_date_filter_(self):
        Measurement.objects.all().delete()
        Temperature.objects.all().delete()
        self.measurement1 = Measurement.objects.create(
            local_date="2025-05-25",
            local_time="14:30:00",
            location=Point(2.5, 2.5),
            flag=False,
            water_source="Well",
        )
        self.temperature1 = Temperature.objects.create(
            measurement=self.measurement1,
            sensor="Test Sensor",
            value=40.0,
            time_waited=timedelta(seconds=1),
        )
        self.measurement2 = Measurement.objects.create(
            local_date="2025-04-25",
            local_time="14:30:00",
            location=Point(0.5, 0.5),
            flag=False,
            water_source="Well",
        )
        self.temperature2 = Temperature.objects.create(
            measurement=self.measurement2,
            sensor="Test Second Sensor",
            value=20.0,
            time_waited=timedelta(seconds=10),
        )
        payload = {
            "location[continents]": ["Europe", "The Ocean"],
            "location[countries]": ["Netherlands", "Moldova", "Atlantis"],
            "measurements_included": ["waterSources", "temperature"],
            "dateRange[from]": "2025-05-24",
            "dateRange[to]": "2025-05-25",
            "format": "xml",
        }
        response = self.client.post(
            "/api/measurements/search/", data=json.dumps(payload), content_type="application/json"
        )
        root = ET.fromstring(response.content)

        assert root.tag == "measurements"
        entries = root.findall("measurement")
        assert len(entries) == 1

        first = entries[0]

        first_value = first.find("metrics/metric/value").text
        first_sensor = first.find("metrics/metric/sensor").text
        assert float(first_value) == 40.0
        assert first_sensor == "Test Sensor"
        assert first.find("country").text == "Moldova"

    def test_temp_filter(self):
        self.measurement4 = Measurement.objects.create(
            location=Point(2.5, 2.5),
            flag=True,
            water_source="tap",
        )
        self.temperature4 = Temperature.objects.create(
            measurement=self.measurement4,
            sensor="Fourth Test Sensor",
            value=12.0,
            time_waited=timedelta(seconds=1),
        )
        payload = {
            "location[continents]": ["Europe", "The Ocean"],
            "location[countries]": ["Netherlands", "Moldova", "Atlantis"],
            "measurements_included": ["waterSources", "temperature"],
            "measurements[temperature][from]": 12,
            "measurements[temperature][to]": 40.1,
            "format": "xml",
        }
        response = self.client.post(
            "/api/measurements/search/", data=json.dumps(payload), content_type="application/json"
        )
        root = ET.fromstring(response.content)

        assert root.tag == "measurements"
        entries = root.findall("measurement")
        assert len(entries) == 3

        first = entries[0]
        second = entries[1]
        third = entries[2]

        first_value = first.find("metrics/metric/value").text
        first_sensor = first.find("metrics/metric/sensor").text
        assert float(first_value) == 40.0
        assert first_sensor == "Test Sensor"
        assert first.find("country").text == "Netherlands"

        second_value = second.find("metrics/metric/value").text
        second_sensor = second.find("metrics/metric/sensor").text
        assert float(second_value) == 40.1
        assert second_sensor == "Second Test Sensor"
        assert second.find("country").text == "Atlantis"

        third_value = third.find("metrics/metric/value").text
        third_sensor = third.find("metrics/metric/sensor").text
        assert float(third_value) == 12
        assert third_sensor == "Fourth Test Sensor"
        assert third.find("country").text == "Moldova"

    def test_country_filter(self):
        payload = {
            "location[continents]": ["Europe"],
            "location[countries]": ["Netherlands"],
            "measurements_included": ["waterSources", "temperature"],
            "format": "xml",
        }
        response = self.client.post(
            "/api/measurements/search/", data=json.dumps(payload), content_type="application/json"
        )
        root = ET.fromstring(response.content)

        assert root.tag == "measurements"
        entries = root.findall("measurement")
        assert len(entries) == 1

        first = entries[0]

        first_value = first.find("metrics/metric/value").text
        first_sensor = first.find("metrics/metric/sensor").text
        assert float(first_value) == 40.0
        assert first_sensor == "Test Sensor"
        assert first.find("country").text == "Netherlands"

    def test_continent_filter(self):
        payload = {
            "location[continents]": ["Europe"],
            "location[countries]": [
                "\xc3\x85land",
                "Albania",
                "Andorra",
                "Austria",
                "Belarus",
                "Belgium",
                "Bosnia and Herzegovina",
                "Bulgaria",
                "Croatia",
                "Czech Republic",
                "Denmark",
                "Estonia",
                "Faroe Islands",
                "Finland",
                "France",
                "Germany",
                "Gibraltar",
                "Greece",
                "Guernsey",
                "Hungary",
                "Iceland",
                "Ireland",
                "Isle of Man",
                "Italy",
                "Jersey",
                "Kosovo",
                "Latvia",
                "Liechtenstein",
                "Lithuania",
                "Luxembourg",
                "Malta",
                "Moldova",
                "Monaco",
                "Montenegro",
                "Netherlands",
                "North Macedonia",
                "Norway",
                "Poland",
                "Portugal",
                "Romania",
                "Russia",
                "San Marino",
                "Serbia",
                "Slovakia",
                "Slovenia",
                "Spain",
                "Sweden",
                "Switzerland",
                "Ukraine",
                "United Kingdom",
                "Vatican City",
            ],
            "measurements_included": ["waterSources", "temperature"],
            "format": "xml",
        }
        response = self.client.post(
            "/api/measurements/search/", data=json.dumps(payload), content_type="application/json"
        )
        root = ET.fromstring(response.content)

        assert root.tag == "measurements"
        entries = root.findall("measurement")
        assert len(entries) == 2

        first = entries[0]

        first_value = first.find("metrics/metric/value").text
        first_sensor = first.find("metrics/metric/sensor").text
        assert float(first_value) == 40.0
        assert first_sensor == "Test Sensor"
        assert first.find("country").text == "Netherlands"

        second = entries[1]
        second_value = second.find("metrics/metric/value").text
        second_sensor = second.find("metrics/metric/sensor").text
        assert float(second_value) == 40.2
        assert second_sensor == "Third Test Sensor"
        assert second.find("country").text == "Moldova"

    def test_empty_export_xml(self):
        Measurement.objects.all().delete()
        Temperature.objects.all().delete()
        payload = {
            "filters": {},
            "measurements_included": ["temperature"],
            "format": "xml",
        }
        response = self.client.post(
            "/api/measurements/search/", data=json.dumps(payload), content_type="application/json"
        )
        assert response.status_code == 200
        root = ET.fromstring(response.content)

        assert root.tag == "measurements"
        entries = root.findall("measurement")
        assert len(entries) == 0

    def test_export_measurements_xml(self):
        payload = {
            "filters": {
                "location[continents]": [
                    "Africa",
                    "Antarctica",
                    "Asia",
                    "Europe",
                    "North America",
                    "Oceania",
                    "The Ocean",
                    "South America",
                ],
                "location[countries]": [
                    "Uzbekistan",
                    "Vietnam",
                    "Wake Island",
                    "Yemen",
                    "\xc3\x85land",
                    "Albania",
                    "Andorra",
                    "Austria",
                    "Belarus",
                    "Belgium",
                    "Bosnia and Herzegovina",
                    "Bulgaria",
                    "Croatia",
                    "Czech Republic",
                    "Denmark",
                    "Estonia",
                    "Faroe Islands",
                    "Finland",
                    "France",
                    "Germany",
                    "Gibraltar",
                    "Greece",
                    "Guernsey",
                    "Hungary",
                    "Iceland",
                    "Ireland",
                    "Isle of Man",
                    "Italy",
                    "Jersey",
                    "Kosovo",
                    "Latvia",
                    "Liechtenstein",
                    "Lithuania",
                    "Luxembourg",
                    "Malta",
                    "Moldova",
                    "Monaco",
                    "Montenegro",
                    "Netherlands",
                    "North Macedonia",
                    "Norway",
                    "Poland",
                    "Portugal",
                    "Romania",
                    "Russia",
                    "San Marino",
                    "Serbia",
                    "Slovakia",
                    "Slovenia",
                    "Spain",
                    "Sweden",
                    "Switzerland",
                    "Ukraine",
                    "United Kingdom",
                    "Vatican City",
                    "Anguilla",
                    "Antigua and Barbuda",
                    "Aruba",
                    "Bajo Nuevo Bank",
                    "Barbados",
                    "Belize",
                    "Bermuda",
                    "British Virgin Islands",
                    "Canada",
                    "Cayman Islands",
                    "Costa Rica",
                    "Cuba",
                    "Cura\xc3\xa7ao",
                    "Dominica",
                    "Dominican Republic",
                    "El Salvador",
                    "Greenland",
                    "Grenada",
                    "Guantanamo Bay Naval Base",
                    "Guatemala",
                    "Haiti",
                    "Honduras",
                    "Jamaica",
                    "Mexico",
                    "Montserrat",
                    "Nicaragua",
                    "Panama",
                    "Puerto Rico",
                    "Saint Barth\xc3\xa9lemy",
                    "Saint Kitts and Nevis",
                    "Saint Lucia",
                    "Saint Martin",
                    "Saint Pierre and Miquelon",
                    "Saint Vincent and the Grenadines",
                    "Serranilla Bank",
                    "Sint Maarten",
                    "The Bahamas",
                    "Trinidad and Tobago",
                    "Turks and Caicos Islands",
                    "United States Minor Outlying Islands",
                    "United States of America",
                    "United States Virgin Islands",
                    "American Samoa",
                    "Ashmore and Cartier Islands",
                    "Australia",
                    "Cook Islands",
                    "Coral Sea Islands",
                    "Federated States of Micronesia",
                    "Fiji",
                    "Atlantis",
                ],
            },
            "measurements_included": ["waterSources", "temperature"],
            "format": "xml",
        }
        response = self.client.post(
            "/api/measurements/search/", data=json.dumps(payload), content_type="application/json"
        )
        assert response.status_code == 200

        root = ET.fromstring(response.content)

        assert root.tag == "measurements"
        entries = root.findall("measurement")
        assert len(entries) == 3

        first = entries[0]
        second = entries[1]
        third = entries[2]

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
        assert third.find("country").text == "Moldova"

    def test_empty_export_csv(self):
        import csv
        import io

        Measurement.objects.all().delete()
        Temperature.objects.all().delete()
        payload = {
            "filters": {},
            "measurements_included": ["temperature"],
            "format": "csv",
        }
        response = self.client.post(
            "/api/measurements/search/", data=json.dumps(payload), content_type="application/json"
        )

        content = response.content.decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))

        rows = list(reader)
        assert len(rows) == 0

    def test_export_measurements_csv(self):
        import csv
        import io

        payload = {
            "filters": {
                "location[continents]": [
                    "Africa",
                    "Antarctica",
                    "Asia",
                    "Europe",
                    "North America",
                    "Oceania",
                    "The Ocean",
                    "South America",
                ],
                "location[countries]": [
                    "Uzbekistan",
                    "Vietnam",
                    "Wake Island",
                    "Yemen",
                    "\xc3\x85land",
                    "Albania",
                    "Andorra",
                    "Austria",
                    "Belarus",
                    "Belgium",
                    "Bosnia and Herzegovina",
                    "Bulgaria",
                    "Croatia",
                    "Czech Republic",
                    "Denmark",
                    "Estonia",
                    "Faroe Islands",
                    "Finland",
                    "France",
                    "Germany",
                    "Gibraltar",
                    "Greece",
                    "Guernsey",
                    "Hungary",
                    "Iceland",
                    "Ireland",
                    "Isle of Man",
                    "Italy",
                    "Jersey",
                    "Kosovo",
                    "Latvia",
                    "Liechtenstein",
                    "Lithuania",
                    "Luxembourg",
                    "Malta",
                    "Moldova",
                    "Monaco",
                    "Montenegro",
                    "Netherlands",
                    "North Macedonia",
                    "Norway",
                    "Poland",
                    "Portugal",
                    "Romania",
                    "Russia",
                    "San Marino",
                    "Serbia",
                    "Slovakia",
                    "Slovenia",
                    "Spain",
                    "Sweden",
                    "Switzerland",
                    "Ukraine",
                    "United Kingdom",
                    "Vatican City",
                    "Anguilla",
                    "Antigua and Barbuda",
                    "Aruba",
                    "Bajo Nuevo Bank",
                    "Barbados",
                    "Belize",
                    "Bermuda",
                    "British Virgin Islands",
                    "Canada",
                    "Cayman Islands",
                    "Costa Rica",
                    "Cuba",
                    "Cura\xc3\xa7ao",
                    "Dominica",
                    "Dominican Republic",
                    "El Salvador",
                    "Greenland",
                    "Grenada",
                    "Guantanamo Bay Naval Base",
                    "Guatemala",
                    "Haiti",
                    "Honduras",
                    "Jamaica",
                    "Mexico",
                    "Montserrat",
                    "Nicaragua",
                    "Panama",
                    "Puerto Rico",
                    "Saint Barth\xc3\xa9lemy",
                    "Saint Kitts and Nevis",
                    "Saint Lucia",
                    "Saint Martin",
                    "Saint Pierre and Miquelon",
                    "Saint Vincent and the Grenadines",
                    "Serranilla Bank",
                    "Sint Maarten",
                    "The Bahamas",
                    "Trinidad and Tobago",
                    "Turks and Caicos Islands",
                    "United States Minor Outlying Islands",
                    "United States of America",
                    "United States Virgin Islands",
                    "American Samoa",
                    "Ashmore and Cartier Islands",
                    "Australia",
                    "Cook Islands",
                    "Coral Sea Islands",
                    "Federated States of Micronesia",
                    "Fiji",
                    "Atlantis",
                ],
            },
            "measurements_included": ["waterSources", "temperature"],
            "format": "csv",
        }
        response = self.client.post(
            "/api/measurements/search/", data=json.dumps(payload), content_type="application/json"
        )
        assert response.status_code == 200

        content = response.content.decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))

        rows = list(reader)
        assert len(rows) == 3
        m1 = rows[0]
        m2 = rows[1]
        m3 = rows[2]

        assert m1["country"] == "Netherlands"
        assert m1["continent"] == "Europe"
        assert m2["country"] == "Atlantis"
        assert m2["continent"] == "The Ocean"
        assert m3["country"] == "Moldova"

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
        payload = {
            "filters": {},
            "measurements_included": ["temperature"],
            "format": "json",
        }
        response = self.client.post(
            "/api/measurements/search/", data=json.dumps(payload), content_type="application/json"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0

    def test_export_measurements_json(self):
        payload = {
            "filters": {
                "location[continents]": [
                    "Africa",
                    "Antarctica",
                    "Asia",
                    "Europe",
                    "North America",
                    "Oceania",
                    "The Ocean",
                    "South America",
                ],
                "location[countries]": [
                    "Uzbekistan",
                    "Vietnam",
                    "Wake Island",
                    "Yemen",
                    "\xc3\x85land",
                    "Albania",
                    "Andorra",
                    "Austria",
                    "Belarus",
                    "Belgium",
                    "Bosnia and Herzegovina",
                    "Bulgaria",
                    "Croatia",
                    "Czech Republic",
                    "Denmark",
                    "Estonia",
                    "Faroe Islands",
                    "Finland",
                    "France",
                    "Germany",
                    "Gibraltar",
                    "Greece",
                    "Guernsey",
                    "Hungary",
                    "Iceland",
                    "Ireland",
                    "Isle of Man",
                    "Italy",
                    "Jersey",
                    "Kosovo",
                    "Latvia",
                    "Liechtenstein",
                    "Lithuania",
                    "Luxembourg",
                    "Malta",
                    "Moldova",
                    "Monaco",
                    "Montenegro",
                    "Netherlands",
                    "North Macedonia",
                    "Norway",
                    "Poland",
                    "Portugal",
                    "Romania",
                    "Russia",
                    "San Marino",
                    "Serbia",
                    "Slovakia",
                    "Slovenia",
                    "Spain",
                    "Sweden",
                    "Switzerland",
                    "Ukraine",
                    "United Kingdom",
                    "Vatican City",
                    "Anguilla",
                    "Antigua and Barbuda",
                    "Aruba",
                    "Bajo Nuevo Bank",
                    "Barbados",
                    "Belize",
                    "Bermuda",
                    "British Virgin Islands",
                    "Canada",
                    "Cayman Islands",
                    "Costa Rica",
                    "Cuba",
                    "Cura\xc3\xa7ao",
                    "Dominica",
                    "Dominican Republic",
                    "El Salvador",
                    "Greenland",
                    "Grenada",
                    "Guantanamo Bay Naval Base",
                    "Guatemala",
                    "Haiti",
                    "Honduras",
                    "Jamaica",
                    "Mexico",
                    "Montserrat",
                    "Nicaragua",
                    "Panama",
                    "Puerto Rico",
                    "Saint Barth\xc3\xa9lemy",
                    "Saint Kitts and Nevis",
                    "Saint Lucia",
                    "Saint Martin",
                    "Saint Pierre and Miquelon",
                    "Saint Vincent and the Grenadines",
                    "Serranilla Bank",
                    "Sint Maarten",
                    "The Bahamas",
                    "Trinidad and Tobago",
                    "Turks and Caicos Islands",
                    "United States Minor Outlying Islands",
                    "United States of America",
                    "United States Virgin Islands",
                    "American Samoa",
                    "Ashmore and Cartier Islands",
                    "Australia",
                    "Cook Islands",
                    "Coral Sea Islands",
                    "Federated States of Micronesia",
                    "Fiji",
                    "Atlantis",
                ],
            },
            "measurements_included": ["waterSources", "temperature"],
            "format": "json",
        }
        response = self.client.post(
            "/api/measurements/search/", data=json.dumps(payload), content_type="application/json"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        m1 = data[0]
        m2 = data[1]
        m3 = data[2]

        assert m1["country"] == "Netherlands"
        assert m1["continent"] == "Europe"
        assert m2["country"] == "Atlantis"
        assert m2["continent"] == "The Ocean"
        assert m3["country"] == "Moldova"

        m1_metric = m1["metrics"][0]
        m2_metric = m2["metrics"][0]

        assert m1_metric["value"] == 40.0
        assert m1_metric["sensor"] == "Test Sensor"

        assert m2_metric["value"] == 40.1
        assert m2_metric["sensor"] == "Second Test Sensor"

    def test_empty_export_geojson(self):
        Measurement.objects.all().delete()
        Temperature.objects.all().delete()
        payload = {
            "filters": {},
            "measurements_included": ["temperature"],
            "format": "geojson",
        }
        response = self.client.post(
            "/api/measurements/search/", data=json.dumps(payload), content_type="application/json"
        )
        assert response.status_code == 200

        data = response.json()
        assert data["type"] == "FeatureCollection"
        features = data["features"]
        assert len(features) == 0

    def test_export_measurements_geojson(self):
        payload = {
            "filters": {
                "location[continents]": [
                    "Africa",
                    "Antarctica",
                    "Asia",
                    "Europe",
                    "North America",
                    "Oceania",
                    "The Ocean",
                    "South America",
                ],
                "location[countries]": [
                    "Uzbekistan",
                    "Vietnam",
                    "Wake Island",
                    "Yemen",
                    "\xc3\x85land",
                    "Albania",
                    "Andorra",
                    "Austria",
                    "Belarus",
                    "Belgium",
                    "Bosnia and Herzegovina",
                    "Bulgaria",
                    "Croatia",
                    "Czech Republic",
                    "Denmark",
                    "Estonia",
                    "Faroe Islands",
                    "Finland",
                    "France",
                    "Germany",
                    "Gibraltar",
                    "Greece",
                    "Guernsey",
                    "Hungary",
                    "Iceland",
                    "Ireland",
                    "Isle of Man",
                    "Italy",
                    "Jersey",
                    "Kosovo",
                    "Latvia",
                    "Liechtenstein",
                    "Lithuania",
                    "Luxembourg",
                    "Malta",
                    "Moldova",
                    "Monaco",
                    "Montenegro",
                    "Netherlands",
                    "North Macedonia",
                    "Norway",
                    "Poland",
                    "Portugal",
                    "Romania",
                    "Russia",
                    "San Marino",
                    "Serbia",
                    "Slovakia",
                    "Slovenia",
                    "Spain",
                    "Sweden",
                    "Switzerland",
                    "Ukraine",
                    "United Kingdom",
                    "Vatican City",
                    "Anguilla",
                    "Antigua and Barbuda",
                    "Aruba",
                    "Bajo Nuevo Bank",
                    "Barbados",
                    "Belize",
                    "Bermuda",
                    "British Virgin Islands",
                    "Canada",
                    "Cayman Islands",
                    "Costa Rica",
                    "Cuba",
                    "Cura\xc3\xa7ao",
                    "Dominica",
                    "Dominican Republic",
                    "El Salvador",
                    "Greenland",
                    "Grenada",
                    "Guantanamo Bay Naval Base",
                    "Guatemala",
                    "Haiti",
                    "Honduras",
                    "Jamaica",
                    "Mexico",
                    "Montserrat",
                    "Nicaragua",
                    "Panama",
                    "Puerto Rico",
                    "Saint Barth\xc3\xa9lemy",
                    "Saint Kitts and Nevis",
                    "Saint Lucia",
                    "Saint Martin",
                    "Saint Pierre and Miquelon",
                    "Saint Vincent and the Grenadines",
                    "Serranilla Bank",
                    "Sint Maarten",
                    "The Bahamas",
                    "Trinidad and Tobago",
                    "Turks and Caicos Islands",
                    "United States Minor Outlying Islands",
                    "United States of America",
                    "United States Virgin Islands",
                    "American Samoa",
                    "Ashmore and Cartier Islands",
                    "Australia",
                    "Cook Islands",
                    "Coral Sea Islands",
                    "Federated States of Micronesia",
                    "Fiji",
                    "Atlantis",
                ],
            },
            "measurements_included": ["waterSources", "temperature"],
            "format": "geojson",
        }
        response = self.client.post(
            "/api/measurements/search/", data=json.dumps(payload), content_type="application/json"
        )
        assert response.status_code == 200

        data = response.json()
        assert data["type"] == "FeatureCollection"
        features = data["features"]
        assert len(features) == 3

        f1 = features[0]["properties"]
        f2 = features[1]["properties"]
        f3 = features[2]["properties"]

        assert f1["country"] == "Netherlands"
        assert f1["continent"] == "Europe"
        assert f1["metrics"][0]["value"] == 40.0
        assert f1["metrics"][0]["sensor"] == "Test Sensor"

        assert f2["country"] == "Atlantis"
        assert f2["continent"] == "The Ocean"
        assert f2["metrics"][0]["value"] == 40.1
        assert f2["metrics"][0]["sensor"] == "Second Test Sensor"

        assert f3["country"] == "Moldova"

    def test_unauthenticated_access(self):
        """Test that unauthenticated users cannot access the measurement export API."""
        self.client.logout()

        payload = {
            "location[continents]": ["Europe"],
            "location[countries]": ["Netherlands", "Moldova"],
            "measurements_included": ["waterSources", "temperature"],
            "measurements[waterSources]": ["Network"],
            "format": "xml",
        }

        response = self.client.post(
            "/api/measurements/search/", data=json.dumps(payload), content_type="application/json"
        )
        assert response.status_code == 403
