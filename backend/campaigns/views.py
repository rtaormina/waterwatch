"""Create views associated with campaigns."""

# Create your views here.
from django.http import JsonResponse
from django.utils.dateparse import parse_datetime

from .models import Campaign


def get_active_campaigns(request):
    """View to handle incoming requests for active campaigns.

    Attributes
    ----------
    request : HttpRequest
        The HTTP request object containing the datetime parameter

    Returns
    -------
    JsonResponse
        A JSON response containing the active campaigns
    """
    dt_string = request.GET.get("datetime")
    dt = parse_datetime(dt_string)

    if not dt:
        return JsonResponse({"error": "Invalid or missing datetime"}, status=400)

    campaigns = Campaign.objects.filter(start_time__lte=dt, end_time__gte=dt)

    results = [
        {
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "start_time": c.start_time,
            "end_time": c.end_time,
            "region": c.region.geojson if c.region else None,
        }
        for c in campaigns
    ]

    return JsonResponse({"campaigns": results})
