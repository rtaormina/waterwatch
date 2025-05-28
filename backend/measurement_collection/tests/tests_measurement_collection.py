"""Tests for measurement collection Endpoints."""

from datetime import date, time, timedelta

from django.test import TestCase
from measurements.models import Measurement, Temperature


class CollectMeasurementTests(TestCase):
    """Test cases for measurement collection Endpoints."""

    @classmethod
    def setUpTestData(cls):
        """Set up test data for the test cases."""
        cls.payload_noflag = {
            "local_date": "2025-05-25",
            "local_time": "14:30:00",
            "location": {
                "type": "Point",
                "coordinates": [100, 110],
            },
            "water_source": "well",
            "temperature": {
                "sensor": "thermometer",
                "value": 15.5,
                "time_waited": "00:01:15",
            },
        }

        cls.payload_flag = {
            "local_date": "2025-05-25",
            "local_time": "14:30:00",
            "location": {
                "type": "Point",
                "coordinates": [100, 110],
            },
            "water_source": "well",
            "temperature": {
                "sensor": "thermometer",
                "value": 45.5,
                "time_waited": "00:01:15",
            },
        }

        cls.payload_temp_invalid = {
            "local_date": "2025-05-25",
            "local_time": "14:30:00",
            "location": {
                "type": "Point",
                "coordinates": [100, 110],
            },
            "water_source": "well",
            "temperature": {
                "value": 45.5,
                "time_waited": "00:01:15",
            },
        }

        cls.payload_meas_invalid = {
            "local_date": "2025-05-44",
            "local_time": "14:03:00",
            "location": {
                "type": "Point",
                "coordinates": [100, 110],
            },
            "water_source": "well",
            "temperature": {
                "sensor": "thermometer",
                "value": 45.5,
                "time_waited": "00:01:15",
            },
        }

    def test_save_measurement_flagged(self):
        response = self.client.post(
            "/api/measurements/",
            data=self.payload_flag,
            content_type="application/json",
        )

        assert response.status_code == 201
        assert Measurement.objects.count() == 1
        retrieved_meas = Measurement.objects.first()

        assert retrieved_meas.location.x == 100
        assert retrieved_meas.location.y == 110
        assert not retrieved_meas.flag
        assert retrieved_meas.local_date == date(2025, 5, 25)
        assert retrieved_meas.local_time == time(14, 30)
        assert retrieved_meas.water_source == "well"

    def test_save_measurement_no_flag(self):
        response = self.client.post(
            "/api/measurements/",
            data=self.payload_noflag,
            content_type="application/json",
        )

        assert response.status_code == 201

        assert Measurement.objects.count() == 1
        retrieved_meas = Measurement.objects.first()

        assert retrieved_meas.location.x == 100
        assert retrieved_meas.location.y == 110
        assert retrieved_meas.flag
        assert retrieved_meas.local_date == date(2025, 5, 25)
        assert retrieved_meas.local_time == time(14, 30)
        assert retrieved_meas.water_source == "well"

    def test_save_temperature(self):
        response = self.client.post(
            "/api/measurements/",
            data=self.payload_noflag,
            content_type="application/json",
        )

        assert response.status_code == 201

        assert Temperature.objects.count() == 1

        retrieved_temp = Temperature.objects.first()

        assert retrieved_temp.sensor == "thermometer"
        assert retrieved_temp.value == 15.5
        assert retrieved_temp.time_waited == timedelta(minutes=1, seconds=15)

    def test_invalid_payload_meas(self):
        response = self.client.post(
            "/api/measurements/",
            data=self.payload_meas_invalid,
            content_type="application/json",
        )

        assert response.status_code == 400

        assert Measurement.objects.count() == 0
        assert Temperature.objects.count() == 0

    def test_invalid_payload_temp(self):
        response = self.client.post(
            "/api/measurements/",
            data=self.payload_temp_invalid,
            content_type="application/json",
        )

        assert response.status_code == 400

        assert Measurement.objects.count() == 0
        assert Temperature.objects.count() == 0
