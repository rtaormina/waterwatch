"""Create views associated with measurement collection."""

import json

from django.contrib.gis.geos import Point
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from measurements.models import Measurement, Temperature

# Create your views here.


@require_POST
def measurement_view(request):
    """View to handle incoming measurement data.

    Attributes
    ----------
    request : HttpRequest
        The HTTP request object containing the measurement data

    Returns
    -------
    JsonResponse
        A JSON response containing the measurement ID and any created metric IDs
    """
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    loc = payload.get("location")
    if not loc or "coordinates" not in loc:
        return JsonResponse({"error": "Missing or invalid location"}, status=400)
    lon, lat = loc["coordinates"]
    if lon is None or lat is None:
        return JsonResponse({"error": "Coordinates must be numbers"}, status=400)
    point = Point(round(lon, 3), round(lat, 3), srid=4326)

    flag = payload.get("flag", False)
    water_source = payload.get("water_source")
    if water_source is None:
        return JsonResponse({"error": "Missing water_source"}, status=400)

    measurement = Measurement.objects.create(
        location=point,
        flag=flag,
        water_source=water_source,
    )

    metrics = payload.get("metrics", [])
    if not isinstance(metrics, list):
        return JsonResponse({"error": "Metrics must be a list"}, status=400)

    created = []
    for m in metrics:
        mtype = m.get("metric_type")

        if mtype == "temperature":
            sensor = m.get("sensor")
            value = m.get("value")
            time_waited = m.get("time_waited")

            if sensor is None or value is None or time_waited is None:
                continue

            temp = Temperature.objects.create(
                measurement=measurement,
                sensor=sensor,
                value=value,
                time_waited=time_waited,
            )
            created.append(temp.id)
        else:
            continue

    return JsonResponse(
        {
            "measurement_id": measurement.id,
            "temperature_ids": created,
        },
        status=201,
    )
