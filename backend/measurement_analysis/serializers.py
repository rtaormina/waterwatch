"""Serializers for measurement Analysis."""

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


class MeasurementAggregatedSerializer(serializers.Serializer):
    """Serializer for exporting measurements in aggregated format.

    This serializer is used to export aggregate measurements with their location and count
    """

    location = LocationField()
    count = serializers.FloatField()
    avg_temperature = serializers.FloatField()
