"""Utils for measurement export."""

from django.contrib.gis.geos import Point

from .models import Location


def lookup_location(lat: float, lon: float) -> dict:
    """Lookup the location by reverse geocoding the latitude and longitude.

    Uses PostGIS reverse geocoding and the countries table to infer the location.

    Parameters
    ----------
    lat : float
        Latitude of the location
    lon : float
        Longitude of the location

    Returns
    -------
    dict
        Dictionary with keys:
        - `country` (str): Corresponding country
        - `continent` (str): Corresponding continent
    """
    pt = Point(lon, lat, srid=4326)
    match = Location.objects.filter(geom__contains=pt).first()
    if not match:
        return {"country": None, "continent": None}
    return {"country": match.country_name, "continent": match.continent}
