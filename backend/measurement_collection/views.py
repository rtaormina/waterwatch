"""Create views associated with measurement collection."""

from django.core.cache import cache
from django.http import JsonResponse
from measurements.metrics import METRIC_MODELS

from .serializers import MeasurementSerializer

# Create your views here.


def add_measurement_view(request):
    """View to handle incoming measurement data.

    Attributes
    ----------
    request : HttpRequest
        The HTTP request object containing the measurement data

    Returns
    -------
    JsonResponse
        A JSON response containing the measurement ID
    """
    serializer = MeasurementSerializer(data=request.data)
    if serializer.is_valid():
        measurement = serializer.save()

        has_metrics = False
        for metric_cls in METRIC_MODELS:
            attr = metric_cls.__name__.lower()
            if hasattr(measurement, attr) and getattr(measurement, attr, None):
                has_metrics = True
                break

        if not has_metrics:
            measurement.delete()
            return JsonResponse(
                {"error": "At least one metric must be provided with the measurement."},
                status=400,
            )

        cache.clear()
        return JsonResponse(
            {
                "measurement_id": measurement.id,
            },
            status=201,
        )
    return JsonResponse(
        {
            "error": serializer.errors,
        },
        status=400,
    )
