"""Create views associated with measurements."""

import logging
import os

from django.core.cache import cache
from django.db.models.expressions import RawSQL
from django.http import HttpResponseNotAllowed, JsonResponse
from dotenv import load_dotenv
from measurement_analysis.views import (
    apply_boundary_filter,
    apply_month_filter,
    build_cache_key,
    get_cached_results_for_months,
    parse_month_parameter,
)
from measurement_collection.views import add_measurement_view
from measurement_export.views import (
    apply_location_annotations,
    build_base_queryset,
    prepare_measurement_data,
    search_measurements_view,
)
from rest_framework.decorators import api_view

from .models import Measurement

load_dotenv()
cache_timeout = int(os.getenv("DJANGO_CACHE_TIMEOUT", 300))  # Default to 5 minutes

logger = logging.getLogger("WATERWATCH")


@api_view(["GET", "POST"])
def measurement_view(request):
    """Handle GET and POST requests for measurements.

    GET: Export all measurements.
    POST: Add a new measurement.

    Parameters
    ----------
    request : HttpRequest
        The HTTP request object.

    Returns
    -------
    HttpResponse
        - If GET: Calls get_all_measurements.
        - If POST: Calls add_measurement_view.
        - If neither: Returns 405 Method Not Allowed.
    """
    if request.method == "GET":
        return get_all_measurements(request)
    if request.method == "POST":
        return add_measurement_view(request)
    return HttpResponseNotAllowed(["GET", "POST"])


def get_all_measurements(_request):
    """Export all measurements with related metrics, campaigns, and user info.

    Parameters
    ----------
    request : HttpRequest
        The HTTP request object

    Returns
    -------
    JsonResponse
        JSON response containing measurements with related metrics and campaigns.
    """
    # Start with our base queryset
    qs = build_base_queryset(ordered=True)
    # Add geographic annotations and prepare complete data
    qs = apply_location_annotations(qs)
    data = prepare_measurement_data(qs)
    return JsonResponse(data, safe=False, json_dumps_params={"indent": 2})


@api_view(["POST"])
def measurement_search(request):
    """Handle POST requests for searching measurements.

    Parameters
    ----------
    request : HttpRequest
        The HTTP request object.

    Returns
    -------
    HttpResponse
        - If POST: Calls search_measurements_view to handle the search.
        - If not POST: Returns 405 Method Not Allowed.
    """
    return search_measurements_view(request)


def _build_temperature_queryset(boundary_geometry=None, months=None):
    """Build an optimized queryset for temperature data only."""
    # Only select_related temperature since that's all we need
    queryset = Measurement.objects.select_related("temperature")
    queryset = queryset.filter(temperature__isnull=False)

    # Apply boundary filter if provided
    queryset = apply_boundary_filter(queryset, boundary_geometry)

    # Apply month filter if provided
    return apply_month_filter(queryset, months or [])


def _build_temperature_cache_key_for_month(boundary_geometry, month):
    """Build a cache key for a single month and boundary."""
    return build_cache_key("temperature_values", month, boundary_geometry)


def _get_cached_temperature_results_for_months(boundary_geometry, months):
    """Get cached temperature results for multiple months and identify which are missing."""
    return get_cached_results_for_months("temperature_values", months, boundary_geometry)


def _cache_temperature_results_by_month(results_list, boundary_geometry, months):
    """Cache temperature results grouped by month."""
    if not results_list or not months:
        return

    if 0 in months:
        # For last 30 days, cache all results together
        cache_key = _build_temperature_cache_key_for_month(boundary_geometry, 0)
        cache.set(cache_key, results_list, cache_timeout)
    else:
        # We need to fetch the data with month info to group properly
        # This requires modifying the queryset to include month data
        queryset = _build_temperature_queryset(boundary_geometry, months)
        queryset = queryset.annotate(month=RawSQL("EXTRACT(month FROM local_date)", []))
        results_with_month = queryset.values_list("temperature__value", "month")

        # Group by month
        results_by_month = {}
        for temp_value, month in results_with_month:
            if month not in results_by_month:
                results_by_month[month] = []
            results_by_month[month].append(temp_value)

        # Cache each month's results
        for month, month_results in results_by_month.items():
            cache_key = _build_temperature_cache_key_for_month(boundary_geometry, month)
            cache.set(cache_key, month_results, cache_timeout)


@api_view(["POST"])
def temperature_view(request):
    """
    Handle POST requests to retrieve temperature measurements with smart caching.

    Parameters
    ----------
    request : HttpRequest
        The HTTP request object containing JSON data with optional:
        - boundary_geometry: GeoJSON polygon to filter by location
        - month: Month parameter for temporal filtering

    Returns
    -------
    JsonResponse
        A JSON response containing a list of temperature values.
    """
    data = request.data or {}
    boundary_geometry = data.get("boundary_geometry", None)
    month_param = data.get("month", None)

    try:
        # Parse month parameter using shared utility
        months = parse_month_parameter(month_param)

        # Try to get cached results
        if months:
            cached_results, missing_months = _get_cached_temperature_results_for_months(boundary_geometry, months)

            # If we have all results cached, return them
            if not missing_months:
                return JsonResponse(cached_results, safe=False, json_dumps_params={"indent": 2})

            # Otherwise, we need to fetch missing months
            months_to_fetch = missing_months
        else:
            cached_results = []
            months_to_fetch = []

        # Fetch missing data
        if months_to_fetch:
            queryset = _build_temperature_queryset(boundary_geometry, months_to_fetch)
            new_temperature_values = list(queryset.values_list("temperature__value", flat=True))

            # Cache the new results
            _cache_temperature_results_by_month(new_temperature_values, boundary_geometry, months_to_fetch)

            # Combine with cached results
            all_results = cached_results + new_temperature_values
        else:
            # If no months specified, get all data without smart caching
            queryset = _build_temperature_queryset(boundary_geometry, months)
            all_results = list(queryset.values_list("temperature__value", flat=True))

        return JsonResponse(all_results, safe=False, json_dumps_params={"indent": 2})

    except ValueError as e:
        return JsonResponse({"error": str(e)}, status=400)
    except Exception:
        logger.exception("Error in temperature_view")
        return JsonResponse({"error": "Internal server error"}, status=500)
