"""Tests for serializers in the measurement_analysis app."""

from datetime import date, timedelta

from django.contrib.gis.geos import Point
from django.db.models import Avg, Count, Max, Min
from django.test import TestCase
from measurements.models import Measurement, Temperature
from rest_framework import serializers

from measurement_analysis.serializers import LocationField, MeasurementAggregatedSerializer


class CollectMeasurementAnalysisSerializersTests(TestCase):
    """Test cases for measurement collection Endpoints."""

    def test_location_field_representation(self):
        """Test the LocationField serializer."""
        point = Point(2.0, 1.0)
        field = LocationField()
        result = field.to_representation(point)
        assert result["latitude"] == 1.0
        assert result["longitude"] == 2.0

    def test_location_field_none_representation(self):
        """Test the LocationField serializer with a None value."""
        point = None
        field = LocationField()
        result = field.to_representation(point)
        assert result is None

    def test_location_field_to_internal_value(self):
        """Test the LocationField deserialization."""
        field = LocationField()
        data = {"latitude": 1.0, "longitude": 2.0}
        result = field.to_internal_value(data)
        assert isinstance(result, Point)
        assert result.x == 2.0
        assert result.y == 1.0

    def test_location_field_invalid_data(self):
        """Test the LocationField with invalid data."""
        field = LocationField()
        with self.assertRaises(serializers.ValidationError):
            field.to_internal_value({"lat": 1.0, "lon": 2.0})

        with self.assertRaises(serializers.ValidationError):
            field.to_internal_value([1.0, 2.0])

        with self.assertRaises(serializers.ValidationError):
            field.to_internal_value({"latitude": 1.0, "altitude": 5})

    def test_measurement_aggregated_serializer(self):
        """Test the MeasurementAggregatedSerializer."""
        measurement1 = Measurement.objects.create(
            location="POINT(1.0 2.0)",
            timestamp=date(2025, 10, 1) + timedelta(hours=12),
        )
        measurement2 = Measurement.objects.create(
            location="POINT(3.0 4.0)",
            timestamp=date(2025, 10, 2) + timedelta(hours=14),
        )
        measurement3 = Measurement.objects.create(
            location="POINT(3.0 4.0)",
            timestamp=date(2025, 10, 3) + timedelta(hours=16),
        )
        Temperature.objects.create(
            measurement=measurement1,
            value=25.5,
            sensor="Test Sensor",
            time_waited=timedelta(seconds=1),
        )
        Temperature.objects.create(
            measurement=measurement2,
            value=20.0,
            sensor="Test Sensor",
            time_waited=timedelta(seconds=1),
        )
        Temperature.objects.create(
            measurement=measurement3,
            value=18.0,
            sensor="Test Sensor",
            time_waited=timedelta(seconds=1),
        )

        query = (
            Measurement.objects.all()
            .values("location")
            .annotate(
                count=Count("location"),
                avg_temperature=Avg("temperature__value"),
                min_temperature=Min("temperature__value"),
                max_temperature=Max("temperature__value"),
            )
            .order_by("count")
        )
        serializer = MeasurementAggregatedSerializer(query, many=True)
        measurements = serializer.data
        assert len(measurements) == 2  # Aggregated by location
        assert measurements[0]["location"]["latitude"] == 2.0
        assert measurements[0]["location"]["longitude"] == 1.0
        assert measurements[0]["count"] == 1
        assert measurements[0]["avg_temperature"] == 25.5
        assert measurements[0]["min_temperature"] == 25.5
        assert measurements[0]["max_temperature"] == 25.5
        assert measurements[1]["location"]["latitude"] == 4.0
        assert measurements[1]["location"]["longitude"] == 3.0
        assert measurements[1]["count"] == 2
        assert measurements[1]["avg_temperature"] == 19.0
        assert measurements[1]["min_temperature"] == 18.0
        assert measurements[1]["max_temperature"] == 20.0
