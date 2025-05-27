"""Serializers for Measurement and Temperature models."""

import logging
from datetime import datetime

from campaigns.views import find_matching_campaigns
from django.contrib.gis.geos import Point
from measurements.models import Measurement, Temperature
from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer

logger = logging.getLogger("WATERWATCH")


class TemperatureSerializer(serializers.ModelSerializer):
    """Serializer for Temperature model.

    Parameters
    ----------
    serializers.ModelSerializer : Base class
        Inherits from Django REST Framework's ModelSerializer
    """

    class Meta:
        """Meta class for TemperatureSerializer."""

        model = Temperature
        fields = ["sensor", "value", "time_waited"]


class MeasurementSerializer(GeoFeatureModelSerializer):
    """Serializer for Measurement model.

    Parameters
    ----------
    serializers.ModelSerializer : Base class
        Inherits from Django REST Framework's ModelSerializer

    Attributes
    ----------
    temperature : TemperatureSerializer
        Serializer for the Temperature model
        This is a nested serializer that allows for the creation of a Temperature object
        when creating a Measurement object.

    Methods
    -------
    create(validated_data)
        Create a Measurement object and nested metric objects if the data is provided.
        Returns the created Measurement object.
    """

    temperature = TemperatureSerializer(required=False)

    class Meta:
        """Meta class for MeasurementSerializer."""

        model = Measurement
        fields = ["timestamp", "local_date", "local_time", "location", "water_source", "temperature"]
        geo_field = "location"

    def validate(self, data):
        """Validate the data before creating a Measurement object.

        Parameters
        ----------
        data : dict
            The data to validate.

        Returns
        -------
        dict
            The validated data.
        """
        # Set flag if temperature is out of range
        temperature_data = data.get("temperature")
        if temperature_data and temperature_data.get("value") > 40.0:
            data["flag"] = False

        location = data.get("location")
        if isinstance(location, Point):
            data["location"] = Point(round(location.x, 3), round(location.y, 3), srid=location.srid)

        # Make water_source lowercase
        data["water_source"] = data["water_source"].lower()

        return data

    def create(self, validated_data):
        """Create a Measurement object and nested metric objects if the data is provided.

        Parameters
        ----------
        validated_data : dict
            The validated data from the serializer.

        Returns
        -------
        Measurement
            The created Measurement object.
        """
        temperature_data = validated_data.pop("temperature", None)
        measurement = Measurement.objects.create(**validated_data)
        timestamp_local = datetime.combine(measurement.local_date, measurement.local_time)
        active_campaigns = find_matching_campaigns(
            timestamp_local, str(measurement.location.y), str(measurement.location.x)
        )
        measurement.campaigns.add(*active_campaigns)
        if temperature_data:
            Temperature.objects.create(measurement=measurement, **temperature_data)

        return measurement
