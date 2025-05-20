"""Create views associated with measurement export."""

from measurements.models import Measurement

from .factories import get_strategy
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
    # Since authentication is currently not integrated into the project, authenticating this request
    # is commented out for now.
    # user = request.user
    # is_researcher = user.groups.filter(name="researcher").exists()
    # if not (user.is_staff or is_researcher):
    #     return JsonResponse({"detail": "You must be a researcher or admin to export all measurements."}, status=400)

    fmt = request.GET.get("format", "json").lower()
    qs = Measurement.objects.all()
    data = MeasurementSerializer(qs, many=True).data

    strategy = get_strategy(fmt)
    return strategy.export(data)
