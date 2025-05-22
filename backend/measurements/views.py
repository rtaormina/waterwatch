"""Create views associated with measurements."""

from django.http import HttpResponseNotAllowed
from measurement_collection.views import add_measurement_view
from measurement_export.views import measurements_view


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
        return measurements_view(request)
    if request.method == "POST":
        return add_measurement_view(request)
    return HttpResponseNotAllowed(["GET", "POST"])
