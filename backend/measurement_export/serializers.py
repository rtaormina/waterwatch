"""Serializers for measurement export."""

import logging

import pytz
from measurements.metrics import METRIC_MODELS
from measurements.models import Measurement
from rest_framework import serializers

from measurement_export.models import Preset

from .utils import lookup_location

logger = logging.getLogger("WATERWATCH")


class MeasurementSerializer(serializers.ModelSerializer):
    """Serializer for Measurement model instances.

    This serializer includes a custom `location` field that represents the GEOS Point location as latitude and
    longitude.

    Parameters
    ----------
    serializers.ModelSerializer : Base class
        Inherits from Django REST Framework's ModelSerializer.

    Attributes
    ----------
    location : SerializerMethodField
        Returns a dict with `latitude` and `longitude` extracted from the model's GEOS Point field.
    country : SerializerMethodField
        Returns the country name for the measurement's location using reverse geocoding.
    continent : SerializerMethodField
        Returns the continent name for the measurement's location using reverse geocoding.
    metrics : SerializerMethodField
        Returns a list of dictionaries, each containing the metric type and its associated data.
        Each dictionary corresponds to a related Metric instance.

    Methods
    -------
    get_location(obj)
        Extracts latitude and longitude from `obj.location` and returns them in a dictionary.
    get_country(obj)
        Uses reverse geocoding to get the country name for the measurement's location.
    get_continent(obj)
        Uses reverse geocoding to get the continent name for the measurement's location.
    get_metrics(obj)
        Iterates through all subclasses of the Metric model and collects their data if they are related
        to the current measurement instance.
    """

    timestamp = serializers.DateTimeField(default_timezone=pytz.UTC, read_only=True)

    local_date = serializers.DateField()
    local_time = serializers.TimeField()

    location = serializers.SerializerMethodField()
    country = serializers.SerializerMethodField()
    continent = serializers.SerializerMethodField()
    metrics = serializers.SerializerMethodField()

    class Meta:
        """Meta class for MeasurementSerializer."""

        model = Measurement
        fields = [
            "id",
            "timestamp",
            "local_date",
            "local_time",
            "location",
            "flag",
            "water_source",
            "campaigns",
            "user",
            "country",
            "continent",
            "metrics",
        ]

    def get_location(self, obj):
        """Get the serialized location.

        Converts the model's GEOS Point `location` field into a dictionary
        with separate latitude and longitude.

        Parameters
        ----------
        obj : Measurement
            The model instance being serialized. `obj.location` is expected
            to be a GEOS Point (x = lon, y = lat).

        Returns
        -------
        dict
            Dictionary with keys:
            - `latitude` (float): Latitude component of the location.
            - `longitude` (float): Longitude component of the location.
        """
        return {
            "latitude": obj.location.y,
            "longitude": obj.location.x,
        }

    def get_country(self, obj):
        """Get the country name for the measurement's location.

        Performs a reverse geocoding lookup using the measurement's latitude and longitude
        to determine which country polygon contains the point.

        Parameters
        ----------
        obj : Measurement
            The model instance being serialized. `obj.location` is expected
            to be a GEOS Point (x = lon, y = lat).

        Returns
        -------
        str or None
            The name of the country containing the measurement location, or None
            if the point is outside any known country polygon (e.g., international waters).
        """
        info = lookup_location(lat=obj.location.y, lon=obj.location.x)
        return info["country"]

    def get_continent(self, obj):
        """Get the continent name for the measurement's location.

        Performs a reverse geocoding lookup using the measurement's latitude and longitude
        to determine which continent polygon contains the point.

        Parameters
        ----------
        obj : Measurement
            The model instance being serialized. `obj.location` is expected
            to be a GEOS Point (x = lon, y = lat).

        Returns
        -------
        str or None
            The name of the continent containing the measurement location, or None
            if the point is outside any known polygon (e.g., international waters).
        """
        info = lookup_location(lat=obj.location.y, lon=obj.location.x)
        return info["continent"]

    def get_metrics(self, obj):
        """Get all metrics associated with the measurement.

        Iterates through all subclasses of the Metric model and collects
        their data if they are related to the current measurement instance.

        Parameters
        ----------
        obj : Measurement
            The model instance being serialized. `obj` is expected to be a Measurement
            instance with related Metric instances.

        Returns
        -------
        list
            A list of dictionaries, each containing the metric type and its associated data.
            Each dictionary corresponds to a related Metric instance.
        """
        metrics_data = []

        logger.debug(self.context)

        included_metrics = self.context.get("included_metrics", [])

        logger.debug(
            "Included metrics: %s",
            included_metrics,
        )

        for metric_cls in METRIC_MODELS:
            attr = metric_cls.__name__.lower()
            if attr not in included_metrics:
                continue

            inst = getattr(obj, attr, None)
            if not inst:
                continue

            data = {"metric_type": metric_cls.__name__.lower()}
            for field in metric_cls._meta.fields:
                name = field.name
                if name in ("id", "measurement"):
                    continue
                value = getattr(inst, name)
                # Convert Decimal to float
                if hasattr(value, "quantize"):
                    value = float(value)
                # Convert Duration to seconds
                if hasattr(value, "total_seconds"):
                    value = value.total_seconds()
                data[name] = value

            metrics_data.append(data)

        return metrics_data


class PresetSerializer(serializers.ModelSerializer):
    """Serializer for Preset model instances.

    This serializer is used to serialize and deserialize Preset objects.
    It includes fields for the preset's ID, name, description, filters,
    created_at timestamp, and a boolean indicating if the preset is public.

    Parameters
    ----------
    serializers.ModelSerializer : Base class
        Inherits from Django REST Framework's ModelSerializer.
    """

    class Meta:
        """Meta class for PresetSerializer."""

        model = Preset
        fields = ["id", "name", "description", "filters", "created_at", "is_public"]
        read_only_fields = ["id", "created_at"]
