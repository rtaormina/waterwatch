"""Add Measurement Export to Admin view."""

# Register your models here.
# admin.py
import itertools
from datetime import time

from django import forms
from django.conf import settings
from django.contrib import admin

from .models import Location, Preset


class PresetAdminForm(forms.ModelForm):
    """Form for Preset model in the admin interface.

    This form provides a user interface for configuring export presets with advanced filtering options.

    Attributes
    ----------
    location_continents : forms.MultipleChoiceField
        Multi-select for continents.
    location_countries : forms.MultipleChoiceField
        Multi-select for countries, filtered by selected continents.
    water_sources : forms.MultipleChoiceField
        Multi-select for water source types.
    temperature_enabled : forms.BooleanField
        Boolean to enable/disable temperature filtering.
    temp_from : forms.DecimalField
        Minimum temperature value.
    temp_to : forms.DecimalField
        Maximum temperature value.
    temp_unit : forms.ChoiceField
        Temperature unit (°C or °F).
    date_from : forms.DateField
        Start date for date range.
    date_to : forms.DateField
        End date for date range.
    times : forms.CharField
        Up to three time slot ranges, in "HH:MM-HH:MM" format.

    Methods
    -------
    __init__(*args, **kwargs)
        Dynamically populates choices and initial values based on instance data and POST input.
    clean()
        Validates and parses all filters, assembling a JSON-serializable `filters` dict.
    save(commit=True)
        Stores the assembled filters on the Preset instance.
    """

    # — Location multi-selects
    location_continents = forms.MultipleChoiceField(
        label="Continents",
        required=False,
        widget=forms.CheckboxSelectMultiple,
        help_text="Select one or more continents. Leave empty to include all.",
    )
    location_countries = forms.MultipleChoiceField(
        label="Countries",
        required=False,
        widget=forms.CheckboxSelectMultiple,
        help_text="Select one or more countries. Leave empty to include all.",
    )

    # — Measurement filters
    water_sources = forms.MultipleChoiceField(
        label="Water sources",
        required=False,
        widget=forms.CheckboxSelectMultiple,
        help_text="Select one or more water sources. Leave empty to include all.",
    )
    temperature_enabled = forms.BooleanField(
        label="Enable temperature filter",
        required=False,
    )
    temp_from = forms.DecimalField(label="Minimum temperature", required=False)
    temp_to = forms.DecimalField(label="Maximum temperature", required=False)
    temp_unit = forms.ChoiceField(
        label="Unit",
        choices=(("C", "°C"), ("F", "°F")),
        required=False,
    )

    # — Date range
    date_from = forms.DateField(
        label="Date from",
        required=False,
        widget=forms.DateInput(attrs={"type": "date"}),
    )
    date_to = forms.DateField(
        label="Date to",
        required=False,
        widget=forms.DateInput(attrs={"type": "date"}),
    )

    # — Time slots (up to 3)
    times = forms.CharField(
        label="Time slots",
        required=False,
        widget=forms.Textarea(attrs={"rows": 2}),
        help_text="Format: HH:MM-HH:MM;HH:MM-HH:MM (up to 3 slots)",
    )

    class Meta:
        """Meta class for PresetAdminForm.

        Attributes
        ----------
        model : Preset
            The model this form is associated with.
        fields : tuple
            Fields to include in the form.
        """

        model = Preset
        fields = ("name", "description", "created_by", "is_public")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        data = getattr(self.instance, "filters", {}) or {}

        # ---- Continents
        continents = list(Location.objects.values_list("continent", flat=True).distinct().order_by("continent"))
        self.fields["location_continents"].choices = [(c, c) for c in continents]
        self.fields["location_continents"].initial = data.get("location", {}).get("continents", [])

        # ---- Countries (rebuild choices from POST or from existing instance)
        if self.data.getlist("location_continents"):
            # on POST: use incoming values
            selected_conts = self.data.getlist("location_continents")
        else:
            # on GET or edit: fall back to instance.filters
            selected_conts = data.get("location", {}).get("continents", [])

        qs = Location.objects.filter(continent__in=selected_conts) if selected_conts else Location.objects.none()

        countries = list(qs.values_list("country_name", flat=True).distinct().order_by("country_name"))
        self.fields["location_countries"].choices = [(c, c) for c in countries]
        self.fields["location_countries"].initial = data.get("location", {}).get("countries", [])

        # ---- Water sources
        opts = ["Network", "Rooftop Tank", "Well", "Other"]
        self.fields["water_sources"].choices = [(w, w) for w in opts]
        self.fields["water_sources"].initial = data.get("measurements", {}).get("waterSources", [])

        # ---- Temperature
        temp = data.get("measurements", {}).get("temperature")
        if temp:
            self.fields["temperature_enabled"].initial = True
            self.fields["temp_from"].initial = temp.get("from")
            self.fields["temp_to"].initial = temp.get("to")
            self.fields["temp_unit"].initial = temp.get("unit")
        else:
            self.fields["temperature_enabled"].initial = False

        # ---- Date range
        dr = data.get("dateRange", {})
        self.fields["date_from"].initial = dr.get("from")
        self.fields["date_to"].initial = dr.get("to")

        # ---- Time slots
        slots = data.get("times", [])
        text = ";".join(f"{s.get('from', '')}-{s.get('to', '')}" for s in slots)
        self.fields["times"].initial = text

    def clean(self):
        """Validate and parse all filters, assembling a JSON-serializable `filters` dict.

        Returns
        -------
        dict
            Cleaned data with a `filters` key containing all parsed filters.
        """
        cleaned = super().clean()

        # --- Validate temperature range
        if cleaned.get("temperature_enabled"):
            tf = cleaned.get("temp_from")
            tt = cleaned.get("temp_to")
            if tf and tt and tf > tt:
                self.add_error("temp_to", "Maximum temperature must be ≥ minimum temperature.")

        # --- Validate date range
        df = cleaned.get("date_from")
        dt = cleaned.get("date_to")
        if df and dt and df > dt:
            self.add_error("date_to", "End date must be on or after start date.")

        # --- Parse & validate time slots
        sorted_slots = self.validate_time_slots(cleaned)

        # --- Assemble JSON-friendly filters dict
        filters = {
            "location": {
                "continents": cleaned.get("location_continents", []),
                "countries": cleaned.get("location_countries", []),
            },
            "measurements": {
                "waterSources": cleaned.get("water_sources", []),
            },
        }

        if cleaned.get("temperature_enabled"):
            temp_from_value = cleaned.get("temp_from")
            temp_to_value = cleaned.get("temp_to")
            temp_unit_value = cleaned.get("temp_unit")

            temperature_filter = {}

            if temp_from_value is not None:
                temperature_filter["from"] = float(temp_from_value)
            else:
                temperature_filter["from"] = None  # Explicitly None if not provided

            if temp_to_value is not None:
                temperature_filter["to"] = float(temp_to_value)
            else:
                temperature_filter["to"] = None  # Explicitly None if not provided

            temperature_filter["unit"] = temp_unit_value or "C"  # Default to 'C'

            filters["measurements"]["temperature"] = temperature_filter

        if df and dt:
            filters["dateRange"] = {
                "from": str(df) if df else None,
                "to": str(dt) if dt else None,
            }

        # use the original string fragments for JSON
        filters["times"] = [{"from": a.strftime("%H:%M"), "to": b.strftime("%H:%M")} for a, b in sorted_slots]

        cleaned["filters"] = filters
        return cleaned

    def validate_time_slots(self, cleaned):
        """Validate and parse time slots from the cleaned data.

        Parameters
        ----------
        cleaned : dict
            The cleaned data from the form.

        Returns
        -------
        list
            A list of tuples containing validated time slot pairs (start, end).
        """
        raw = cleaned.get("times", "")
        slot_pairs = []
        for idx, part in enumerate(raw.split(";")):
            if "-" not in part:
                continue
            fr_str, to_str = part.split("-", 1)
            fr_str = fr_str.strip()
            to_str = to_str.strip()
            try:
                fr = time.fromisoformat(fr_str) if fr_str else time.min
                to = time.fromisoformat(to_str) if to_str else time.max
            except ValueError:
                self.add_error("times", f"Invalid time in slot #{idx + 1}: “{part}”.")
                continue
            if fr and to and fr > to:
                self.add_error("times", f"Slot #{idx + 1} start must be ≤ end.")
            slot_pairs.append((fr, to))

        if slot_pairs and len(slot_pairs) > 3:
            self.add_error("times", "You can specify up to 3 time slots only.")

        # --- Check for overlapping slots
        sorted_slots = sorted(slot_pairs, key=lambda r: r[0])
        for (_, e1), (s2, _) in itertools.pairwise(sorted_slots):
            if s2 <= e1:
                self.add_error("times", "Time slots must not overlap.")
                break
        return sorted_slots

    def save(self, commit=True):
        """Save the Preset instance with the assembled filters.

        Parameters
        ----------
        commit : bool, optional
            Whether to save the instance immediately (default is True).

        Returns
        -------
        Preset
            The saved Preset instance with filters applied.
        """
        # Create the Preset instance without saving it yet
        # and populate the filters field
        inst = super().save(commit=False)
        inst.filters = self.cleaned_data.get("filters", {})
        if commit:
            inst.save()
        return inst


@admin.register(Preset)
class PresetAdmin(admin.ModelAdmin):
    """Admin interface for the Preset model.

    This class customizes the admin interface for managing export presets, including
    advanced filtering options for locations, measurements, and date/time ranges.

    Attributes
    ----------
    form : PresetAdminForm
    list_display : tuple
        Fields to display in the list view.
    list_display_links : tuple
        Fields that are clickable links in the list view.
    search_fields : tuple
        Fields to include in the search functionality.
    fieldsets : list
        Fieldsets for organizing the form layout in the admin interface.
    Media : class
        Additional JavaScript and CSS files for the admin interface.
    """

    form = PresetAdminForm
    list_display = ("name", "created_by", "is_public", "created_at", "updated_at")
    list_display_links = ("name",)
    search_fields = ("name", "description", "created_by__username")

    fieldsets = [
        (
            "Basic Information",
            {
                "fields": [
                    "name",
                    "description",
                    "created_by",
                    "is_public",
                ]
            },
        ),
        (
            "Location Filters",
            {
                "fields": [
                    "location_continents",
                    "location_countries",
                ]
            },
        ),
        (
            "Measurement Filters",
            {
                "fields": [
                    "water_sources",
                ]
            },
        ),
        (
            "Metric Filters",
            {
                "fields": [
                    "temperature_enabled",
                    "temp_from",
                    "temp_to",
                    "temp_unit",
                ]
            },
        ),
        (
            "Date and Time Filters",
            {
                "fields": [
                    "date_from",
                    "date_to",
                    "times",
                ]
            },
        ),
    ]

    class Media:
        """Media class to include additional JavaScript and CSS files for the admin interface.

        This class allows for custom styling and functionality in the admin view of the Preset model.

        Attributes
        ----------
        js : tuple
            JavaScript files to include in the admin interface.
        css : dict
            CSS files to include in the admin interface.
        """

        js = (settings.STATIC_URL + "measurement_export/js/preset_admin.js",)
        css = {"all": (settings.STATIC_URL + "measurement_export/css/preset_admin.css",)}
