"""Create views associated with campaigns."""

# Create your views here.
import logging

from django.contrib.gis.geos import Point
from django.http import JsonResponse
from django.utils.dateparse import parse_datetime
from rest_framework.decorators import api_view

from .models import Campaign

logger = logging.getLogger("WATERWATCH")


@api_view(["GET"])
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
    lat = request.GET.get("lat")
    lng = request.GET.get("lng")
    dt = parse_datetime(dt_string)

    if not dt:
        return JsonResponse({"error": "Invalid or missing datetime"}, status=400)
    matching_campaigns = find_matching_campaigns(dt, lat, lng)

    results = [
        {
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "start_time": c.start_time,
            "end_time": c.end_time,
            "region": c.region.geojson if c.region else None,
        }
        for c in matching_campaigns
    ]

    return JsonResponse({"campaigns": results})


def find_matching_campaigns(dt, lat, lng):
    """Find matching campaigns based on datetime and location.

    Attributes
    ----------
    dt : datetime
        The datetime to check for active campaigns
    lat : str
        The latitude of the location
    lng : str
        The longitude of the location

    Returns
    -------
    QuerySet
        A QuerySet of matching Campaign objects
    """
    if not lat or not lng:
        logger.warning("No lat/lng provided, returning all campaigns")
        return Campaign.objects.filter(start_time__lte=dt, end_time__gte=dt).order_by("end_time")
    point = Point(float(lng), float(lat))
    return (
        Campaign.objects.filter(start_time__lte=dt, end_time__gte=dt)
        .filter(region__contains=point)
        .order_by("end_time")
    )
