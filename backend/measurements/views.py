"""Create views associated with measurements."""

import logging

from django.contrib.gis.geos import GEOSException, GEOSGeometry
from django.http import HttpResponseNotAllowed, JsonResponse
from measurement_collection.views import add_measurement_view
from measurement_export.views import export_all_view, search_measurements_view

from .metrics import METRIC_MODELS
from .models import Measurement

logger = logging.getLogger("WATERWATCH")


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
        - If GET: Calls export_all_view.
        - If POST: Calls add_measurement_view.
        - If neither: Returns 405 Method Not Allowed.
    """
    if request.method == "GET":
        return export_all_view(request)
    if request.method == "POST":
        return add_measurement_view(request)
    return HttpResponseNotAllowed(["GET", "POST"])


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
    if request.method == "POST":
        return search_measurements_view(request)
    return HttpResponseNotAllowed(["POST"])


def temperature_view(request):
    """
    Handle GET requests to retrieve temperature measurements, optionally filtered by a boundary geometry.

    Parameters
    ----------
    request : HttpRequest
        The HTTP request object, optionally containing 'boundary_geometry' as a GET parameter.

    Returns
    -------
    JsonResponse
        A JSON response containing a list of temperature values, or an error if the boundary geometry is invalid.
    """
    boundary_geometry = request.GET.get("boundary_geometry")
    query = Measurement.objects.select_related(*[model.__name__.lower() for model in METRIC_MODELS])
    if boundary_geometry:
        try:
            polygon = GEOSGeometry(boundary_geometry)
            query = query.filter(location__within=polygon)
        except GEOSException:
            logger.exception("Invalid boundary_geometry format: %s")
            return JsonResponse({"error": "Invalid boundary_geometry format"}, status=400)
    else:
        query = query.all()

    # If there are other metrics you want to add, you can include it to data
    data = [m.temperature.value for m in query if m.temperature is not None]

    return JsonResponse(data, safe=False, json_dumps_params={"indent": 2})
