import re

from django.contrib.auth import get_user_model
from django.contrib.gis.geos import MultiPolygon, Point
from django.db import connection
from django.http import QueryDict
from django.test import Client, TestCase

from measurement_export.admin import PresetAdminForm
from measurement_export.models import Location, Preset
from measurement_export.serializers import PresetSerializer

User = get_user_model()


class PresetSerializerTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Create a public preset
        cls.public_preset = Preset.objects.create(
            name="Public Preset", description="A public preset", filters={"foo": "bar"}, is_public=True
        )
        # Create a private preset
        cls.private_preset = Preset.objects.create(
            name="Private Preset", description="A private preset", filters={"hidden": True}, is_public=False
        )

    def test_single_instance_serialization(self):
        """Serializer should output all declared fields correctly for one instance."""
        ser = PresetSerializer(instance=self.public_preset)
        data = ser.data

        # Check presence and correctness of each field
        assert "id" in data
        assert data["name"] == self.public_preset.name
        assert data["description"] == self.public_preset.description
        assert data["filters"] == self.public_preset.filters
        # created_at is read-only but still included
        assert "created_at" in data
        # is_public should round-trip
        assert data["is_public"] == self.public_preset.is_public

    def test_many_instances_serialization(self):
        """Serializer(many=True) should include only the instances passed in."""
        qs = Preset.objects.all()
        ser = PresetSerializer(qs, many=True)
        data = ser.data

        assert len(data) == 2
        names = {item["name"] for item in data}
        assert names == {"Public Preset", "Private Preset"}

    def test_read_only_fields_cannot_be_overwritten(self):
        """Attempting to set read-only fields via serializer data should ignore them."""
        incoming = {
            "name": "New Name",
            "description": "New Desc",
            "filters": {"x": 1},
            "created_at": "2000-01-01T00:00:00Z",  # read-only
        }
        ser = PresetSerializer(data=incoming)
        assert ser.is_valid(), ser.errors
        validated = ser.validated_data
        # created_at should not be in validated_data because it's read-only
        assert "created_at" not in validated
        # other fields should be present
        assert validated["name"] == "New Name"
        assert validated["filters"] == {"x": 1}


class PresetListViewTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Two public, one private
        cls.p1 = Preset.objects.create(
            name="Alpha",
            description="First",
            filters={"a": 1},
            is_public=True,
        )
        cls.p2 = Preset.objects.create(
            name="Beta",
            description="Second",
            filters={"b": 2},
            is_public=True,
        )
        cls.p3 = Preset.objects.create(
            name="Gamma",
            description="Third (private)",
            filters={"c": 3},
            is_public=False,
        )
        cls.client = Client()

    def test_get_presets_endpoint_status_and_content_type(self):
        response = self.client.get("/api/presets/")
        assert response.status_code == 200
        assert response["Content-Type"] == "application/json"

    def test_only_public_presets_returned(self):
        response = self.client.get("/api/presets/")
        data = response.json()
        assert "presets" in data
        presets = data["presets"]

        # Should only contain the two public presets
        returned_names = {p["name"] for p in presets}
        assert returned_names == {"Alpha", "Beta"}
        assert "Gamma" not in returned_names

    def test_response_fields_and_values(self):
        """Ensure each preset object in response has all expected keys and correct formats."""
        response = self.client.get("/api/presets/")
        presets = response.json()["presets"]

        for obj in presets:
            # Keys
            for key in ("id", "name", "description", "filters", "created_at", "is_public"):
                assert key in obj

            # Types
            assert isinstance(obj["id"], int)
            assert isinstance(obj["name"], str)
            assert isinstance(obj["description"], str)
            assert isinstance(obj["filters"], dict)
            assert isinstance(obj["is_public"], bool)
            # created_at should be an ISO-formatted string
            assert re.search(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}", obj["created_at"])


class PresetAdminFormTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        # ensure locations table exists
        with connection.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS locations (
                    id SERIAL PRIMARY KEY,
                    country_name VARCHAR(44),
                    continent VARCHAR(23),
                    geom geometry
                );
            """)
        # Create location entries
        Location.objects.create(
            continent="Europe", country_name="Netherlands", geom=MultiPolygon(Point(5.00, 52.00).buffer(0.1))
        )
        Location.objects.create(
            continent="Asia", country_name="China", geom=MultiPolygon(Point(104.00, 35.00).buffer(0.1))
        )
        cls.user = User.objects.create_user(username="tester", password="pass")

    def test_init_populates_choices_and_initials_from_instance(self):
        preset = Preset(
            name="Test",
            filters={
                "location": {"continents": ["Europe"], "countries": ["Netherlands"]},
                "measurements": {"waterSources": ["Well"], "temperature": {"from": 5, "to": 15, "unit": "F"}},
                "dateRange": {"from": "2025-01-01", "to": "2025-12-31"},
                "times": [{"from": "08:00", "to": "10:00"}, {"from": "14:00", "to": "15:00"}],
            },
        )
        form = PresetAdminForm(instance=preset)

        continents = [c[0] for c in form.fields["location_continents"].choices]
        assert set(continents) == {"Asia", "Europe"}
        assert form.fields["location_continents"].initial == ["Europe"]

        countries = [c[0] for c in form.fields["location_countries"].choices]
        assert countries == ["Netherlands"]
        assert form.fields["location_countries"].initial == ["Netherlands"]

        assert form.fields["water_sources"].initial == ["Well"]
        assert form.fields["temperature_enabled"].initial
        assert form.fields["temp_from"].initial == 5
        assert form.fields["temp_to"].initial == 15
        assert form.fields["temp_unit"].initial == "F"

        # Expect string initials for dates
        assert form.fields["date_from"].initial == "2025-01-01"
        assert form.fields["date_to"].initial == "2025-12-31"

        assert form.fields["times"].initial == "08:00-10:00;14:00-15:00"

    def test_validate_time_slots_errors(self):
        # >3 slots
        raw = ";".join(f"{i:02d}:00-{i:02d}:30" for i in range(5))
        data = QueryDict("", mutable=True)
        data.setlist("times", [raw])
        form = PresetAdminForm(data=data)
        form.is_valid()
        assert "times" in form.errors
        assert "up to 3 time slots" in form.errors["times"][0]

        # overlapping
        raw2 = "08:00-10:00;09:30-11:00"
        data2 = QueryDict("", mutable=True)
        data2.setlist("times", [raw2])
        form2 = PresetAdminForm(data=data2)
        form2.is_valid()
        assert "times" in form2.errors
        assert "must not overlap" in form2.errors["times"][0]

        # invalid format
        raw3 = "bad-format"
        data3 = QueryDict("", mutable=True)
        data3.setlist("times", [raw3])
        form3 = PresetAdminForm(data=data3)
        form3.is_valid()
        cleaned = form3.clean()
        assert cleaned["filters"]["times"] == []

    def test_clean_date_and_temperature_validation(self):
        # temp_from > temp_to
        data = QueryDict("", mutable=True)
        # required model-form fields
        data.setlist("name", ["X"])
        data.setlist("description", ["Y"])
        data.setlist("created_by", [str(self.user.pk)])
        data.setlist("is_public", ["on"])
        data.setlist("temperature_enabled", ["on"])
        data.setlist("temp_from", ["30"])
        data.setlist("temp_to", ["10"])
        form = PresetAdminForm(data=data)
        assert not form.is_valid()
        assert "temp_to" in form.errors
        assert "≥ minimum temperature" in form.errors["temp_to"][0]

        # date_from > date_to
        data2 = QueryDict("", mutable=True)
        data2.setlist("name", ["X"])
        data2.setlist("description", ["Y"])
        data2.setlist("created_by", [str(self.user.pk)])
        data2.setlist("is_public", ["on"])
        data2.setlist("date_from", ["2025-12-31"])
        data2.setlist("date_to", ["2025-01-01"])
        form2 = PresetAdminForm(data=data2)
        assert not form2.is_valid()
        assert "date_to" in form2.errors
        assert "on or after start date" in form2.errors["date_to"][0]

    def test_save_builds_filters_and_saves_instance(self):
        raw = {
            "name": ["AdminTest"],
            "description": ["Desc"],
            "created_by": [str(self.user.pk)],
            "is_public": ["on"],
            "location_continents": ["Europe"],
            "location_countries": ["Netherlands"],
            "water_sources": ["Well", "Other"],
            "temperature_enabled": ["on"],
            "temp_from": ["0"],
            "temp_to": ["100"],
            "temp_unit": ["C"],
            "date_from": ["2025-05-01"],
            "date_to": ["2025-05-31"],
            "times": ["06:00-07:00;18:00-19:00"],
        }
        data = QueryDict("", mutable=True)
        for k, v in raw.items():
            data.setlist(k, v)

        form = PresetAdminForm(data=data)
        assert form.is_valid(), form.errors
        preset = form.save(commit=True)

        p = Preset.objects.get(pk=preset.pk)
        expected = {
            "location": {"continents": ["Europe"], "countries": ["Netherlands"]},
            "measurements": {"waterSources": ["Well", "Other"], "temperature": {"from": 0.0, "to": 100.0, "unit": "C"}},
            "dateRange": {"from": "2025-05-01", "to": "2025-05-31"},
            "times": [{"from": "06:00", "to": "07:00"}, {"from": "18:00", "to": "19:00"}],
        }
        # ensure filters contain expected subsets
        for key, val in expected.items():
            assert p.filters.get(key) == val
        assert p.name == "AdminTest"
        assert p.created_by == self.user
        assert p.is_public

    def test_save_builds_filters_and_saves_instance_fields_missing(self):
        raw = {
            "name": ["AdminTest"],
            "description": [],
            "created_by": [],
            "is_public": ["on"],
            "location_continents": [],
            "location_countries": [],
            "water_sources": [],
            "temperature_enabled": ["on"],
            "temp_from": [],
            "temp_to": ["100"],
            "temp_unit": ["C"],
            "date_from": [],
            "date_to": ["2025-05-31"],
            "times": ["-08:00;10:00-12:00;13:00-"],
        }
        data = QueryDict("", mutable=True)
        for k, v in raw.items():
            data.setlist(k, v)

        form = PresetAdminForm(data=data)
        # Provide more detailed error if form is invalid
        assert form.is_valid(), f"Form is not valid. Errors: {form.errors.as_json()}"
        preset = form.save(commit=True)

        p = Preset.objects.get(pk=preset.pk)

        # Expected filters dictionary based on admin.py logic
        # Note: "dateRange" key will be absent from p.filters due to "if df and dt:"
        # and "date_from" being None.
        expected_filters = {
            "location": {
                "continents": [],
                "countries": [],
            },
            "measurements": {
                "waterSources": [],
                "temperature": {
                    "from": None,
                    "to": 100.0,
                    "unit": "C",
                },
            },
            # to should be present even if from is None
            "dateRange": {
                "from": None,
                "to": "2025-05-31",
            },
            "times": [
                {"from": None, "to": "08:00"},
                {"from": "10:00", "to": "12:00"},
                {"from": "13:00", "to": None},
            ],
        }

        # Assert the entire filters dictionary for exactness
        assert p.filters == expected_filters, f"p.filters mismatch.\nGot: {p.filters}\nExpected: {expected_filters}"

        # Check other model fields
        assert p.name == "AdminTest"
        assert p.description == ""
        assert p.is_public
