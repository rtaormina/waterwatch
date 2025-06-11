"""Create views associated with Measurement Analysis."""

import logging
from datetime import timedelta

from django.contrib.gis.geos import GEOSGeometry
from django.db.models import Avg, Count, Max, Min
from django.http import JsonResponse
from django.utils import timezone
from measurements.metrics import METRIC_MODELS
from measurements.models import Measurement
from rest_framework.decorators import api_view

from .serializers import MeasurementAggregatedSerializer

logger = logging.getLogger("WATERWATCH")


# Create your views here.
@api_view(["GET"])
def analyzed_measurements_view(request):
    """Export aggregated measurements.

    This view exports aggregated measurements with optional filters for month in which the measurement was taken.

    Parameters
    ----------
    request : HttpRequest
        The HTTP request object.

    Returns
    -------
    JsonResponse
        JSON response containing aggregated measurements.
    """
    boundary_geometry = request.GET.get("boundary_geometry")

    query = Measurement.objects.select_related(*[model.__name__.lower() for model in METRIC_MODELS])

    # location filter
    if boundary_geometry:
        try:
            polygon = GEOSGeometry(boundary_geometry)
            query = query.filter(location__within=polygon)
        except Exception:
            return JsonResponse({"error": "Invalid boundary_geometry"}, status=400)

    # date filter
    if month_param := request.GET.get("month"):
        parts = [p.strip() for p in month_param.split(",") if p.strip()]
        if parts == ["0"]:
            cutoff = timezone.now().date() - timedelta(days=30)
            query = query.filter(local_date__gte=cutoff)
        else:
            try:
                months = [int(p) for p in parts]
            except ValueError:
                return JsonResponse({"error": "Invalid month parameter; must be 0 or comma-separated 1-12"}, status=400)
            months = [m for m in months if 1 <= m <= 12]
            if not months:
                return JsonResponse({"error": "No valid month numbers provided; must be 0 or 1-12"}, status=400)
            query = query.filter(local_date__month__in=months)

    # aggregate
    results = query.values("location").annotate(
        count=Count("location"),
        avg_temperature=Avg("temperature__value"),
        min_temperature=Min("temperature__value"),
        max_temperature=Max("temperature__value"),
    )

    serializer = MeasurementAggregatedSerializer(results, many=True)
    serialized_data = serializer.data

    # Return as JSON response
    return JsonResponse(
        {"measurements": serialized_data, "count": len(serialized_data), "status": "success"}, safe=True
    )
