"""Utils for measurement export."""

import json
import logging
import pickle
from datetime import time

from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, Point
from django.core.cache import cache
from django.db.models import Q

from .models import Location

logger = logging.getLogger("WATERWATCH")

_CONTINENT_GEOMS: dict[str, MultiPolygon] = {}
_COUNTRY_GEOMS: dict[str, MultiPolygon] = {}
_MAPPING: dict[str, set] = {}

_initialized = False


def initialize_location_geometries():
    """Initialize the location geometries from the database and cache them.

    This function loads the geometries of continents and countries from the Location model,
    and caches them for efficient access.
    """
    global _CONTINENT_GEOMS, _COUNTRY_GEOMS, _MAPPING, _initialized
    if _initialized:
        return

    data = cache.get_or_set(
        "location_geoms",
        default=lambda: pickle.dumps(_build_geoms()),
        timeout=None,
    )
    _CONTINENT_GEOMS, _COUNTRY_GEOMS, _MAPPING = pickle.loads(data)
    _initialized = True


def _build_geoms():
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
    initialize_location_geometries()

    # Temperature filter
    qs = filter_by_water_sources(qs, data)
    qs = filter_measurement_by_temperature(qs, data)

    # Date range filter
    qs = filter_by_date_range(qs, data)

    # Time slots filter
    qs = filter_by_time_slots(qs, data)

    # Location filter
    return apply_optimized_location_filter(qs, data)


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


def analyze_continent_selection_efficiency(continent, selected_countries, all_countries_in_continent):
    """
    Determine the most efficient filtering strategy for a single continent.

    This is the core optimization logic. For each continent, we decide whether it's
    more efficient to:
    1. Include the entire continent (if all countries are selected)
    2. Include specific countries only (if few countries are selected)
    3. Include continent and exclude specific countries (if most countries are selected)

    Parameters
    ----------
    continent : str
        The continent name
    selected_countries : set
        Set of selected countries from this continent
    all_countries_in_continent : set
        Set of all countries in this continent

    Returns
    -------
    dict
        Strategy for this continent with keys:
        - 'type': 'full_continent', 'include_countries', or 'exclude_countries'
        - 'continent': continent name (if using continent-level filtering)
        - 'countries_to_include': list of countries to include (if any)
        - 'countries_to_exclude': list of countries to exclude (if any)
    """
    total_countries = len(all_countries_in_continent)
    selected_count = len(selected_countries)
    unselected_countries = all_countries_in_continent - selected_countries
    unselected_count = len(unselected_countries)

    # If all countries in this continent are selected, just filter by continent
    # This is the most efficient case - one geometric operation instead of many
    if selected_count == total_countries:
        return {"type": "full_continent", "continent": continent}

    # If more than half the countries are selected, it's often more efficient
    # to include the continent and exclude the unselected countries
    # This is especially true when there are many countries in the continent
    if unselected_count < selected_count and unselected_count <= 3:
        # Use exclusion strategy: include continent, exclude specific countries
        # We limit this to 3 or fewer exclusions to avoid complex queries
        return {"type": "exclude_countries", "continent": continent, "countries_to_exclude": list(unselected_countries)}

    # Use inclusion strategy: include only the selected countries
    # This is best when selecting a small subset of countries
    return {"type": "include_countries", "countries_to_include": list(selected_countries)}


def optimize_location_filtering(selected_continents, selected_countries):
    """Analyze the relationship between selected continents and countries to determine filtering strategy.

    Since countries must belong to selected continents, we can analyze each continent
    independently and combine the strategies.

    Parameters
    ----------
    selected_continents : list
        List of selected continent names
    selected_countries : list
        List of selected country names (must belong to selected continents)

    Returns
    -------
    dict
        Optimization strategy with keys:
        - 'continent_filters': list of continents to filter by
        - 'country_include_filters': list of countries to include
        - 'country_exclude_filters': list of countries to exclude from continent filtering
    """
    if not selected_continents:
        return {"continent_filters": [], "country_include_filters": [], "country_exclude_filters": []}

    # Get the mapping of continents to their countries
    continent_countries = _MAPPING

    # Convert to sets for efficient operations
    selected_countries_set = set(selected_countries)

    # Key insight: If no countries are selected, we want ALL countries from the selected continents
    # This means we should treat each selected continent as if all its countries were selected
    countries_were_specified = bool(selected_countries)

    # Analyze each selected continent independently
    continent_filters = []
    country_include_filters = []
    country_exclude_filters = []

    for continent in selected_continents:
        if continent not in continent_countries:
            # Skip unknown continents
            continue

        all_countries_in_continent = continent_countries[continent]

        if countries_were_specified:
            # Normal case: specific countries were selected
            selected_from_continent = selected_countries_set & all_countries_in_continent

            # Skip continents with no selected countries
            if not selected_from_continent:
                continue
        else:
            # Special case: no countries specified means we want all countries from this continent
            selected_from_continent = all_countries_in_continent

        # Determine the best strategy for this continent
        strategy = analyze_continent_selection_efficiency(
            continent, selected_from_continent, all_countries_in_continent
        )

        # Apply the strategy
        if strategy["type"] == "full_continent":
            continent_filters.append(strategy["continent"])

        elif strategy["type"] == "exclude_countries":
            continent_filters.append(strategy["continent"])
            country_exclude_filters.extend(strategy["countries_to_exclude"])

        elif strategy["type"] == "include_countries":
            country_include_filters.extend(strategy["countries_to_include"])

    return {
        "continent_filters": continent_filters,
        "country_include_filters": country_include_filters,
        "country_exclude_filters": country_exclude_filters,
    }


def _build_inclusion_query(strategy):
    inclusion_query = Q()
    for continent in strategy["continent_filters"]:
        geom = _CONTINENT_GEOMS.get(continent)
        if geom:
            inclusion_query |= Q(location__within=geom)
    for country in strategy["country_include_filters"]:
        geom = _COUNTRY_GEOMS.get(country)
        if geom:
            inclusion_query |= Q(location__within=geom)
    return inclusion_query


def _build_exclusion_query(strategy):
    exclusion_query = Q()
    for country in strategy["country_exclude_filters"]:
        geom = _COUNTRY_GEOMS.get(country)
        if geom:
            exclusion_query |= Q(location__within=geom)
    return exclusion_query


def apply_optimized_location_filter(qs, data):
    """Apply location filtering using the optimized strategy.

    This function replaces the separate continent and country filtering with
    a single, optimized approach that eliminates redundant geometric operations.

    Parameters
    ----------
    qs : QuerySet
        The queryset to filter
    data : dict
        Request data containing location filters

    Returns
    -------
    QuerySet
        Filtered queryset with optimized location constraints
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

    # Get the optimized filtering strategy
    strategy = optimize_location_filtering(continents, countries)

    # Build and apply inclusion query
    inclusion_query = _build_inclusion_query(strategy)
    if inclusion_query:
        qs = qs.filter(inclusion_query)

    # Build and apply exclusion query
    exclusion_query = _build_exclusion_query(strategy)
    if exclusion_query:
        qs = qs.exclude(exclusion_query)

    return qs
