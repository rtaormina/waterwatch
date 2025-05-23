"""Create views associated with measurement export."""

import json
import logging

from datetime import time
from django.db.models import Q, F, Value, DateTimeField, TimeField, Func, Count, Avg
from django.db.models.functions import Cast, Extract
from django.http import JsonResponse
from measurements.models import Measurement
from measurements.metrics import METRIC_MODELS

from .factories import get_strategy
from .models import Location, Preset
from .serializers import MeasurementSerializer, PresetSerializer

logger = logging.getLogger("WATERWATCH")


def measurements_view(request):
    """Get measurements based on filters.

    This view handles filtering measurements based on location, temperature, date, and time range.

    Parameters
    ----------
    request : HttpRequest
        The HTTP request object.

    Returns
    -------
    JsonResponse
        JSON response containing the count and average temperature of the filtered measurements or
        a serialized list of measurements in the requested format (CSV, JSON, XML, GeoJSON) if specified.
    """    
    related_fields = [model.__name__.lower() for model in METRIC_MODELS]
    qs = Measurement.objects.select_related(*related_fields).all()
    qs = apply_measurement_filters(request, qs)

    included_metrics = request.GET.getlist("measurements_included")

    # If the request has a "format" parameter, we will return the data in that format
    fmt = request.GET.get("format", "").lower()
    if fmt in ("csv", "json", "xml", "geojson"):
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


def apply_measurement_filters(request, qs):
    """Apply filters to the measurement queryset based on request parameters.

    This function filters measurements based on location, temperature, date range, and time slots.

    Parameters
    ----------
    request : HttpRequest
        The HTTP request object containing filter parameters.
    qs : QuerySet
        The initial queryset of measurements to filter.

    Returns
    -------
    QuerySet
        The filtered queryset of measurements.
    """
    
    # Location filter
    qs = filter_by_continents(qs, request)
    qs = filter_by_countries(qs, request)

    # Temperature filter
    qs = filter_by_water_sources(qs, request)
    qs = filter_measurement_by_temperature(qs, request)

    # Date range filter
    qs = filter_by_date_range(qs, request)

    # Time slots filter
    return filter_by_time_slots(qs, request)

def filter_by_continents(qs, request):
    """Filter the queryset by continents.

    This function filters measurements based on continents provided in the request.

    Parameters
    ----------
    qs : QuerySet
        The initial queryset of measurements to filter.
    continents : list
        List of continents to filter by.

    Returns
    -------
    QuerySet
        The filtered queryset of measurements.
    """
    continents = request.GET.getlist("location[continents]") + request.GET.getlist("location[continents][]")

    if continents:
        polys = Location.objects.filter(continent__in=continents)
        loc_q = Q()
        for poly in polys:
            loc_q |= Q(location__within=poly.geom)
        qs = qs.filter(loc_q)
    return qs

def filter_by_countries(qs, request):
    """Filter the queryset by countries.

    This function filters measurements based on countries provided in the request.

    Parameters
    ----------
    qs : QuerySet
        The initial queryset of measurements to filter.
    countries : list

        List of countries to filter by.

    Returns
    -------
    QuerySet
        The filtered queryset of measurements.
    """
    countries = request.GET.getlist("location[countries]") + request.GET.getlist("location[countries][]")

    if countries:
        polys = Location.objects.filter(country_name__in=countries)
        loc_q = Q()
        for poly in polys:
            loc_q |= Q(location__within=poly.geom)
        qs = qs.filter(loc_q)
    return qs

def filter_by_water_sources(qs, request):
    """Filter the queryset by water sources.

    This function filters measurements based on water sources provided in the request.

    Parameters
    ----------
    qs : QuerySet
        The initial queryset of measurements to filter.
    water_sources : list
        List of water sources to filter by.

    Returns
    -------
    QuerySet
        The filtered queryset of measurements.
    """
    water_sources = request.GET.getlist("measurements[waterSources][]")
    water_sources = [ws.lower() for ws in water_sources]
    logger.debug(f"Water sources: {water_sources}")
    logger.debug("Request.GET: %s", request.GET)

    if water_sources:
        logger.debug(f"Filtering by water sources: {water_sources}")
        qs = qs.filter(water_source__in=water_sources)
    return qs

def filter_measurement_by_temperature(qs, request):
    """Filter the queryset by temperature range.

    This function filters measurements based on a temperature range provided in the request.

    Parameters
    ----------
    qs : QuerySet
        The initial queryset of measurements to filter.
    temp_from : str
        The start temperature for the filter.
    temp_to : str
        The end temperature for the filter.

    Returns
    -------
    QuerySet
        The filtered queryset of measurements.
    """
    temp_from = request.GET.get("measurements[temperature][from]")
    temp_to = request.GET.get("measurements[temperature][to]")
    
    if temp_from:
        qs = qs.filter(temperature__value__gte=float(temp_from))

    if temp_to:
        qs = qs.filter(temperature__value__lte=float(temp_to))
    return qs

def filter_by_date_range(qs, request):
    """Filter the queryset by date range.

    This function filters measurements based on a date range provided in the request.

    Parameters
    ----------
    qs : QuerySet
        The initial queryset of measurements to filter.
    date_from : str
        The start date for the filter.
    date_to : str
        The end date for the filter.

    Returns
    -------
    QuerySet
        The filtered queryset of measurements.
    """
    
    date_from = request.GET.get("dateRange[from]")
    date_to = request.GET.get("dateRange[to]")
    
    if date_from:
        qs = qs.filter(local_date__gte=date_from)

    if date_to:
        qs = qs.filter(local_date__lte=date_to)

    return qs


def filter_by_time_slots(qs, request):
    """Filter the queryset by time slots.
    
    This function filters measurements based on time slots provided in the request.
    It filters by the local time component of the timestamp, ignoring timezone offsets.
    
    Parameters
    ----------
    request : HttpRequest
        The HTTP request object containing time slot parameters.
    qs : QuerySet
        The initial queryset of measurements to filter.
    
    Returns
    -------
    QuerySet
        The filtered queryset of measurements.
    """
    
    times_json = request.GET.get("times")
    if not times_json:
        return qs

    try:
        slots = json.loads(times_json)
    except json.JSONDecodeError:
        return qs

    time_q = Q()
    for slot in slots:
        start = time.fromisoformat(slot.get("from")) if slot.get("from") else time(0,0,0)
        end   = time.fromisoformat(slot.get("to"))   if slot.get("to")   else time(23,59,59)
        time_q |= Q(local_time__range=(start, end))

    return qs.filter(time_q)