"""Serializers for measurement Analysis."""

from django.contrib.gis.geos import Point
from rest_framework import serializers


class LocationField(serializers.Field):
    """LocationField serializer.

    Parameters
    ----------
    to_representation : function
        Converts a GEOS Point object to a dictionary with latitude and longitude.
    """

    def to_representation(self, value):
        """Convert a GEOS Point object to a dictionary with latitude and longitude."""
        if value is None:
            return None
        # value is a Point object
        return {
            "latitude": value.y,
            "longitude": value.x,
        }

    def to_internal_value(self, data):
        """Convert a dictionary with latitude and longitude to a GEOS Point object."""
        if not isinstance(data, dict) or "latitude" not in data or "longitude" not in data:
            raise serializers.ValidationError(
                "Invalid location format. Expected a dictionary with latitude and longitude."
            )
        return Point(data["longitude"], data["latitude"])


class MeasurementAggregatedSerializer(serializers.Serializer):
    """Serializer for exporting measurements in aggregated format.

    This serializer is used to export aggregate measurements with their location and count
    """

    location = LocationField()
    count = serializers.FloatField()
    avg_temperature = serializers.FloatField()
    min_temperature = serializers.FloatField()
    max_temperature = serializers.FloatField()
