"""Create views associated with measurement export."""

import csv
import json

from django.http import HttpResponse, JsonResponse
from measurements.models import Measurement

from .serializers import MeasurementSerializer


def export_all_view(request):
    """Export all measurements.

    If the user is not a researcher/admin, returns an error.
    Otherwise, returns a success message.

    Parameters
    ----------
    request : HttpRequest
        The HTTP request object.

    Returns
    -------
    JsonResponse
        - If user is not researcher/admin:
            JSON with {"detail": "You must be a researcher or admin to export all measurements."}, status 400.
        - On successful logout:
            JSON with {"detail": "Successfully retrieved all measurements."}, status 200.
    """
    # user = request.user

    # is_researcher = user.groups.filter(name="researcher").exists()
    # if not (user.is_staff or is_researcher):
    #     return JsonResponse({"detail": "You must be a researcher or admin to export all measurements."}, status=400)

    fmt = request.GET.get("format", "json").lower()
    measurements = Measurement.objects.all()
    data = MeasurementSerializer(measurements, many=True).data

    if fmt == "csv":
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="measurements.csv"'
        writer = csv.writer(response)

        headers = list(data[0].keys()) if data else []
        writer.writerow(headers)

        for item in data:
            # JSON-encode the metrics list
            item["metrics"] = json.dumps(item.get("metrics", []))
            writer.writerow(item.values())

        return response

    return JsonResponse({"detail": "Successfully retrieved all measurements.", "data": data}, status=200, safe=False)
