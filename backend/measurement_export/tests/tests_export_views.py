import json
from datetime import date, time, timedelta

from campaigns.models import Campaign
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib.gis.geos import Point, Polygon
from django.core.cache import cache
from django.db import connection
from django.test import TestCase, TransactionTestCase
from django.utils import timezone
from measurements.models import Measurement, Temperature
from rest_framework.test import APIClient

from measurement_export.views import (
    apply_location_annotations,
    build_base_queryset,
    fetch_campaigns_for_measurements,
    fetch_metrics_for_measurements,
    prepare_measurement_data,
)


class EndpointTests(TestCase):
    """Test location_list, get_all, and basic /search/ behavior."""

    @classmethod
    def setUpTestData(cls):
        with connection.cursor() as c:
            c.execute("""
                CREATE TABLE IF NOT EXISTS locations (
                  id SERIAL PRIMARY KEY,
                  country_name VARCHAR(100),
                  continent VARCHAR(100),
                  geom geometry(Polygon,4326)
                );
            """)
            c.execute("DELETE FROM locations;")
            c.execute("""
                INSERT INTO locations (country_name, continent, geom)
                VALUES ('Aland','Europe',
                  ST_GeomFromText('POLYGON((0 0,10 0,10 10,0 10,0 0))',4326)
                );
            """)

        user = get_user_model().objects.create_user("u", "u@x", "p")
        cls.inside = Measurement.objects.create(
            location=Point(5, 5),
            local_date=date(2024, 1, 1),
            local_time=time(1, 1),
            flag=False,
            water_source="well",
            user=user,
        )
        cls.outside = Measurement.objects.create(
            location=Point(20, 20),
            local_date=date(2024, 1, 2),
            local_time=time(2, 2),
            flag=True,
            water_source="network",
            user=user,
        )
        Temperature.objects.create(measurement=cls.inside, value=11.1, time_waited=timedelta())
        Temperature.objects.create(measurement=cls.outside, value=22.2, time_waited=timedelta())

    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def test_location_list(self):
        r = self.client.get("/api/locations/")
        assert r.status_code == 200
        assert r.json() == {"Europe": ["Aland"]}

        with connection.cursor() as c:
            c.execute("DELETE FROM locations;")
        r2 = self.client.get("/api/locations/")
        assert r2.json() == {}

    def test_get_all_measurements(self):
        r = self.client.get("/api/measurements/")
        assert r.status_code == 200
        arr = r.json()
        assert {m["id"] for m in arr} == {self.inside.id}
        for field in (
            "id",
            "timestamp",
            "local_date",
            "local_time",
            "flag",
            "water_source",
            "user_id",
            "country",
            "continent",
            "latitude",
            "longitude",
            "metrics",
            "campaigns",
        ):
            assert field in arr[0]

    def test_search_invalid_json(self):
        r = self.client.post("/api/measurements/search/", "nope", content_type="application/json")
        assert r.status_code == 400

    def test_search_empty(self):
        r = self.client.post("/api/measurements/search/", "", content_type="application/json")
        assert r.status_code == 200
        assert "count" in r.json()
        assert "avgTemp" in r.json()

    def test_search_location_filter(self):
        poly = Polygon.from_bbox((0, 0, 10, 10)).wkt
        r = self.client.post(
            "/api/measurements/search/", json.dumps({"boundary_geometry": poly}), content_type="application/json"
        )
        assert r.status_code == 200
        assert r.json()["count"] == 1


class HelperFunctionTests(TestCase):
    """Test build_base_queryset, annotations, fetchers, and preparer."""

    @classmethod
    def setUpTestData(cls):
        user = get_user_model().objects.create_user("x", "x@x", "p")
        cls.m1 = Measurement.objects.create(
            location=Point(0, 0),
            local_date=date(2024, 1, 1),
            local_time=time(0, 0),
            flag=False,
            water_source="a",
            user=user,
        )
        cls.m2 = Measurement.objects.create(
            location=Point(1, 1),
            local_date=date(2024, 2, 2),
            local_time=time(2, 2),
            flag=True,
            water_source="b",
            user=user,
        )
        Temperature.objects.create(measurement=cls.m1, value=1.1, time_waited=timedelta())
        Temperature.objects.create(measurement=cls.m2, value=2.2, time_waited=timedelta())

        # Use WKT string for region (MULTIPOLYGON)
        cls.c1 = Campaign.objects.create(
            name="C1",
            description="",
            start_time=timezone.now(),
            end_time=timezone.now(),
            region="MULTIPOLYGON(((0 0,1 0,1 1,0 1,0 0)))",
        )
        cls.c2 = Campaign.objects.create(
            name="C2",
            description="",
            start_time=timezone.now(),
            end_time=timezone.now(),
            region="MULTIPOLYGON(((0 0,1 0,1 1,0 1,0 0)))",
        )
        cls.m1.campaigns.add(cls.c1)
        cls.m2.campaigns.add(cls.c1, cls.c2)

        # also ensure locations table for annotation tests
        with connection.cursor() as c:
            c.execute("""
                CREATE TABLE IF NOT EXISTS locations (
                  id SERIAL PRIMARY KEY,
                  country_name VARCHAR(100),
                  continent VARCHAR(100),
                  geom geometry(Polygon,4326)
                );
            """)
            c.execute("DELETE FROM locations;")
            c.execute("""
                INSERT INTO locations (country_name, continent, geom)
                VALUES ('Zed','Nowhere',
                  ST_GeomFromText('POLYGON((-1 -1,2 -1,2 2,-1 2,-1 -1))',4326)
                );
            """)

    def test_build_base_queryset(self):
        qs1 = build_base_queryset(ordered=False)
        assert not qs1.query.order_by
        qs2 = build_base_queryset(ordered=True)
        # Django stores order_by as a tuple
        assert qs2.query.order_by == ("id",)

    def test_apply_location_annotations(self):
        annotated = apply_location_annotations(Measurement.objects.all())
        # pick one
        m = annotated.first()
        for fld in ("country", "continent", "latitude", "longitude"):
            assert hasattr(m, fld)

    def test_fetch_metrics(self):
        ids = [self.m1.id, self.m2.id]
        allm = fetch_metrics_for_measurements(ids)
        assert set(allm.keys()) == set(ids)
        # filtered out
        empty = fetch_metrics_for_measurements(ids, included_metrics=[])
        assert empty == {}

    def test_fetch_campaigns(self):
        camps = fetch_campaigns_for_measurements([self.m1.id, self.m2.id])
        assert camps[self.m1.id] == ["C1"]
        assert set(camps[self.m2.id]) == {"C1", "C2"}

    def test_prepare_measurement_data(self):
        qs = apply_location_annotations(build_base_queryset().filter(id__in=[self.m1.id, self.m2.id]))
        data = prepare_measurement_data(qs)
        assert len(data) == 2
        for rec in data:
            assert "metrics" in rec
            assert "campaigns" in rec


class ErrorHandlingTests(TransactionTestCase):
    """Ensure invalid filters don't 500 out /search/."""

    reset_sequences = True

    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def test_invalid_month_yields_200(self):
        r = self.client.post("/api/measurements/search/", json.dumps({"month": "abc"}), content_type="application/json")
        assert r.status_code == 200

    def test_invalid_boundary_yields_200(self):
        r = self.client.post(
            "/api/measurements/search/", json.dumps({"boundary_geometry": "XYZ"}), content_type="application/json"
        )
        assert r.status_code == 200


class SearchMeasurementsViewTest(TransactionTestCase):
    """Full integration tests for /search/ filters and export perms."""

    reset_sequences = True

    def setUp(self):
        cache.clear()
        self.client = APIClient()

        # Create users
        user = get_user_model()
        self.reg = user.objects.create_user("r", "r@x", "p")
        self.staff = user.objects.create_user("s", "s@x", "p", is_staff=True)
        self.sup = user.objects.create_superuser("S", "S@x", "p")
        self.res = user.objects.create_user("res", "res@x", "p")

        self.researcher_group = Group.objects.create(name="researcher")
        self.res.groups.add(self.researcher_group)

        # Setup locations table as needed (or better, use migrations/fixtures)
        with connection.cursor() as c:
            c.execute("""
                CREATE TABLE IF NOT EXISTS locations (
                  id SERIAL PRIMARY KEY,
                  country_name VARCHAR(100),
                  continent VARCHAR(100),
                  geom geometry(Polygon,4326)
                );
            """)
            c.execute("DELETE FROM locations;")
            c.execute("""
                INSERT INTO locations (country_name, continent, geom)
                VALUES ('T','C',
                  ST_GeomFromText('POLYGON((0 0,10 0,10 10,0 10,0 0))',4326)
                );
            """)

        now = timezone.now()
        self.jan = Measurement.objects.create(
            location=Point(1, 1),
            local_date=(now - timedelta(days=60)).date(),
            local_time=time(1, 1),
            timestamp=now - timedelta(days=60),
            flag=False,
            water_source="a",
            user=self.reg,
        )
        Temperature.objects.create(measurement=self.jan, value=10, time_waited=timedelta())

        self.feb = Measurement.objects.create(
            location=Point(2, 2),
            local_date=(now - timedelta(days=10)).date(),
            local_time=time(2, 2),
            timestamp=now - timedelta(days=10),
            flag=True,
            water_source="b",
            user=self.reg,
        )
        Temperature.objects.create(measurement=self.feb, value=20, time_waited=timedelta())

        self.mar = Measurement.objects.create(
            location=Point(5, 5),
            local_date=now.date(),
            local_time=time(3, 3),
            timestamp=now,
            flag=False,
            water_source="c",
            user=self.reg,
        )
        Temperature.objects.create(measurement=self.mar, value=30, time_waited=timedelta())

    def post(self, payload, user=None):
        if user:
            self.client.force_authenticate(user)
        return self.client.post("/api/measurements/search/", json.dumps(payload), content_type="application/json")

    def test_filters_and_stats(self):
        # Create a polygon that definitely includes the first two measurements
        # (1,1) and (2,2)
        small = Polygon.from_bbox((0, 0, 3, 3)).wkt
        response = self.post(
            {
                "boundary_geometry": small,
            },
            self.reg,
        )
        data = response.json()
        assert data["count"] == 2

    def test_export_permissions(self):
        def ex(fmt, user, ok):
            r = self.post({"format": fmt, "measurements_included": ["temperature"]}, user)
            assert r.status_code == (200 if ok else 403)

        ex("csv", self.reg, False)
        for u in (self.res, self.staff, self.sup):
            for fmt in ("csv", "json", "xml", "geojson"):
                ex(fmt, u, True)

    def test_sanitize_included(self):
        payload = {
            "format": "csv",
            "measurements_included": "oops",
        }
        self.client.force_authenticate(self.staff)
        r = self.client.post("/api/measurements/search/", json.dumps(payload), content_type="application/json")
        assert r.status_code == 200
