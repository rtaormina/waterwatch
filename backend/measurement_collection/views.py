"""Create views associated with measurement collection."""

from django.http import JsonResponse
from rest_framework.decorators import api_view

from .serializers import MeasurementSerializer

# Create your views here.


@api_view(["POST"])
def measurement_view(request):
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
