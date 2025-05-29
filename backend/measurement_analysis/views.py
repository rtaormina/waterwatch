"""Create views associated with Measurement Analysis."""

import logging

from django.contrib.gis.geos import GEOSException, GEOSGeometry
from django.db.models import Avg, Count
from django.http import JsonResponse
from measurements.metrics import METRIC_MODELS
from measurements.models import Measurement
from rest_framework.decorators import api_view

from .serializers import MeasurementAggregatedSerializer

logger = logging.getLogger("WATERWATCH")


# Create your views here.
@api_view(["GET"])
def analysed_measurements_view(request):
    """Export aggregated measurements.

    This view exports aggregated measurements.

    Parameters
    ----------
    request : HttpRequest
        The HTTP request object.

    Returns
    -------
    JsonResponse
        JSON response containing aggregated measurements.
    """
    boundry_geometry = request.GET.get("boundry_geometry")
    query = Measurement.objects.select_related(*[model.__name__.lower() for model in METRIC_MODELS])
    if boundry_geometry:
        try:
            polygon = GEOSGeometry(boundry_geometry)
            query = query.filter(location__within=polygon)
            logger.debug("Filtering measurements within the provided boundary geometry: %s.", polygon)
        except (GEOSException, ValueError, TypeError):
            logger.exception("Invalid boundry_geometry format: %s", boundry_geometry)
            return JsonResponse({"error": "Invalid boundry_geometry format"}, status=400)
    else:
        query = query.all()

    results = query.values("location").annotate(count=Count("location"), avg_temperature=Avg("temperature__value"))

    serializer = MeasurementAggregatedSerializer(results, many=True)
    serialized_data = serializer.data

    # Return as JSON response
    return JsonResponse(
        {"measurements": serialized_data, "count": len(serialized_data), "status": "success"}, safe=True
    )
