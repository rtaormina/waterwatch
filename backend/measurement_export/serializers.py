"""Serializers for measurement export."""

import logging
from datetime import UTC
from decimal import Decimal

from measurements.metrics import METRIC_MODELS
from measurements.models import Measurement
from rest_framework import serializers

from measurement_export.models import Preset

logger = logging.getLogger("WATERWATCH")


class MeasurementSerializer(serializers.ModelSerializer):
    """Serializer for Measurement model instances.

    This serializer includes a custom `location` field that represents the GEOS Point location as latitude and
    longitude. It has been optimized to avoid N+1 queries by using pre-computed location data.

    Parameters
    ----------
    serializers.ModelSerializer : Base class
        Inherits from Django REST Framework's ModelSerializer.

    Attributes
    ----------
    location : SerializerMethodField
        Uses DB-annotated 'latitude'/'longitude' if available.
    country : SerializerMethodField
        Uses DB-annotated 'country' if available.
    continent : SerializerMethodField
        Uses DB-annotated 'continent' if available.
    metrics : SerializerMethodField
        Collects metric data for included metrics.

    Methods
    -------
    get_location(obj)
        Extracts latitude and longitude from `obj.location` and returns them in a dictionary.
    get_country(obj)
        Gets the country name from pre-computed location data to avoid database queries.
    get_continent(obj)
        Gets the continent name from pre-computed location data to avoid database queries.
    get_metrics(obj)
        Iterates through all subclasses of the Metric model and collects their data if they are related
        to the current measurement instance. Optimized for performance.
    """

    timestamp = serializers.DateTimeField(default_timezone=UTC, read_only=True)

    local_date = serializers.DateField()
    local_time = serializers.TimeField()

    location = serializers.SerializerMethodField()
    flag = serializers.SerializerMethodField()
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
        """
        Return latitude/longitude dict, preferring annotated values.
        """
        lat = getattr(obj, "latitude", None)
        lon = getattr(obj, "longitude", None)
        if lat is None or lon is None:
            # fallback to GEOS Point
            lon = obj.location.x
            lat = obj.location.y
        return {"latitude": lat, "longitude": lon}

    def get_flag(self, obj):
        """Flip the flag value.

        This method is used to invert the boolean value of the `flag` field

        Parameters
        ----------
        obj : Measurement
            The model instance being serialized. `obj.flag` is expected
            to be a boolean field indicating some condition (e.g., quality flag).

        Returns
        -------
        bool
            The inverted value of the `flag` field. If `obj.flag` is True, it returns False, and vice versa.
        """
        return not obj.flag

    def get_country(self, obj):
        """Return country using FK relationship when available.

        Parameters
        ----------
        obj : Measurement
            The model instance being serialized. `obj.location_ref` is expected
            to be a foreign key relationship to a Location model that has a country_name field.

        Returns
        -------
        str or None
            The country name if available, otherwise None.
        """
        # First try the annotated country
        if hasattr(obj, "country"):
            return obj.country

        # Then try the foreign key relationship
        if obj.location_ref:
            return obj.location_ref.country_name

        return None

    def get_continent(self, obj):
        """Return continent using FK relationship when available.

        Parameters
        ----------
        obj : Measurement
            The model instance being serialized. `obj.location_ref` is expected
            to be a foreign key relationship to a Location model that has a continent field.

        Returns
        -------
        str or None
            The continent name if available, otherwise None.
        """
        # First try the annotated continent
        if hasattr(obj, "continent"):
            return obj.continent

        # Then try the foreign key relationship
        if obj.location_ref:
            return obj.location_ref.continent

        return None

    def get_metrics(self, obj):
        """Get all metrics associated with the measurement.

        Iterates through all subclasses of the Metric model and collects
        their data if they are related to the current measurement instance.
        Optimized for performance with better type handling.

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
        included_metrics = self.context.get("included_metrics", [])

        for metric_cls in METRIC_MODELS:
            attr = metric_cls.__name__.lower()
            if attr not in included_metrics:
                continue

            # Use getattr with None default to avoid attribute errors
            inst = getattr(obj, attr, None)
            if not inst:
                continue

            data = {"metric_type": attr}

            # Get all field values efficiently
            for field in metric_cls._meta.fields:
                name = field.name
                if name in ("id", "measurement"):
                    continue

                value = getattr(inst, name, None)

                # Optimize type conversions
                if value is None:
                    data[name] = None
                elif isinstance(value, Decimal):
                    data[name] = float(value)
                elif hasattr(value, "total_seconds"):  # Duration
                    data[name] = value.total_seconds()
                else:
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
