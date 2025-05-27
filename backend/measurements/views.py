"""Create views associated with measurements."""

import logging

from django.http import HttpResponseNotAllowed
from measurement_collection.views import add_measurement_view
from measurement_export.views import search_measurements_view

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
    # TODO: Implement export_all_view if needed
    # if request.method == "GET":
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
