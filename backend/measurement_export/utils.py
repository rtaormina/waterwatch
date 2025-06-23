"""Utils for measurement export."""

import json
import logging
import os
import pickle
from datetime import datetime, time

from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, Point
from django.core.cache import caches
from django.db.models import Q
from dotenv import load_dotenv

from .models import Location

load_dotenv()

logger = logging.getLogger("WATERWATCH")

_CONTINENT_GEOMS: dict[str, MultiPolygon] = {}
_COUNTRY_GEOMS: dict[str, MultiPolygon] = {}
_MAPPING: dict[str, set] = {}

_initialized = False

timeout_value = os.getenv("DJANGO_LOCATION_CACHE_TIMEOUT", "None")
location_cache_timeout = None if timeout_value == "None" else int(timeout_value)


def initialize_location_geometries():
    """Initialize the location geometries from the database and cache them.

    This function loads the geometries of continents and countries from the Location model,
    and caches them in the location_cache for efficient access.
    """
    global _CONTINENT_GEOMS, _COUNTRY_GEOMS, _MAPPING, _initialized
    if _initialized:
        return

    # Use the location_cache instead of default cache
    location_cache = caches["location_cache"]

    cached_data = location_cache.get("location_geoms")
    if cached_data is None:
        # Build geometries and cache them
        geom_data = _build_geoms()
        cached_data = pickle.dumps(geom_data)
        location_cache.set("location_geoms", cached_data, location_cache_timeout)

    _CONTINENT_GEOMS, _COUNTRY_GEOMS, _MAPPING = pickle.loads(cached_data)
    _initialized = True


def _build_geoms():
    """Build geometry data from the Location model."""
    continent_geoms: dict[str, MultiPolygon] = {}
    country_geoms: dict[str, MultiPolygon] = {}
    mapping: dict[str, set] = {}

    for continent, wkb in Location.objects.values_list("continent", "geom"):
        poly = GEOSGeometry(wkb)
        existing = continent_geoms.get(continent)
        if existing:
            u = existing.union(poly)
            continent_geoms[continent] = u if isinstance(u, MultiPolygon) else MultiPolygon(u)
        else:
            continent_geoms[continent] = poly if isinstance(poly, MultiPolygon) else MultiPolygon(poly)

    for country, wkb in Location.objects.values_list("country_name", "geom"):
        poly = GEOSGeometry(wkb)
        country_geoms[country] = poly if isinstance(poly, MultiPolygon) else MultiPolygon(poly)

    for continent, country in Location.objects.values_list("continent", "country_name"):
        mapping.setdefault(continent, set()).add(country)

    return (continent_geoms, country_geoms, mapping)


def clear_location_cache():
    """Clear the location cache and reset initialization flag.

    This function clears the cached geometries and resets the initialization flag,
    allowing the geometries to be reloaded from the database on the next request.
    """
    global _initialized
    location_cache = caches["location_cache"]
    location_cache.clear()
    _initialized = False


def lookup_location(lat: float, lon: float) -> dict:
    """Lookup the location by reverse geocoding the latitude and longitude.

    Uses cached geometries and PostGIS operations to infer the location efficiently.
    This function leverages the location cache for better performance.

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
    # Use location cache for coordinate lookups
    location_cache = caches["location_cache"]
    cache_key = f"coord_lookup:{lat:.6f}:{lon:.6f}"

    cached_result = location_cache.get(cache_key)
    if cached_result is not None:
        return cached_result

    # First try database lookup using PostGIS
    pt = Point(lon, lat, srid=4326)
    match = Location.objects.filter(geom__contains=pt).first()

    result = {"country": None, "continent": None}
    if match:
        result = {"country": match.country_name, "continent": match.continent}

    # Cache the result
    location_cache.set(cache_key, result, location_cache_timeout)
    return result


def apply_measurement_filters(data, qs):
    """Apply filters to the measurement queryset based on request parameters.

    This function filters measurements based on location, temperature, date range, and time slots.

    Parameters
    ----------
    data : dict
        The request data containing filter parameters.
    qs : QuerySet
        The initial queryset of measurements to filter.

    Returns
    -------
    QuerySet
        The filtered queryset of measurements.
    """
    # Temperature filter
    qs = filter_by_water_sources(qs, data)
    qs = filter_measurement_by_temperature(qs, data)

    # Date range filter
    qs = filter_by_date_range(qs, data)

    # Time slots filter
    qs = filter_by_time_slots(qs, data)

    # Location filter
    return apply_location_filter(qs, data)


def filter_by_water_sources(qs, data):
    """Filter the queryset by water sources.

    This function filters measurements based on water sources provided in the request.

    Parameters
    ----------
    qs : QuerySet
        The initial queryset of measurements to filter.
    data : dict
        The request data containing filter parameters.

    Returns
    -------
    QuerySet
        The filtered queryset of measurements.
    """
    water_sources = data.get("measurements[waterSources]", [])
    if water_sources and not isinstance(water_sources, list):
        logger.warning("Water sources data is not a list: %s", water_sources)
        water_sources = []

    water_sources = [ws.lower() for ws in water_sources if isinstance(ws, str)]

    if water_sources:
        qs = qs.filter(water_source__in=water_sources)
    return qs


def filter_measurement_by_temperature(qs, data):
    """Filter the queryset by temperature range.

    This function filters measurements based on a temperature range provided in the request.

    Parameters
    ----------
    qs : QuerySet
        The initial queryset of measurements to filter.
    data : dict
        The request data containing filter parameters.

    Returns
    -------
    QuerySet
        The filtered queryset of measurements.
    """
    temp_from_str = data.get("measurements[temperature][from]")
    temp_to_str = data.get("measurements[temperature][to]")

    try:
        if temp_from_str:
            qs = qs.filter(temperature__value__gte=float(temp_from_str))
        if temp_to_str:
            qs = qs.filter(temperature__value__lte=float(temp_to_str))
    except ValueError as e:
        logger.warning("Invalid temperature value: %s. From: '%s', To: '%s'", e, temp_from_str, temp_to_str)
    return qs


def filter_by_date_range(qs, data):
    """Filter the queryset by date range.

    This function filters measurements based on a date range provided in the request.

    Parameters
    ----------
    qs : QuerySet
        The initial queryset of measurements to filter.
    data : dict
        The request data containing filter parameters.

    Returns
    -------
    QuerySet
        The filtered queryset of measurements.
    """
    date_from = data.get("dateRange[from]")
    date_to = data.get("dateRange[to]")

    if date_from and not isinstance(date_from, str):
        logger.warning("dateRange[from] is not a string: %s", date_from)
        date_from = None

    if date_to and not isinstance(date_to, str):
        logger.warning("dateRange[to] is not a string: %s", date_to)
        date_to = None

    # check if date_from and date_to are valid ISO format dates
    def is_valid_iso_date(date_str):
        try:
            datetime.fromisoformat(date_str)
        except (TypeError, ValueError):
            return False
        else:
            return True

    if date_from and not is_valid_iso_date(date_from):
        logger.warning("dateRange[from] is not a valid ISO date: %s", date_from)
        date_from = None

    if date_to and not is_valid_iso_date(date_to):
        logger.warning("dateRange[to] is not a valid ISO date: %s", date_to)
        date_to = None

    if date_from:
        qs = qs.filter(local_date__gte=date_from)

    if date_to:
        qs = qs.filter(local_date__lte=date_to)

    return qs


def filter_by_time_slots(qs, data):
    """Filter the queryset by time slots.

    This function filters measurements based on time slots provided in the request.
    It filters by the local time component of the timestamp, ignoring timezone offsets.

    Parameters
    ----------
    qs : QuerySet
        The initial queryset of measurements to filter.
    data : dict
        The request data containing filter parameters.

    Returns
    -------
    QuerySet
        The filtered queryset of measurements.
    """
    times_json_str = data.get("times")
    if not times_json_str:
        return qs

    try:
        if isinstance(times_json_str, str):
            slots = json.loads(times_json_str)
        elif isinstance(times_json_str, list):
            slots = times_json_str
        else:
            logger.warning("Times data is not a string or list: %s", type(times_json_str))
            return qs

        if not isinstance(slots, list):
            logger.warning("Parsed times data is not a list: %s", slots)
            return qs  # Or qs.none() if invalid format means no results
    except json.JSONDecodeError:
        logger.warning("Invalid JSON for time_slots string: %s", times_json_str)
        return qs

    time_q = Q()
    for slot_data in slots:
        if not isinstance(slot_data, dict):
            logger.warning("Slot data is not a dictionary: %s", slot_data)
            continue
        try:
            start_str = slot_data.get("from")
            end_str = slot_data.get("to")
            start = time.fromisoformat(start_str) if start_str else time(0, 0, 0)
            end = time.fromisoformat(end_str) if end_str else time(23, 59, 59)
            time_q |= Q(local_time__range=(start, end))
        except ValueError:
            logger.warning("Invalid time format in slot: %s. From: '%s', To: '%s'", slot_data, start_str, end_str)
            continue  # Skip this slot

    if time_q:  # Only apply filter if at least one valid time condition was generated
        return qs.filter(time_q)
    return qs


def apply_location_filter(qs, data):
    """Apply location filtering using the location_ref field for efficient queries.

    Parameters
    ----------
    qs : QuerySet
        The queryset to filter
    data : dict
        Request data containing location filters

    Returns
    -------
    QuerySet
        Filtered queryset with location constraints
    """
    continents = data.get("location[continents]", [])
    countries = data.get("location[countries]", [])

    # Validate input data types
    if continents and not isinstance(continents, list):
        logger.warning("Continents data is not a list: %s", continents)
        continents = []

    if countries and not isinstance(countries, list):
        logger.warning("Countries data is not a list: %s", countries)
        countries = []

    # If no location filters, return unchanged queryset
    if not continents and not countries:
        return qs

    initialize_location_geometries()

    if not _validate_countries_for_continents(continents, countries):
        return qs

    if continents:
        qs = qs.filter(location_ref__continent__in=continents)
    if countries:
        qs = qs.filter(location_ref__country_name__in=countries)

    return qs


def _validate_countries_for_continents(continents, countries):
    if countries:
        if not continents:
            logger.error("Countries specified but no continents provided. Location filtering is invalid.")
            return False

        valid_countries_for_continents = set()
        for continent in continents:
            if continent in _MAPPING:
                valid_countries_for_continents.update(_MAPPING[continent])

        invalid_countries = set(countries) - valid_countries_for_continents
        if invalid_countries:
            logger.error(
                "Countries %s do not belong to any of the specified continents %s. Location filtering is invalid.",
                list(invalid_countries),
                continents,
            )
            return False
    return True
