"""Create views associated with Measurement Analysis."""

import hashlib
import logging
import os
from datetime import timedelta

from django.contrib.gis.geos import GEOSException, GEOSGeometry
from django.core.cache import cache
from django.db.models import Avg, Count, Max, Min
from django.db.models.expressions import RawSQL
from django.http import JsonResponse
from django.utils import timezone
from dotenv import load_dotenv
from measurements.models import Measurement
from rest_framework.decorators import api_view

from .serializers import MeasurementAggregatedSerializer

load_dotenv()
cache_timeout = int(os.getenv("DJANGO_CACHE_TIMEOUT", 300))  # Default to 5 minutes

logger = logging.getLogger("WATERWATCH")


def _parse_month_parts(month_param):
    if isinstance(month_param, str):
        return [p.strip() for p in month_param.split(",") if p.strip()]
    if isinstance(month_param, (list | tuple)):
        return [str(p).strip() for p in month_param if str(p).strip()]
    return []


def _validate_and_convert_months(parts):
    try:
        months = [int(p) for p in parts]
    except ValueError as err:
        raise ValueError("Invalid month parameter; must be integers or comma-separated integers") from err

    if 0 in months:
        return [0]

    invalid = [m for m in months if not (1 <= m <= 12)]
    if invalid:
        raise ValueError(f"Month(s) out of range 1-12: {invalid!r}")

    return sorted(set(months))


def parse_month_parameter(month_param):
    """
    Parse month parameter into a list of months.

    Parameters
    ----------
    month_param : None | int | str | list[int|str]
        - None or empty string: returns []
        - 0 (or "0"): returns [0] (special: last 30 days)
        - int 1-12: returns [month_param]
        - str of comma-separated months: e.g. "1,3,12"
        - list of ints or numeric strings

    Returns
    -------
    list[int]
        List of month numbers (0 for “last 30 days” or 1-12).

    Raises
    ------
    ValueError
        If format is invalid, or months out of range, or mixing 0 with others.
    """
    if month_param is None or (isinstance(month_param, str) and not month_param.strip()):
        return []

    if isinstance(month_param, int):
        if month_param == 0:
            return [0]
        if 1 <= month_param <= 12:
            return [month_param]
        raise ValueError("Invalid month; integer must be 0 or 1-12")

    parts = _parse_month_parts(month_param)
    if not parts:
        return []

    return _validate_and_convert_months(parts)


def apply_boundary_filter(queryset, boundary_wkt):
    """
    Only return points *strictly inside* the given polygon WKT (in EPSG:4326).

    Parameters
    ----------
    queryset : QuerySet
        Django queryset to filter
    boundary_wkt : str
        Well-Known Text (WKT) representation of the polygon boundary

    Returns
    -------
    QuerySet
        Filtered queryset containing only points within the specified boundary
    """
    if boundary_wkt:
        try:
            # Parse WKT into a 4326 GEOSGeometry; frontend must have closed the ring
            poly = GEOSGeometry(boundary_wkt, srid=4326)
        except (ValueError, GEOSException) as err:
            logger.exception("Invalid boundary_geometry: %s", boundary_wkt)
            raise ValueError("Invalid boundary_geometry format") from err

        # Use `within` to exclude points on or outside the boundary
        queryset = queryset.filter(location__within=poly)

    return queryset


def apply_month_filter(queryset, months):
    """
    Apply month filter to queryset.

    Parameters
    ----------
    queryset : QuerySet
        Django queryset to filter
    months : list
        List of months, where 0 means last 30 days

    Returns
    -------
    QuerySet
        Filtered queryset
    """
    if not months:
        return queryset

    if 0 in months:
        cutoff = timezone.now().date() - timedelta(days=30)
        queryset = queryset.filter(local_date__gte=cutoff)
    else:
        queryset = queryset.filter(local_date__month__in=months)

    return queryset


def build_cache_key(cache_type, month, boundary_geometry=None):
    """
    Build a cache key for caching results.

    Parameters
    ----------
    cache_type : str
        Type of cache (e.g., 'temperature_values', 'aggregated_measurements')
    month : int
        Month number (0 for last 30 days)
    boundary_geometry : str, optional
        Boundary geometry string for location-specific caching

    Returns
    -------
    str
        Cache key string
    """
    if boundary_geometry:
        boundary_hash = hashlib.md5((boundary_geometry or "").encode()).hexdigest()[:8]
        boundary_part = f"{boundary_hash}"
    else:
        boundary_part = ""

    if month == 0:
        # For last 30 days, include the current date to ensure cache invalidation
        current_date = timezone.now().date().isoformat()
        if boundary_part:
            return f"{cache_type}:last30days:{boundary_part}:{current_date}"
        return f"{cache_type}:last30days:{current_date}"

    if boundary_part:
        return f"{cache_type}:month:{boundary_part}:{month}"
    return f"{cache_type}:month:{month}"


def get_cached_results_for_months(cache_type, months, boundary_geometry=None):
    """
    Get cached results for multiple months and identify which are missing.

    Parameters
    ----------
    cache_type : str
        Type of cache
    months : list
        List of months to check
    boundary_geometry : str, optional
        Boundary geometry for location-specific caching

    Returns
    -------
    tuple
        (cached_results, missing_months)
    """
    cached_results = []
    missing_months = []

    for month in months:
        cache_key = build_cache_key(cache_type, month, boundary_geometry)
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            cached_results.extend(cached_result)
        else:
            missing_months.append(month)

    return cached_results, missing_months


def cache_results_by_month(cache_type, results_list, months, boundary_geometry=None):
    """
    Cache results grouped by month.

    Parameters
    ----------
    cache_type : str
        Type of cache
    results_list : list
        List of results to cache
    months : list
        List of months
    boundary_geometry : str, optional
        Boundary geometry for location-specific caching
    """
    if not results_list or not months:
        return

    if 0 in months:
        # For last 30 days, cache all results together
        cache_key = build_cache_key(cache_type, 0, boundary_geometry)
        cache.set(cache_key, results_list, cache_timeout)
    else:
        # Group results by month and cache separately
        # For aggregated results, we can group by month field
        if cache_type == "aggregated_measurements":
            results_by_month = {}
            for result in results_list:
                month = result["month"]
                if month not in results_by_month:
                    results_by_month[month] = []
                results_by_month[month].append(result)

            # Cache each month's results
            for month, month_results in results_by_month.items():
                cache_key = build_cache_key(cache_type, month, boundary_geometry)
                cache.set(cache_key, month_results, cache_timeout)


# Measurement Analysis specific functions
def _get_cached_agg_results(months, boundary_geometry=None):
    """Wrap around the generic cache fetch for aggregated_measurements."""
    return get_cached_results_for_months("aggregated_measurements", months, boundary_geometry)


def _cache_agg_results(results_list, months, boundary_geometry=None):
    """Wrap around the generic cache set for aggregated_measurements."""
    cache_results_by_month("aggregated_measurements", results_list, months, boundary_geometry)


def _apply_filters(queryset, month_param):
    """Apply filters to the queryset with proper error handling."""
    months = parse_month_parameter(month_param)
    return apply_month_filter(queryset, months)


def _perform_aggregation(queryset):
    """Perform the aggregation with location coordinates and month."""
    # Add coordinate and month annotations
    queryset = queryset.annotate(
        longitude=RawSQL("ST_X(location)", []),
        latitude=RawSQL("ST_Y(location)", []),
        month=RawSQL("EXTRACT(month FROM local_date)", []),
    )

    # Perform aggregation grouped by location AND month
    return queryset.values("location", "longitude", "latitude", "month").annotate(
        count=Count("location"),
        avg_temperature=Avg("temperature__value"),
        min_temperature=Min("temperature__value"),
        max_temperature=Max("temperature__value"),
    )


def _build_optimized_queryset():
    """Build an optimized base queryset for aggregation."""
    # Only select_related the temperature model since that's what we're aggregating
    return Measurement.objects.select_related("temperature")


@api_view(["POST"])
def analyzed_measurements_view(request):
    """Export aggregated measurements.

    This view exports aggregated measurements with optional filters for month. Uses smart caching.

    Parameters
    ----------
    request : HttpRequest
        The HTTP request object containing JSON data with optional:
        - month: Month parameter for temporal filtering

    Returns
    -------
    JsonResponse
        JSON response containing aggregated measurements.
    """
    data = request.data or {}
    boundary_geometry = data.get("boundary_geometry", None)
    month_param = data.get("month", None)

    try:
        # Parse month parameter
        months = parse_month_parameter(month_param)

        # Try to get cached results
        if months:
            cached_results, missing_months = _get_cached_agg_results(months, boundary_geometry)

            # If we have all results cached, return them
            if not missing_months:
                serializer = MeasurementAggregatedSerializer(cached_results, many=True)
                serialized_data = serializer.data
                response_data = {"measurements": serialized_data, "count": len(serialized_data), "status": "success"}
                return JsonResponse(response_data, safe=True)

            # Otherwise, we need to fetch missing months
            months_to_fetch = missing_months
        else:
            cached_results = []
            months_to_fetch = []

        # Build optimized queryset for missing months
        queryset = _build_optimized_queryset()
        queryset = apply_boundary_filter(queryset, boundary_geometry)

        # Apply filters only for missing months
        if months_to_fetch:
            queryset = _apply_filters(queryset, months_to_fetch)
            # Perform aggregation
            new_results = _perform_aggregation(queryset)
            new_results_list = list(new_results)

            # Cache the new results
            _cache_agg_results(new_results_list, months_to_fetch, boundary_geometry)

            # Combine with cached results
            all_results = cached_results + new_results_list
        else:
            # If no months specified, get all data without caching
            queryset = _apply_filters(queryset, month_param)
            results = _perform_aggregation(queryset)
            all_results = list(results)

        # Serialize the data
        serializer = MeasurementAggregatedSerializer(all_results, many=True)
        serialized_data = serializer.data

        response_data = {"measurements": serialized_data, "count": len(serialized_data), "status": "success"}
        return JsonResponse(response_data, safe=True)

    except ValueError as e:
        return JsonResponse({"error": str(e)}, status=400)
    except Exception:
        logger.exception("Error in analyzed_measurements_view")
        return JsonResponse({"error": "Internal server error"}, status=500)
