"""Create views associated with measurement export."""

import json
import logging

from campaigns.models import Campaign
from django.contrib.gis.geos import GEOSException, GEOSGeometry
from django.db.models import Avg, Count
from django.db.models.expressions import RawSQL
from django.http import JsonResponse
from measurements.metrics import METRIC_MODELS
from measurements.models import Measurement
from rest_framework.decorators import api_view

from .factories import get_strategy
from .models import Location, Preset
from .serializers import PresetSerializer
from .utils import apply_measurement_filters

logger = logging.getLogger("WATERWATCH")


@api_view(["GET"])
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


@api_view(["GET"])
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


def build_base_queryset(ordered=False):
    """Build the base queryset with all necessary select_related and prefetch_related operations.

    This function creates the foundation queryset that both views need, including:
    - Related fields for all metric models
    - User relationship
    - Campaign prefetch for efficient loading
    - Optional ordering by ID for consistent results (when needed)

    Parameters
    ----------
    ordered : bool, optional
        Whether to order the queryset by ID. Default is False for better performance.
        Only use True when you specifically need consistent ordering.

    Returns
    -------
    QuerySet
        A queryset with all base optimizations applied
    """
    related_fields = [model.__name__.lower() for model in METRIC_MODELS]
    qs = Measurement.objects.select_related("user", *related_fields).prefetch_related("campaigns")

    if ordered:
        qs = qs.order_by("id")

    return qs


def apply_location_annotations(queryset):
    """Apply geographic annotations to include country, continent, and coordinates.

    This function performs the complex spatial join with the Location table and adds
    computed latitude/longitude fields. The spatial join uses ST_Contains to find
    which location polygon contains each measurement point.

    Parameters
    ----------
    queryset : QuerySet
        The base measurement queryset to annotate

    Returns
    -------
    QuerySet
        Queryset with geographic fields: country, continent, latitude, longitude
    """
    measurement_table = Measurement._meta.db_table
    location_table = Location._meta.db_table

    return queryset.extra(
        tables=[location_table],
        # This WHERE clause acts as our JOIN condition - find locations that contain each measurement
        where=[f"ST_Contains({location_table}.geom, {measurement_table}.location)"],
        # Select additional fields from the joined Location table
        select={
            "country": f"{location_table}.country_name",
            "continent": f"{location_table}.continent",
        },
    ).annotate(
        # Extract longitude and latitude from the PostGIS Point geometry
        longitude=RawSQL("ST_X(location)", []),
        latitude=RawSQL("ST_Y(location)", []),
    )


def fetch_metrics_for_measurements(measurement_ids, included_metrics=None):
    """Fetch all metrics for the given measurement IDs efficiently.

    This function solves the N+1 query problem by fetching all metrics in separate
    queries (one per metric type) rather than doing individual lookups. It groups
    metrics by measurement ID for easy lookup.

    Parameters
    ----------
    measurement_ids : list
        List of measurement IDs to fetch metrics for
    included_metrics : list, optional
        List of metric types to include. If None, includes all metrics.

    Returns
    -------
    dict
        Dictionary mapping measurement_id -> list of metric dictionaries
        Each metric dict includes a 'metric_type' field for identification
    """
    if included_metrics is None:
        included_metrics = [model.__name__.lower() for model in METRIC_MODELS]

    all_metrics = {}
    for metric_cls in METRIC_MODELS:
        name = metric_cls.__name__.lower()
        if name not in included_metrics:
            continue

        # Fetch all metrics of this type for our measurements in one query
        metrics_qs = metric_cls.objects.filter(measurement_id__in=measurement_ids).values()
        for metric in metrics_qs:
            measurement_id = metric.pop("measurement_id")
            metric["metric_type"] = name  # Add type identifier for client use
            all_metrics.setdefault(measurement_id, []).append(metric)

    return all_metrics


def fetch_campaigns_for_measurements(measurement_ids):
    """Fetch campaign names for the given measurement IDs efficiently.

    This function handles the many-to-many relationship between measurements and campaigns.
    It uses the through table to get associations, then fetches campaign names in bulk
    to avoid N+1 queries.

    Parameters
    ----------
    measurement_ids : list
        List of measurement IDs to fetch campaigns for

    Returns
    -------
    dict
        Dictionary mapping measurement_id -> list of campaign names
    """
    through = Measurement.campaigns.through

    # Get all (measurement_id, campaign_id) pairs for our measurements
    pairs = through.objects.filter(measurement_id__in=measurement_ids).values_list("measurement_id", "campaign_id")

    # Extract unique campaign IDs and fetch their names in one query
    campaign_ids = {camp_id for _, camp_id in pairs}
    id_to_name = dict(Campaign.objects.filter(id__in=campaign_ids).values_list("id", "name"))

    # Build the final mapping: measurement_id -> [campaign_names]
    campaigns_map = {}
    for m_id, camp_id in pairs:
        campaigns_map.setdefault(m_id, []).append(id_to_name[camp_id])

    return campaigns_map


def prepare_measurement_data(queryset, included_metrics=None):
    """Prepare complete measurement data with metrics and campaigns.

    This is the main coordination function that ties together all the data fetching
    operations. It takes a filtered queryset and returns fully populated measurement
    data ready for export or API response.

    Parameters
    ----------
    queryset : QuerySet
        Filtered measurement queryset (should already have location annotations)
    included_metrics : list, optional
        List of metric types to include

    Returns
    -------
    list
        List of measurement dictionaries with metrics and campaigns included
    """
    # Get the list of measurement IDs to work with
    measurement_ids = list(queryset.values_list("id", flat=True))

    # Fetch related data efficiently
    all_metrics = fetch_metrics_for_measurements(measurement_ids, included_metrics)
    campaigns_map = fetch_campaigns_for_measurements(measurement_ids)

    # Convert queryset to flat dictionaries with only the fields we need
    flat_measurements = queryset.values(
        "id",
        "timestamp",
        "local_date",
        "local_time",
        "flag",
        "water_source",
        "user_id",
        "country",
        "continent",
        "latitude",
        "longitude",
    )

    # Combine measurement data with metrics and campaigns
    data = []
    for row in flat_measurements:
        m_id = row["id"]
        row["metrics"] = all_metrics.get(m_id, [])
        row["campaigns"] = campaigns_map.get(m_id, [])
        data.append(row)

    return data


@api_view(["GET"])
def export_all_view(request):
    """Export all measurements with related metrics, campaigns, and user info.

    Supports optional boundary_geometry filter to limit results to a geographic area.

    Parameters
    ----------
    request : HttpRequest
        The HTTP request object, which may contain a "boundary_geometry" parameter.

    Returns
    -------
    JsonResponse
        JSON response containing measurements with related metrics and campaigns.
        If "boundary_geometry" is provided, it filters measurements within that geometry.
        If the geometry is invalid, it returns a 400 error with an appropriate message.
    """
    logger = logging.getLogger("WATERWATCH")

    # Start with our base queryset
    qs = build_base_queryset(ordered=True)

    # Apply geographic filter if provided
    boundary_geometry = request.GET.get("boundary_geometry")
    if boundary_geometry:
        try:
            polygon = GEOSGeometry(boundary_geometry)
            qs = qs.filter(location__within=polygon)
        except GEOSException:
            logger.exception("Invalid boundary_geometry format: %s", boundary_geometry)
            return JsonResponse({"error": "Invalid boundary_geometry format"}, status=400)

    # Add geographic annotations and prepare complete data
    qs = apply_location_annotations(qs)
    data = prepare_measurement_data(qs)

    return JsonResponse(data, safe=False, json_dumps_params={"indent": 2})


@api_view(["POST"])
def search_measurements_view(request):
    """Get measurements based on filters.

    This view handles filtering measurements based on location, water source, temperature,
    date, and time range. It can return either summary statistics or full export data
    depending on the format parameter.

    Parameters
    ----------
    request : HttpRequest
        The HTTP request object with filter parameters in the request body.

    Returns
    -------
    JsonResponse
        If format is specified (csv, json, xml, geojson): returns full measurement data
        Otherwise: returns JSON with count and average temperature statistics
    """
    logger = logging.getLogger("WATERWATCH")

    # Parse request data
    try:
        request_data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        logger.exception("Invalid JSON")
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    # Start with base queryset and apply filters
    qs = build_base_queryset()
    qs = apply_measurement_filters(request_data, qs)

    # Check if this is a data export request
    fmt = str(request_data.get("format", "")).lower()

    if fmt in ("csv", "json", "xml", "geojson"):
        # Check permissions for data export
        user = request.user
        if not user.groups.filter(name="researcher").exists() and not user.is_superuser and not user.is_staff:
            return JsonResponse({"error": "Forbidden: insufficient permissions"}, status=403)

        # Validate included metrics parameter
        included_metrics = request_data.get("measurements_included", [])
        if not isinstance(included_metrics, list):
            logger.warning("measurements_included was not a list: %s", included_metrics)
            included_metrics = []

        # Prepare data for export
        qs = apply_location_annotations(qs)

        # Get measurement IDs and fetch related data
        measurement_ids = list(qs.values_list("id", flat=True))
        all_metrics = fetch_metrics_for_measurements(measurement_ids, included_metrics)
        campaigns_map = fetch_campaigns_for_measurements(measurement_ids)

        # Flatten queryset for export
        qs = qs.values(
            "id",
            "timestamp",
            "local_date",
            "local_time",
            "flag",
            "water_source",
            "user_id",
            "country",
            "continent",
            "latitude",
            "longitude",
        )

        # Use strategy pattern for different export formats
        strategy = get_strategy(fmt)
        return strategy.export(qs, extra_data={"metrics": all_metrics, "campaigns": campaigns_map})

    # For non-export requests, return summary statistics
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
