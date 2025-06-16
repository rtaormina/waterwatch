"""Comprehensive test suite for measurement export utils."""

import json
import pickle
from datetime import date, time, timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from django.core.cache import cache
from django.db import connection
from django.test import TestCase
from measurements.models import Measurement, Temperature

from measurement_export import utils
from measurement_export.utils import (
    _build_geoms,
    _build_inclusion_query,
    analyze_continent_selection_efficiency,
    apply_measurement_filters,
    apply_optimized_location_filter,
    filter_by_date_range,
    filter_by_time_slots,
    filter_by_water_sources,
    filter_measurement_by_temperature,
    initialize_location_geometries,
    lookup_location,
    optimize_location_filtering,
)


class UtilsTestCase(TestCase):
    """Base test case with common setup for utils tests."""

    @classmethod
    def setUpTestData(cls):
        """Set up test data for the test cases."""
        user = get_user_model()
        cls.superuser = user.objects.create_superuser(
            username="testsuperuser", email="superuser@example.com", password="superpassword"
        )

        # Create locations table with test data
        with connection.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS locations (
                    id SERIAL PRIMARY KEY,
                    country_name VARCHAR(44),
                    continent VARCHAR(23),
                    geom geometry
                );
            """)

            # Clear existing data
            cursor.execute("DELETE FROM locations;")

            # Europe
            cursor.execute("""
                INSERT INTO locations (country_name, continent, geom) VALUES
                ('Netherlands', 'Europe', ST_GeomFromText('POLYGON((3 51, 8 51, 8 54, 3 54, 3 51))', 4326)),
                ('Germany', 'Europe', ST_GeomFromText('POLYGON((5 47, 15 47, 15 55, 5 55, 5 47))', 4326)),
                ('France', 'Europe', ST_GeomFromText('POLYGON((-5 42, 8 42, 8 51, -5 51, -5 42))', 4326));
            """)

            # North America
            cursor.execute("""
                INSERT INTO locations (country_name, continent, geom) VALUES
                ('USA', 'North America', ST_GeomFromText('POLYGON((-125 25, -65 25, -65 49, -125 49, -125 25))', 4326)),
                ('Canada', 'North America', ST_GeomFromText('POLYGON((-140 41, -50 41, -50 83, -140 83, -140 41))', 4326));
            """)

            # Asia
            cursor.execute("""
                INSERT INTO locations (country_name, continent, geom) VALUES
                ('Japan', 'Asia', ST_GeomFromText('POLYGON((129 30, 146 30, 146 46, 129 46, 129 30))', 4326)),
                ('China', 'Asia', ST_GeomFromText('POLYGON((73 18, 135 18, 135 54, 73 54, 73 18))', 4326));
            """)

        # Create test measurements with various properties
        cls.measurement_netherlands = Measurement.objects.create(
            location=Point(5.5, 52.5),  # Netherlands
            flag=False,
            water_source="network",
            local_date=date(2024, 1, 15),
            local_time=time(9, 30),
        )

        cls.measurement_germany = Measurement.objects.create(
            location=Point(10, 50),  # Germany
            flag=True,
            water_source="well",
            local_date=date(2024, 1, 20),
            local_time=time(14, 45),
        )

        cls.measurement_usa = Measurement.objects.create(
            location=Point(-100, 40),  # USA
            flag=False,
            water_source="rooftop tank",
            local_date=date(2024, 2, 1),
            local_time=time(22, 15),
        )

        cls.measurement_japan = Measurement.objects.create(
            location=Point(140, 35),  # Japan
            flag=True,
            water_source="other",
            local_date=date(2024, 2, 10),
            local_time=time(6, 0),
        )

        # Create temperature measurements
        cls.temp_cold = Temperature.objects.create(
            measurement=cls.measurement_netherlands,
            sensor="Digital Thermometer",
            value=12.5,
            time_waited=timedelta(seconds=30),
        )

        cls.temp_warm = Temperature.objects.create(
            measurement=cls.measurement_germany,
            sensor="Analog Thermometer",
            value=25.0,
            time_waited=timedelta(seconds=45),
        )

        cls.temp_hot = Temperature.objects.create(
            measurement=cls.measurement_usa, sensor="Digital Thermometer", value=35.8, time_waited=timedelta(seconds=30)
        )

        cls.temp_very_hot = Temperature.objects.create(
            measurement=cls.measurement_japan, sensor="IR Thermometer", value=45.2, time_waited=timedelta(seconds=15)
        )

    def setUp(self):
        """Set up for each test."""
        # Clear cache to ensure clean state
        cache.clear()
        # Reset global state
        import measurement_export.utils as utils_module

        utils_module._initialized = False
        utils_module._CONTINENT_GEOMS = {}
        utils_module._COUNTRY_GEOMS = {}
        utils_module._MAPPING = {}


class LocationGeometryInitializationTests(UtilsTestCase):
    """Tests for location geometry initialization and caching."""

    def test_initialize_location_geometries(self):
        """Test that location geometries are properly initialized."""
        initialize_location_geometries()

        # Import the global variables to check they were set
        import measurement_export.utils as utils_module

        assert utils_module._initialized
        assert "Europe" in utils_module._CONTINENT_GEOMS
        assert "North America" in utils_module._CONTINENT_GEOMS
        assert "Asia" in utils_module._CONTINENT_GEOMS

        assert "Netherlands" in utils_module._COUNTRY_GEOMS
        assert "Japan" in utils_module._COUNTRY_GEOMS

        # Check mapping structure
        assert "Europe" in utils_module._MAPPING
        assert "Netherlands" in utils_module._MAPPING["Europe"]
        assert "Germany" in utils_module._MAPPING["Europe"]

    def test_initialize_location_geometries_idempotent(self):
        """Test that multiple calls to initialize don't cause issues."""
        initialize_location_geometries()
        len(cache.get_or_set("location_geoms", default=lambda: b""))

        initialize_location_geometries()
        len(cache.get_or_set("location_geoms", default=lambda: b""))

        # Should be the same - no additional processing
        import measurement_export.utils as utils_module

        assert utils_module._initialized

    def test_build_geoms(self):
        """Test the _build_geoms helper function."""
        continent_geoms, country_geoms, mapping = _build_geoms()

        # Check continent geometries
        assert "Europe" in continent_geoms
        assert "North America" in continent_geoms
        assert "Asia" in continent_geoms

        # Check country geometries
        assert "Netherlands" in country_geoms
        assert "USA" in country_geoms

        # Check mapping
        assert "Europe" in mapping
        assert "Netherlands" in mapping["Europe"]
        assert "Germany" in mapping["Europe"]

    @patch("measurement_export.utils._build_geoms")
    @patch("measurement_export.utils.caches")
    def test_cache_miss_scenario(self, mock_caches, mock_build_geoms):
        """Test that geometries are built and cached when the cache is empty."""
        # --- Import inside the test to use the patched environment ---

        # 1. Setup the mocks
        mock_location_cache = mock_caches.__getitem__.return_value
        mock_location_cache.get.return_value = None  # Simulate cache miss

        # Define what _build_geoms should return to avoid DB calls
        expected_geoms = ({"continent": 1}, {"country": 2}, {"mapping": 3})
        mock_build_geoms.return_value = expected_geoms

        # 2. Call the function
        utils.initialize_location_geometries()

        # 3. Assertions
        # Ensure we checked the cache first
        mock_location_cache.get.assert_called_once_with("location_geoms")

        # Ensure we built the geoms since the cache was empty
        mock_build_geoms.assert_called_once()

        # Ensure we stored the newly built geoms in the cache
        mock_location_cache.set.assert_called_once()
        call_args = mock_location_cache.set.call_args

        # Assert positional arguments
        assert call_args[0][0] == "location_geoms"
        assert pickle.loads(call_args[0][1]) == expected_geoms

        # --- FIX ---
        # The timeout is the third POSITIONAL argument, not a keyword argument.
        # So we check the args tuple (call_args[0]) at index 2.
        assert call_args[0][2] is None  # Check the timeout value

    @patch("measurement_export.utils._build_geoms")
    @patch("measurement_export.utils.caches")
    def test_cache_hit_scenario(self, mock_caches, mock_build_geoms):
        """Test that geometries are loaded from cache if available."""
        from measurement_export import utils

        # 1. Setup the mocks
        mock_location_cache = mock_caches.__getitem__.return_value

        # Simulate a cache hit by providing cached data
        cached_geoms = ({"continent": 1}, {"country": 2}, {"mapping": 3})
        mock_location_cache.get.return_value = pickle.dumps(cached_geoms)

        # 2. Call the function
        utils.initialize_location_geometries()

        # 3. Assertions
        # Ensure we checked the cache
        mock_location_cache.get.assert_called_once_with("location_geoms")

        # Ensure we DID NOT build geoms or set the cache, as it was a hit
        mock_build_geoms.assert_not_called()
        mock_location_cache.set.assert_not_called()

        # Verify that the global variables are set from the cached data
        assert cached_geoms[0] == utils._CONTINENT_GEOMS
        assert cached_geoms[1] == utils._COUNTRY_GEOMS
        assert cached_geoms[2] == utils._MAPPING


class LocationLookupTests(UtilsTestCase):
    """Tests for reverse geocoding functionality."""

    def test_lookup_location_netherlands(self):
        """Test looking up a location in Netherlands."""
        result = lookup_location(52.5, 5.5)

        assert result["country"] == "Netherlands"
        assert result["continent"] == "Europe"

    def test_lookup_location_usa(self):
        """Test looking up a location in USA."""
        result = lookup_location(40, -100)

        assert result["country"] == "USA"
        assert result["continent"] == "North America"

    def test_lookup_location_not_found(self):
        """Test looking up a location not in any country."""
        result = lookup_location(0, 0)  # Middle of ocean

        assert result["country"] is None
        assert result["continent"] is None

    def test_lookup_location_boundary(self):
        """Test looking up a location on country boundary."""
        # Test point on Netherlands boundary
        result = lookup_location(51, 3)

        # Should find Netherlands (or potentially None due to boundary precision)
        assert result["country"] in ["Netherlands", None]


class WaterSourceFilterTests(UtilsTestCase):
    """Tests for water source filtering."""

    def test_filter_by_water_sources_single(self):
        """Test filtering by a single water source."""
        data = {"measurements[waterSources]": ["network"]}
        qs = Measurement.objects.all()

        result = filter_by_water_sources(qs, data)

        assert result.count() == 1
        assert result.first().water_source == "network"

    def test_filter_by_water_sources_multiple(self):
        """Test filtering by multiple water sources."""
        data = {"measurements[waterSources]": ["network", "well"]}
        qs = Measurement.objects.all()

        result = filter_by_water_sources(qs, data)

        assert result.count() == 2
        sources = {m.water_source for m in result}
        assert sources == {"network", "well"}

    def test_filter_by_water_sources_case_insensitive(self):
        """Test that water source filtering is case insensitive."""
        data = {"measurements[waterSources]": ["NETWORK", "Well"]}
        qs = Measurement.objects.all()

        result = filter_by_water_sources(qs, data)

        assert result.count() == 2

    def test_filter_by_water_sources_empty(self):
        """Test filtering with no water sources specified."""
        data = {}
        qs = Measurement.objects.all()

        result = filter_by_water_sources(qs, data)

        assert result.count() == qs.count()

    def test_filter_by_water_sources_invalid_format(self):
        """Test filtering with invalid water sources format."""
        data = {"measurements[waterSources]": "not_a_list"}
        qs = Measurement.objects.all()

        result = filter_by_water_sources(qs, data)

        # Should return all measurements when format is invalid
        assert result.count() == qs.count()

    def test_filter_by_water_sources_non_string_items(self):
        """Test filtering with non-string items in water sources list."""
        data = {"measurements[waterSources]": ["network", 123, None, "well"]}
        qs = Measurement.objects.all()

        result = filter_by_water_sources(qs, data)

        # Should only process string items
        assert result.count() == 2


class TemperatureFilterTests(UtilsTestCase):
    """Tests for temperature filtering."""

    def test_filter_by_temperature_range(self):
        """Test filtering by temperature range."""
        data = {"measurements[temperature][from]": "20.0", "measurements[temperature][to]": "40.0"}
        qs = Measurement.objects.all()

        result = filter_measurement_by_temperature(qs, data)

        # Should include measurements with temperatures 25.0 and 35.8
        assert result.count() == 2
        temps = [float(m.temperature.value) for m in result]
        assert 25.0 in temps
        assert 35.8 in temps

    def test_filter_by_temperature_min_only(self):
        """Test filtering by minimum temperature only."""
        data = {"measurements[temperature][from]": "30.0"}
        qs = Measurement.objects.all()

        result = filter_measurement_by_temperature(qs, data)

        # Should include measurements with temperatures >= 30.0
        assert result.count() == 2
        temps = [float(m.temperature.value) for m in result]
        for temp in temps:
            assert temp >= 30.0

    def test_filter_by_temperature_max_only(self):
        """Test filtering by maximum temperature only."""
        data = {"measurements[temperature][to]": "30.0"}
        qs = Measurement.objects.all()

        result = filter_measurement_by_temperature(qs, data)

        # Should include measurements with temperatures <= 30.0
        assert result.count() == 2
        temps = [float(m.temperature.value) for m in result]
        for temp in temps:
            assert temp <= 30.0

    def test_filter_by_temperature_invalid_values(self):
        """Test filtering with invalid temperature values."""
        data = {"measurements[temperature][from]": "not_a_number", "measurements[temperature][to]": "also_not_a_number"}
        qs = Measurement.objects.all()

        result = filter_measurement_by_temperature(qs, data)

        # Should return all measurements when values are invalid
        assert result.count() == qs.count()

    def test_filter_by_temperature_empty(self):
        """Test filtering with no temperature specified."""
        data = {}
        qs = Measurement.objects.all()

        result = filter_measurement_by_temperature(qs, data)

        assert result.count() == qs.count()


class DateRangeFilterTests(UtilsTestCase):
    """Tests for date range filtering."""

    def test_filter_by_date_range(self):
        """Test filtering by date range."""
        data = {"dateRange[from]": "2024-01-18", "dateRange[to]": "2024-02-05"}
        qs = Measurement.objects.all()

        result = filter_by_date_range(qs, data)

        # Should include measurements from Jan 20 and Feb 1
        assert result.count() == 2
        dates = [m.local_date for m in result]
        assert date(2024, 1, 20) in dates
        assert date(2024, 2, 1) in dates

    def test_filter_by_date_from_only(self):
        """Test filtering by start date only."""
        data = {"dateRange[from]": "2024-01-25"}
        qs = Measurement.objects.all()

        result = filter_by_date_range(qs, data)

        # Should include measurements from Feb 1 and Feb 10
        assert result.count() == 2

    def test_filter_by_date_to_only(self):
        """Test filtering by end date only."""
        data = {"dateRange[to]": "2024-01-25"}
        qs = Measurement.objects.all()

        result = filter_by_date_range(qs, data)

        # Should include measurements from Jan 15 and Jan 20
        assert result.count() == 2

    def test_filter_by_date_invalid_format(self):
        """Test filtering with invalid date format."""
        data = {
            "dateRange[from]": 12345,  # Not a string
            "dateRange[to]": ["not", "a", "string"],  # Not a string
        }
        qs = Measurement.objects.all()

        result = filter_by_date_range(qs, data)

        # Should return all measurements when format is invalid
        assert result.count() == qs.count()


class TimeSlotFilterTests(UtilsTestCase):
    """Tests for time slot filtering."""

    def test_filter_by_time_slots_single(self):
        """Test filtering by a single time slot."""
        data = {"times": json.dumps([{"from": "09:00:00", "to": "10:00:00"}])}
        qs = Measurement.objects.all()

        result = filter_by_time_slots(qs, data)

        # Should include measurement at 09:30
        assert result.count() == 1
        assert result.first().local_time == time(9, 30)

    def test_filter_by_time_slots_multiple(self):
        """Test filtering by multiple time slots."""
        data = {"times": json.dumps([{"from": "09:00:00", "to": "10:00:00"}, {"from": "14:00:00", "to": "15:00:00"}])}
        qs = Measurement.objects.all()

        result = filter_by_time_slots(qs, data)

        # Should include measurements at 09:30 and 14:45
        assert result.count() == 2
        times = [m.local_time for m in result]
        assert time(9, 30) in times
        assert time(14, 45) in times

    def test_filter_by_time_slots_list_format(self):
        """Test filtering with time slots as list instead of JSON string."""
        data = {"times": [{"from": "22:00:00", "to": "23:00:00"}]}
        qs = Measurement.objects.all()

        result = filter_by_time_slots(qs, data)

        # Should include measurement at 22:15
        assert result.count() == 1
        assert result.first().local_time == time(22, 15)

    def test_filter_by_time_slots_default_values(self):
        """Test filtering with missing from/to values (should use defaults)."""
        data = {
            "times": json.dumps(
                [
                    {"to": "10:00:00"},  # Missing 'from'
                    {"from": "22:00:00"},  # Missing 'to'
                ]
            )
        }
        qs = Measurement.objects.all()

        result = filter_by_time_slots(qs, data)

        # Should include measurements: one before 10:00 and one after 22:00
        assert result.count() > 0

    def test_filter_by_time_slots_invalid_json(self):
        """Test filtering with invalid JSON."""
        data = {"times": "invalid json"}
        qs = Measurement.objects.all()

        result = filter_by_time_slots(qs, data)

        # Should return all measurements when JSON is invalid
        assert result.count() == qs.count()

    def test_filter_by_time_slots_invalid_time_format(self):
        """Test filtering with invalid time format."""
        data = {"times": json.dumps([{"from": "invalid_time", "to": "also_invalid"}])}
        qs = Measurement.objects.all()

        result = filter_by_time_slots(qs, data)

        # Should return all measurements (no valid time conditions)
        assert result.count() == qs.count()

    def test_filter_by_time_slots_empty(self):
        """Test filtering with no time slots."""
        data = {}
        qs = Measurement.objects.all()

        result = filter_by_time_slots(qs, data)

        assert result.count() == qs.count()


class LocationOptimizationTests(UtilsTestCase):
    """Tests for location filtering optimization logic."""

    def setUp(self):
        super().setUp()
        initialize_location_geometries()

    def test_analyze_continent_selection_efficiency_full_continent(self):
        """Test optimization when all countries in continent are selected."""
        all_countries = {"Netherlands", "Germany", "France"}
        selected_countries = {"Netherlands", "Germany", "France"}

        result = analyze_continent_selection_efficiency("Europe", selected_countries, all_countries)

        assert result["type"] == "full_continent"
        assert result["continent"] == "Europe"

    def test_analyze_continent_selection_efficiency_include_strategy(self):
        """Test optimization when few countries are selected (inclusion strategy)."""
        all_countries = {"Netherlands", "Germany", "France"}
        selected_countries = {"Netherlands"}  # 1 out of 3

        result = analyze_continent_selection_efficiency("Europe", selected_countries, all_countries)

        assert result["type"] == "include_countries"
        assert result["countries_to_include"] == ["Netherlands"]

    def test_optimize_location_filtering_no_countries_specified(self):
        """Test optimization when no countries are specified (all countries from continents)."""
        result = optimize_location_filtering(["Europe"], [])

        # Should select full continents
        assert "Europe" in result["continent_filters"]
        assert len(result["country_include_filters"]) == 0

    def test_optimize_location_filtering_mixed_strategy(self):
        """Test optimization with mixed strategies across continents."""
        # Select all countries from Europe and one from North America
        selected_continents = ["Europe", "North America"]
        selected_countries = ["Netherlands", "Germany", "France", "USA"]

        result = optimize_location_filtering(selected_continents, selected_countries)

        # Europe should use full continent, North America should use inclusion
        assert "Europe" in result["continent_filters"]
        assert "USA" in result["country_include_filters"]

    def test_optimize_location_filtering_empty_input(self):
        """Test optimization with empty input."""
        result = optimize_location_filtering([], [])

        assert len(result["continent_filters"]) == 0
        assert len(result["country_include_filters"]) == 0


class LocationFilterApplicationTests(UtilsTestCase):
    """Tests for applying optimized location filters."""

    def setUp(self):
        super().setUp()
        initialize_location_geometries()

    def test_apply_optimized_location_filter_continents_only(self):
        """Test applying filter with continents only."""
        data = {"location[continents]": ["Europe"]}
        qs = Measurement.objects.all()

        result = apply_optimized_location_filter(qs, data)

        # Should include measurements from Netherlands and Germany
        assert result.count() == 2
        countries = [lookup_location(m.location.y, m.location.x)["country"] for m in result]
        assert "Netherlands" in countries
        assert "Germany" in countries

    def test_apply_optimized_location_filter_countries_only(self):
        """Test applying filter with countries only."""
        data = {"location[countries]": ["Netherlands", "USA"]}
        qs = Measurement.objects.all()

        result = apply_optimized_location_filter(qs, data)

        # Should include all measurement since invalid filtering
        assert result.count() == qs.count()

    def test_apply_optimized_location_filter_mixed(self):
        """Test applying filter with both continents and countries."""
        data = {"location[continents]": ["Europe"], "location[countries]": ["Netherlands", "Germany"]}
        qs = Measurement.objects.all()

        result = apply_optimized_location_filter(qs, data)

        # Should include measurements from Netherlands and Germany only
        assert result.count() == 2

    def test_apply_optimized_location_filter_invalid_input(self):
        """Test applying filter with invalid input formats."""
        data = {"location[continents]": "not_a_list", "location[countries]": 12345}
        qs = Measurement.objects.all()

        result = apply_optimized_location_filter(qs, data)

        # Should return all measurements when input is invalid
        assert result.count() == qs.count()

    def test_apply_optimized_location_filter_no_location(self):
        """Test applying filter with no location specified."""
        data = {}
        qs = Measurement.objects.all()

        result = apply_optimized_location_filter(qs, data)

        assert result.count() == qs.count()


class IntegratedFilterTests(UtilsTestCase):
    """Tests for the main apply_measurement_filters function."""

    def setUp(self):
        super().setUp()
        initialize_location_geometries()

    def test_apply_measurement_filters_comprehensive(self):
        """Test applying all filters together."""
        data = {
            "measurements[waterSources]": ["network", "well"],
            "measurements[temperature][from]": "10.0",
            "measurements[temperature][to]": "30.0",
            "dateRange[from]": "2024-01-01",
            "dateRange[to]": "2024-01-31",
            "times": json.dumps([{"from": "09:00:00", "to": "10:00:00"}]),
            "location[continents]": ["Europe"],
        }
        qs = Measurement.objects.all()

        result = apply_measurement_filters(data, qs)

        # Should find only the Netherlands measurement (network source,
        # temp 12.5, date Jan 15, time 09:30, location Europe)
        assert result.count() == 1
        measurement = result.first()
        assert measurement.water_source == "network"
        assert float(measurement.temperature.value) == 12.5

    def test_apply_measurement_filters_no_matches(self):
        """Test applying filters that result in no matches."""
        data = {
            "measurements[temperature][from]": "100.0",  # No measurements this hot
            "location[continents]": ["Europe"],
        }
        qs = Measurement.objects.all()

        result = apply_measurement_filters(data, qs)

        assert result.count() == 0

    def test_apply_measurement_filters_empty(self):
        """Test applying no filters."""
        data = {}
        qs = Measurement.objects.all()

        result = apply_measurement_filters(data, qs)

        assert result.count() == qs.count()


class QueryBuildingTests(UtilsTestCase):
    """Tests for query building helper functions."""

    def setUp(self):
        super().setUp()
        initialize_location_geometries()

    def test_build_inclusion_query(self):
        """Test building inclusion query."""
        strategy = {"continent_filters": ["Europe"], "country_include_filters": ["USA"]}

        query = _build_inclusion_query(strategy)

        # Should have conditions for both continent and country
        assert query is not None

    def test_build_empty_queries(self):
        """Test building queries with empty strategies."""
        empty_strategy = {"continent_filters": [], "country_include_filters": []}

        inclusion_query = _build_inclusion_query(empty_strategy)

        # Empty queries should still be valid Q objects
        from django.db.models import Q

        assert inclusion_query == Q()


class WaterSourceEdgeCaseTests(UtilsTestCase):
    """Additional edge case tests for water source filtering."""

    def test_filter_by_water_sources_empty_list(self):
        """Test filtering with empty water sources list."""
        data = {"measurements[waterSources]": []}
        qs = Measurement.objects.all()

        result = filter_by_water_sources(qs, data)

        # Empty list should return all measurements
        assert result.count() == qs.count()

    def test_filter_by_water_sources_none_values(self):
        """Test filtering with None values in water sources list."""
        data = {"measurements[waterSources]": ["network", None, "well", ""]}
        qs = Measurement.objects.all()

        result = filter_by_water_sources(qs, data)

        # Should filter out None and empty string, only process valid strings
        assert result.count() == 2


class TemperatureEdgeCaseTests(UtilsTestCase):
    """Additional edge case tests for temperature filtering."""

    def test_filter_by_temperature_zero_values(self):
        """Test filtering with zero temperature values."""
        data = {"measurements[temperature][from]": "0.0", "measurements[temperature][to]": "0.0"}
        qs = Measurement.objects.all()

        result = filter_measurement_by_temperature(qs, data)

        # No measurements should match exactly 0.0
        assert result.count() == 0

    def test_filter_by_temperature_negative_values(self):
        """Test filtering with negative temperature values."""
        data = {"measurements[temperature][from]": "-10.0", "measurements[temperature][to]": "50.0"}
        qs = Measurement.objects.all()

        result = filter_measurement_by_temperature(qs, data)

        # All measurements should be included (all are positive)
        assert result.count() == qs.count()

    def test_filter_by_temperature_empty_strings(self):
        """Test filtering with empty string temperature values."""
        data = {"measurements[temperature][from]": "", "measurements[temperature][to]": ""}
        qs = Measurement.objects.all()

        result = filter_measurement_by_temperature(qs, data)

        # Empty strings should be ignored, return all measurements
        assert result.count() == qs.count()


class DateRangeEdgeCaseTests(UtilsTestCase):
    """Additional edge case tests for date range filtering."""

    def test_filter_by_date_exact_match(self):
        """Test filtering with exact date matches."""
        data = {"dateRange[from]": "2024-01-15", "dateRange[to]": "2024-01-15"}
        qs = Measurement.objects.all()

        result = filter_by_date_range(qs, data)

        # Should match exactly one measurement
        assert result.count() == 1
        assert result.first().local_date == date(2024, 1, 15)

    def test_filter_by_date_invalid_date_string(self):
        """Test filtering with invalid date strings."""
        data = {"dateRange[from]": "invalid-date", "dateRange[to]": "2024-13-40"}
        qs = Measurement.objects.all()

        # This should not raise an exception, Django will handle invalid dates
        result = filter_by_date_range(qs, data)

        # Since Django handles the filtering, invalid dates will likely return no results
        # or cause a database error, but the function should not crash
        assert isinstance(result, type(qs))  # Should return a QuerySet


class TimeSlotEdgeCaseTests(UtilsTestCase):
    """Additional edge case tests for time slot filtering."""

    def test_filter_by_time_slots_overlapping_ranges(self):
        """Test filtering with overlapping time ranges."""
        data = {"times": json.dumps([{"from": "09:00:00", "to": "15:00:00"}, {"from": "14:00:00", "to": "23:00:00"}])}
        qs = Measurement.objects.all()

        result = filter_by_time_slots(qs, data)

        # Should include measurements at 09:30, 14:45, and 22:15
        assert result.count() == 3

    def test_filter_by_time_slots_midnight_crossing(self):
        """Test filtering with time ranges that cross midnight."""
        data = {
            "times": json.dumps(
                [
                    {"from": "23:00:00", "to": "01:00:00"}  # This won't work as expected
                ]
            )
        }
        qs = Measurement.objects.all()

        result = filter_by_time_slots(qs, data)

        # Current implementation doesn't handle midnight crossing properly
        # It will treat this as an invalid range (23:00 to 01:00 same day)
        assert result.count() == 0

    def test_filter_by_time_slots_microseconds(self):
        """Test filtering with microsecond precision."""
        data = {"times": json.dumps([{"from": "09:30:00.000000", "to": "09:30:00.999999"}])}
        qs = Measurement.objects.all()

        result = filter_by_time_slots(qs, data)

        # Should include the measurement at exactly 09:30:00
        assert result.count() == 1


class LocationOptimizationEdgeCaseTests(UtilsTestCase):
    """Additional edge case tests for location optimization."""

    def setUp(self):
        super().setUp()
        initialize_location_geometries()

    def test_analyze_continent_selection_efficiency_empty_selection(self):
        """Test optimization with no countries selected from continent."""
        all_countries = {"Netherlands", "Germany", "France"}
        selected_countries = set()

        result = analyze_continent_selection_efficiency("Europe", selected_countries, all_countries)

        # When no countries are selected, should use include strategy with empty list
        assert result["type"] == "include_countries"
        assert result["countries_to_include"] == []

    def test_optimize_location_filtering_unknown_continent(self):
        """Test optimization with unknown continent names."""
        result = optimize_location_filtering(["UnknownContinent"], ["SomeCountry"])

        # Should return empty filters for unknown continent
        assert len(result["continent_filters"]) == 0
        assert len(result["country_include_filters"]) == 0

    def test_optimize_location_filtering_countries_not_in_selected_continents(self):
        """Test optimization when selected countries don't belong to selected continents."""
        # Select Europe but try to include Asian country
        result = optimize_location_filtering(["Europe"], ["Japan"])

        # Japan is not in Europe, so invalid selection
        assert len(result["continent_filters"]) == 0
        assert len(result["country_include_filters"]) == 0


class IntegratedFilterEdgeCaseTests(UtilsTestCase):
    """Additional edge case tests for integrated filtering."""

    def setUp(self):
        super().setUp()
        initialize_location_geometries()

    def test_apply_measurement_filters_contradictory_filters(self):
        """Test applying contradictory filters that should return no results."""
        data = {
            "measurements[temperature][from]": "50.0",  # Minimum 50°C
            "measurements[temperature][to]": "10.0",  # Maximum 10°C (impossible)
            "location[continents]": ["Europe"],
        }
        qs = Measurement.objects.all()

        result = apply_measurement_filters(data, qs)

        # Contradictory temperature range should return no results
        assert result.count() == 0

    def test_apply_measurement_filters_extreme_precision(self):
        """Test filtering with very precise temperature values."""
        data = {
            "measurements[temperature][from]": "12.49999",
            "measurements[temperature][to]": "12.50001",
            "location[continents]": ["Europe"],
        }
        qs = Measurement.objects.all()

        result = apply_measurement_filters(data, qs)

        # Should include the Netherlands measurement with temp 12.5
        assert result.count() == 1
        assert float(result.first().temperature.value) == 12.5


class QueryBuildingEdgeCaseTests(UtilsTestCase):
    """Additional edge case tests for query building."""

    def setUp(self):
        super().setUp()
        initialize_location_geometries()

    def test_build_inclusion_query_with_invalid_geometries(self):
        """Test building inclusion query with invalid/missing geometries."""
        strategy = {
            "continent_filters": ["NonexistentContinent"],
            "country_include_filters": ["NonexistentCountry"],
        }

        query = _build_inclusion_query(strategy)

        # Should return empty Q object when no valid geometries found
        from django.db.models import Q

        assert query == Q()

    def test_apply_optimized_location_filter_malformed_data(self):
        """Test location filtering with completely malformed data."""
        data = {"location[continents]": {"not": "a list"}, "location[countries]": 42}
        qs = Measurement.objects.all()

        result = apply_optimized_location_filter(qs, data)

        # Should return all measurements when data is malformed
        assert result.count() == qs.count()
