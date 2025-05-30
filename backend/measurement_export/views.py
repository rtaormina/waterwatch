"""Create views associated with measurement export."""

import json
import logging
from datetime import time

from django.contrib.gis.geos import GEOSException, GEOSGeometry
from django.db.models import Avg, Count, Q
from django.http import JsonResponse
from measurements.metrics import METRIC_MODELS
from measurements.models import Measurement
from rest_framework.decorators import api_view

from .factories import get_strategy
from .models import Location, Preset
from .serializers import MeasurementSerializer, PresetSerializer

logger = logging.getLogger("WATERWATCH")


@api_view(["GET"])
def export_all_view(request):
    """Export all measurements.

    This view exports all measurements.

    Parameters
    ----------
    request : HttpRequest
        The HTTP request object.

    Returns
    -------
    JsonResponse
        JSON response containing all measurements serialized with the MeasurementSerializer.
    """
    boundry_geometry = request.GET.get("boundry_geometry")
    query = Measurement.objects.select_related(*[model.__name__.lower() for model in METRIC_MODELS])
    if boundry_geometry:
        try:
            polygon = GEOSGeometry(boundry_geometry)
            query = query.filter(location__within=polygon)
        except GEOSException:
            logger.exception("Invalid boundry_geometry format: %s")
            return JsonResponse({"error": "Invalid boundry_geometry format"}, status=400)
    else:
        query = query.all()

    data = MeasurementSerializer(query, many=True, context={"included_metrics": ["temperature"]}).data

    return JsonResponse(data, safe=False, json_dumps_params={"indent": 2})


@api_view(["POST"])
def search_measurements_view(request):
    """Get measurements based on filters.

    This view handles filtering measurements based on location, temperature, date, and time range.

    Parameters
    ----------
    request : HttpRequest
        The HTTP request object.

    Returns
    -------
    JsonResponse
        JSON response containing the filtered measurements or aggregated statistics.
        If the request has a "format" parameter, it returns the data in that format (CSV, JSON, XML, GeoJSON).
        Otherwise, it returns a JSON response with count and average temperature.
    """
    related_fields = [model.__name__.lower() for model in METRIC_MODELS]
    qs = Measurement.objects.select_related(*related_fields).all()
    logger = logging.getLogger("WATERWATCH")

    request_data = {}
    if request.body:
        try:
            request_data = json.loads(request.body)
        except json.JSONDecodeError:
            logger.exception("Invalid JSON received in POST request.")
            return JsonResponse({"error": "Invalid JSON"}, status=400)

    qs = apply_measurement_filters(request_data, qs)

    included_metrics = request_data.get("measurements_included", [])

    if not isinstance(included_metrics, list):
        logger.warning("measurements_included was not a list: %s", included_metrics)
        included_metrics = []

    # If the request has a "format" parameter, we will return the data in that format
    fmt = str(request_data.get("format", "")).lower()

    if fmt in ("csv", "json", "xml", "geojson"):
        user = request.user

        logger.debug("search_measurements_view called by user: %s", user.groups.all())

        if not user.groups.filter(name="researcher").exists() and not user.is_superuser and not user.is_staff:
            return JsonResponse({"error": "Forbidden: insufficient permissions"}, status=403)

        data = MeasurementSerializer(qs, many=True, context={"included_metrics": included_metrics}).data
        strategy = get_strategy(fmt)
        return strategy.export(data)

    # Otherwise, we return the data in JSON format
    stats = qs.aggregate(
        count=Count("id"),
        avgTemp=Avg("temperature__value"),
    )

    return JsonResponse(
        {
            "count": stats["count"] or 0,
            "avgTemp": float(stats["avgTemp"] or 0.0),
        }
    )


def location_list(_request):
    """Get a list of countries by continent.

    Returns JSON of:
    {
      "Africa":   ["Algeria", "Egypt", …],
      "Asia":     ["China",  "India", …],
      …
    }

    Parameters
    ----------
    request : HttpRequest
        The HTTP request object.

    Returns
    -------
    JsonResponse
        JSON response containing a dictionary of continents and their respective countries.
    """
    qs = Location.objects.values_list("continent", "country_name").order_by("continent", "country_name")
    result = {}
    for continent, country in qs:
        result.setdefault(continent, []).append(country)
    return JsonResponse(result)


def preset_list(_self):
    """Get a list of all presets.

    Returns JSON of:
    {
      "presets": [
        {
          "id": 1,
          "name": "Preset 1",
          "description": "Description for preset 1",
          "filters": {"key": "value"},
          "created_by": 1,
          "created_at": "2023-01-01T00:00:00Z",
          "updated_at": "2023-01-01T00:00:00Z",
          "is_public": true
        },
        ...
      ]
    }

    Parameters
    ----------
    request : HttpRequest
        The HTTP request object.

    Returns
    -------
    JsonResponse
        JSON response containing a list of presets.
    """
    qs = Preset.objects.all().filter(is_public=True)
    serializer = PresetSerializer(qs, many=True)
    return JsonResponse({"presets": serializer.data})


def apply_measurement_filters(data, qs):
    """Apply filters to the measurement queryset based on request parameters.

    This function filters measurements based on location, temperature, date range, and time slots.

    Parameters
    ----------
    data : dict
        The request data containing filter parameters.
    qs : QuerySet
        The initial queryset of measurements to filter.

    Returns
    -------
    QuerySet
        The filtered queryset of measurements.
    """
    # Location filter
    qs = filter_by_continents(qs, data)
    qs = filter_by_countries(qs, data)

    # Temperature filter
    qs = filter_by_water_sources(qs, data)
    qs = filter_measurement_by_temperature(qs, data)

    # Date range filter
    qs = filter_by_date_range(qs, data)

    # Time slots filter
    return filter_by_time_slots(qs, data)


def filter_by_continents(qs, data):
    """Filter the queryset by continents.

    This function filters measurements based on continents provided in the request.

    Parameters
    ----------
    qs : QuerySet
        The initial queryset of measurements to filter.
    data : dict
        The request data containing filter parameters.

    Returns
    -------
    QuerySet
        The filtered queryset of measurements.
    """
    continents = data.get("location[continents]", [])
    if continents and not isinstance(continents, list):
        logger.warning("Continents data is not a list: %s", continents)
        continents = []

    if continents:
        polys = Location.objects.filter(continent__in=continents)
        loc_q = Q()
        for poly in polys:
            loc_q |= Q(location__within=poly.geom)
        qs = qs.filter(loc_q)
    return qs


def filter_by_countries(qs, data):
    """Filter the queryset by countries.

    This function filters measurements based on countries provided in the request.

    Parameters
    ----------
    qs : QuerySet
        The initial queryset of measurements to filter.
    data : dict
        The request data containing filter parameters.

    Returns
    -------
    QuerySet
        The filtered queryset of measurements.
    """
    countries = data.get("location[countries]", [])
    if countries and not isinstance(countries, list):
        logger.warning("Countries data is not a list: %s", countries)
        countries = []

    if countries:
        polys = Location.objects.filter(country_name__in=countries)
        loc_q = Q()
        for poly in polys:
            loc_q |= Q(location__within=poly.geom)
        qs = qs.filter(loc_q)
    return qs


def filter_by_water_sources(qs, data):
    """Filter the queryset by water sources.

    This function filters measurements based on water sources provided in the request.

    Parameters
    ----------
    qs : QuerySet
        The initial queryset of measurements to filter.
    data : dict
        The request data containing filter parameters.

    Returns
    -------
    QuerySet
        The filtered queryset of measurements.
    """
    water_sources = data.get("measurements[waterSources]", [])
    if water_sources and not isinstance(water_sources, list):
        logger.warning("Water sources data is not a list: %s", water_sources)
        water_sources = []

    water_sources = [ws.lower() for ws in water_sources if isinstance(ws, str)]

    if water_sources:
        qs = qs.filter(water_source__in=water_sources)
    return qs


def filter_measurement_by_temperature(qs, data):
    """Filter the queryset by temperature range.

    This function filters measurements based on a temperature range provided in the request.

    Parameters
    ----------
    qs : QuerySet
        The initial queryset of measurements to filter.
    data : dict
        The request data containing filter parameters.

    Returns
    -------
    QuerySet
        The filtered queryset of measurements.
    """
    temp_from_str = data.get("measurements[temperature][from]")
    temp_to_str = data.get("measurements[temperature][to]")

    try:
        if temp_from_str:
            qs = qs.filter(temperature__value__gte=float(temp_from_str))
        if temp_to_str:
            qs = qs.filter(temperature__value__lte=float(temp_to_str))
    except ValueError as e:
        logger.warning("Invalid temperature value: %s. From: '%s', To: '%s'", e, temp_from_str, temp_to_str)
    return qs


def filter_by_date_range(qs, data):
    """Filter the queryset by date range.

    This function filters measurements based on a date range provided in the request.

    Parameters
    ----------
    qs : QuerySet
        The initial queryset of measurements to filter.
    data : dict
        The request data containing filter parameters.

    Returns
    -------
    QuerySet
        The filtered queryset of measurements.
    """
    date_from = data.get("dateRange[from]")
    date_to = data.get("dateRange[to]")

    if date_from and not isinstance(date_from, str):
        logger.warning("dateRange[from] is not a string: %s", date_from)
        date_from = None

    if date_to and not isinstance(date_to, str):
        logger.warning("dateRange[to] is not a string: %s", date_to)
        date_to = None

    if date_from:
        qs = qs.filter(local_date__gte=date_from)

    if date_to:
        qs = qs.filter(local_date__lte=date_to)

    return qs


def filter_by_time_slots(qs, data):
    """Filter the queryset by time slots.

    This function filters measurements based on time slots provided in the request.
    It filters by the local time component of the timestamp, ignoring timezone offsets.

    Parameters
    ----------
    qs : QuerySet
        The initial queryset of measurements to filter.
    data : dict
        The request data containing filter parameters.

    Returns
    -------
    QuerySet
        The filtered queryset of measurements.
    """
    times_json_str = data.get("times")
    if not times_json_str:
        return qs

    try:
        if isinstance(times_json_str, str):
            slots = json.loads(times_json_str)
        elif isinstance(times_json_str, list):
            slots = times_json_str
        else:
            logger.warning("Times data is not a string or list: %s", type(times_json_str))
            return qs

        if not isinstance(slots, list):
            logger.warning("Parsed times data is not a list: %s", slots)
            return qs  # Or qs.none() if invalid format means no results
    except json.JSONDecodeError:
        logger.warning("Invalid JSON for time_slots string: %s", times_json_str)
        return qs

    time_q = Q()
    for slot_data in slots:
        if not isinstance(slot_data, dict):
            logger.warning("Slot data is not a dictionary: %s", slot_data)
            continue
        try:
            start_str = slot_data.get("from")
            end_str = slot_data.get("to")
            start = time.fromisoformat(start_str) if start_str else time(0, 0, 0)
            end = time.fromisoformat(end_str) if end_str else time(23, 59, 59)
            time_q |= Q(local_time__range=(start, end))
        except ValueError:
            logger.warning("Invalid time format in slot: %s. From: '%s', To: '%s'", slot_data, start_str, end_str)
            continue  # Skip this slot

    if time_q:  # Only apply filter if at least one valid time condition was generated
        return qs.filter(time_q)
    return qs
