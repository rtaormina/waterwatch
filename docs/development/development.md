# Development

This section outlines the development steps that need to be taken to extend certain WATERWATCH functionalities.

```{contents} Table of Contents
:depth: 3
```

## Adding Additional Metrics

This section outlines how an additional metric can be integrated into WATERWATCH.

### Backend

#### Measurements

##### `backend/measurements/models.py`

Metric models are defined in `backend/measurements/models.py`. To add a metric model to the database, create a class for the metric with the following structure, replacing `Metric` with the name of the metric being added, and adding any additional fields, constraints, indexes, and methods as necessary:

```python
class Metric(models.Model):
    """Model for recording metric measurements in the database.

    Attributes
    ----------
    measurement : Measurement
        Associated Measurement for metric
    """
    measurement = models.OneToOneField(Measurement, on_delete=models.CASCADE, null=False, default=None)
    value = models.DecimalField(max_digits=4, decimal_places=1)
```

Any additional desired fields can be added after the measurement field.

##### `backend/measurements/metrics.py`

In `backend/measurements/metrics.py`, import the model and add the name of the metric to `METRIC_MODELS`:

```python
from .models import Temperature, Metric

METRIC_MODELS = [
    Temperature,
    # add here
    Metric,
]
```

##### `backend/measurements/admin.py`

Next, to ensure that the metric is properly registered with the Django admin interface, add the following to `backend/measurements/admin.py`, replacing `Metric` with the name of your metric:

```python
from .models import Metric

@admin.site.register(Metric)
class MetricAdmin(admin.ModelAdmin):
    """Admin view for Metric model."""

    list_display = (
        "measurement",
        "value",
        # add any additional fields here
    )
    list_display_links = ("value",)
    search_fields = [
        "value",
        # add any additional fields here
    ]
```

#### Measurement Collection

##### `backend/measurement_collection/serializers.py`

Metrics require a serializer to be properly added and exported.
In `backend/measurement_collection/serializers.py`, import the new metric and add a serializer for the new metric in the following format, replacing `Metric` and `metric_field_x` with the appropriate metric name and fields defined in the model.

```python
from measurements.models import Metric

class MetricSerializer(serializers.ModelSerializer):
    """Serializer for Metric model.

    Parameters
    ----------
    serializers.ModelSerializer : Base class
        Inherits from Django REST Framework's ModelSerializer
    """

    class Meta:
        """Meta class for MetricSerializer."""

        model = Metric
        fields = ["metric_field_1", "metric_field_2"]
```

Next, adjust the `MeasurementSerializer` in the same file to include the new metric serializer. Add the following, replacing `metric` with the name of your metric:

```python
class MeasurementSerializer(GeoFeatureModelSerializer):
    """Serializer for Measurement model.

    Parameters
    ----------
    serializers.ModelSerializer : Base class
        Inherits from Django REST Framework's ModelSerializer

    Attributes
    ----------
    temperature : TemperatureSerializer
        Serializer for the Temperature model
        This is a nested serializer that allows for the creation of a Temperature object
        when creating a Measurement object.

    -> add new serializer here
    metric : MetricSerializer
        Serializer for the Metric model
        This is a nested serializer that allows for the creation of a Metric object
        when creating a Measurement object.

    Methods
    -------
    create(validated_data)
        Create a Measurement object and nested metric objects if the data is provided.
        Returns the created Measurement object.
    """

    temperature = TemperatureSerializer(required=False)
    # add new serializer here
    metric = MetricSerializer(required=False)

    class Meta:
        """Meta class for MeasurementSerializer."""

        model = Measurement
        # add new metric field to the fields list
        fields = ["timestamp", "local_date", "local_time", "location", "water_source", "temperature", "metric"]
        geo_field = "location"

    def validate(self, data):
        """Validate the data before creating a Measurement object.

        Parameters
        ----------
        data : dict
            The data to validate.

        Returns
        -------
        dict
            The validated data.
        """
        # Set flag if temperature is out of range
        temperature_data = data.get("temperature")
        if temperature_data and temperature_data.get("value") > 40.0:
            data["flag"] = False

        # add here
        # Set flag if metric is out of range (if applicable)
        metric_data = data.get("metric")
        if metric_data and metric_data.get("value") > 100.0:  # Replace 100.0 with the appropriate threshold
            data["flag"] = False

        location = data.get("location")
        if isinstance(location, Point):
            data["location"] = Point(round(location.x, 3), round(location.y, 3), srid=location.srid)

        # Make water_source lowercase
        data["water_source"] = data["water_source"].lower()

        return data

    def create(self, validated_data):
        """Create a Measurement object and nested metric objects if the data is provided.

        Parameters
        ----------
        validated_data : dict
            The validated data from the serializer.

        Returns
        -------
        Measurement
            The created Measurement object.
        """
        temperature_data = validated_data.pop("temperature", None)
        # extract metric data if it exists
        metric_data = validated_data.pop("metric", None)
        measurement = Measurement.objects.create(**validated_data)
        timestamp_local = datetime.combine(measurement.local_date, measurement.local_time)
        active_campaigns = find_matching_campaigns(
            timestamp_local, str(measurement.location.y), str(measurement.location.x)
        )
        measurement.campaigns.add(*active_campaigns)
        if temperature_data:
            Temperature.objects.create(measurement=measurement, **temperature_data)
        # create metric object if metric data exists
        if metric_data:
            Metric.objects.create(measurement=measurement, **metric_data)

        return measurement
```

#### Measurement Export

##### `backend/measurement_export/utils.py`

To introduce the possibility of filtering by metrics other than temperature, adjust `backend/measurement_export/utils.py` as follows.

In the function `apply_measurement_filters(data, qs)`, add the following, replacing the method call `filter_measurements_by_metric` with the name of your filtering method:

```python
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
    # add here
    qs = filter_measurement_by_metric(qs, data)
    # method continues
```

Then, add a new method, e.g., `filter_measurement_by_metric(qs, data)`, in the same file, to, e.g., filter by the range of the metric's values. Replace any form of the word `metric` with the name of your new metric.

```python
def filter_measurement_by_metric(qs, data):
    """Filter the queryset by metric range.

    This function filters measurements based on a metric range provided in the request.

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
    metric_from_str = data.get("measurements[metric][from]")
    metric_to_str = data.get("measurements[metric][to]")

    try:
        if metric_from_str:
            qs = qs.filter(metric__value__gte=float(metric_from_str))
        if metric_to_str:
            qs = qs.filter(metric__value__lte=float(metric_to_str))
    except ValueError as e:
        logger.warning("Invalid metric value: %s. From: '%s', To: '%s'", e, metric_from_str, metric_to_str)
    return qs
```

##### `backend/measurement_export/views.py`

Next, in `backend/measurement_export/views.py`, make the following changes:
Import `filter_measurement_by_metric` at the top of the file:

```python
from .utils import (
    _build_inclusion_query,
    filter_by_date_range,
    filter_by_time_slots,
    filter_by_water_sources,
    filter_measurement_by_temperature,
    # add here
    filter_measurement_by_metric,
    initialize_location_geometries,
    optimize_location_filtering,
)
```

If you want any additional statistics returned by a call to `/api/measurements/search/` (without a format parameter), add the following in the method `search_measurements_view(request)`, replacing `metricStat`, `metricValue`, and `Stat(metric__value)` with the appropriate metric stat and method call:

```python
# existing code

# For non-export requests, return summary statistics
stats = qs.aggregate(
    count=Count("id"),
    avgTemp=Avg("temperature__value"),
    metricStat=Stat("metric__value"),
)

return JsonResponse(
    {
        "count": stats["count"] or 0,
        "avgTemp": float(stats["avgTemp"] or 0.0),
        "metricValue": float(stats["metricStat"] or 0.0),
    }
)
```

To ensure that the queryset is filtered by the metric, add the following lines in the method `_build_cache_key(data)`, replacing `_build_metric_set(data)` with the name of your new method:

```python
def _build_cache_key(data):
    """Build one cached ID-set per filter category (OR inside each, AND across categories).

    Returns a list of Python sets to intersect.
    """
    sets = []
    # Pre-filtering
    sets += _build_boundary_geometry_set(data)
    sets += _build_month_set(data)
    # Export filters
    sets += _build_water_sources_set(data)
    sets += _build_temperature_set(data)
    # add here
    sets += _build_metric_set(data)

    sets += _build_date_range_set(data)
    sets += _build_time_slots_set(data)
    sets += _build_location_set(data)
    return sets
```

Then, add the method `_build_metric_set(data)`, replacing any form of the word `metric` with the name of your new metric:

```python
def _build_metric_set(data):
    sets = []
    if data.get("measurements[metric][from]") or data.get("measurements[metric][to]"):
        key = f"ids:metric:{data.get('measurements[metric][from]')}_{data.get('measurements[metric][to]')}"

        def qs_metric():
            qs = Measurement.objects.all()
            return filter_measurement_by_metric(qs, data)

        sets.append(_get_or_build_id_list(key, qs_metric))
    return sets
```

##### `backend/measurement_export/admin.py`

To allow for presets to include the new metric filter, e.g., by range, do the following.

Add the following changes in `backend/measurement_export/admin.py`.
Adjust the `PresetAdminForm` class, replacing any form of the word `metric` with the name of your new metric:

```python
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

    -> add new attributes here
    metric_enabled: forms.BooleanField
        Boolean to enable/disable metric filtering.
    metric_from : forms.DecimalField
        Minimum metric value.
    metric_to : forms.DecimalField
        Maximum metric value.

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

    # ...

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

    # add new attributes
    metric_from = forms.DecimalField(label="Minimum metric value", required=False)
    metric_to = forms.DecimalField(label="Maximum metric value", required=False)

    # class continues

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        data = getattr(self.instance, "filters", {}) or {}

        # ...

        # ---- Temperature
        temp = data.get("measurements", {}).get("temperature")
        if temp:
            self.fields["temperature_enabled"].initial = True
            self.fields["temp_from"].initial = temp.get("from")
            self.fields["temp_to"].initial = temp.get("to")
            self.fields["temp_unit"].initial = temp.get("unit")
        else:
            self.fields["temperature_enabled"].initial = False

        # add here
        # ---- Metric
        metric = data.get("measurements", {}).get("metric")
        if metric:
            self.fields["metric_enabled"].initial = True
            self.fields["metric_from"].initial = metric.get("from")
            self.fields["metric_to"].initial = metric.get("to")
        else:
            self.fields["metric_enabled"].initial = False

        # method continues

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

        # add here
        # --- Validate metric range
        if cleaned.get("metric_enabled"):
            mf = cleaned.get("metric_from")
            mt = cleaned.get("metric_to")
            if mf and mt and mf > mt:
                self.add_error("metric_to", "Maximum metric value must be ≥ minimum metric value.")

        # ...

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

        # add here
        if cleaned.get("metric_enabled"):
            metric_from_value = cleaned.get("metric_from")
            metric_to_value = cleaned.get("metric_to")

            metric_filter = {}

            if metric_from_value is not None:
                metric_filter["from"] = float(metric_from_value)
            else:
                metric_filter["from"] = None  # Explicitly None if not provided

            if metric_to_value is not None:
                metric_filter["to"] = float(metric_to_value)
            else:
                metric_filter["to"] = None  # Explicitly None if not provided

            filters["measurements"]["metric"] = metric_filter

        # method continues
```

Then, add the following under the `PresetAdmin` class in the same file:

```python
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
                # add here
                "metric_enabled",
                "metric_from",
                "metric_to",
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
```

##### `backend/measurement_export/static/measurement_export/js/preset_admin.js`

To conclude the metric in the preset export, add the following under the static file `backend/measurement_export/static/measurement_export/js/preset_admin.js`, adjusting the if-statement to check for the metric fields and adding the metric fields to the form:

```javascript
/* global django */
(function () {
  /**
   * Initialize the preset form JavaScript.
   *
   * @returns {void}
   */
  function initializeForm() {
    const $ = django.jQuery;

    // Adjust this if-statement

    if (!$ || !$("#id_temperature_enabled").length || !$("#id_metric_enabled").length) {
      // If jQuery or form elements aren't ready, try again in 100ms
      setTimeout(initializeForm, 100);
      return;
    }

    /**
     * Toggle visibility of temperature fields based on the "Enable temperature filter" checkbox.
     *
     * @returns {void}
     */
    function toggleTemps() {
      const on = $("#id_temperature_enabled").is(":checked");
      // console.log("Temperature enabled:", on); // Debug log

      ["temp_from", "temp_to", "temp_unit"].forEach((f) => {
        const field = $(".field-" + f);
        // console.log("Toggling field:", f, "Found elements:", field.length); // Debug log
        field.toggle(on);
      });
    }

    $("#id_temperature_enabled").change(toggleTemps);
    toggleTemps(); // Initial call

    // Add here
    /**
     * Toggle visibility of metric fields based on the "Enable metric filter" checkbox.
     *
     * @returns {void}
     */
    function toggleMetrics() {
      const on = $("#id_metric_enabled").is(":checked");
      // console.log("Metric enabled:", on); // Debug log

      ["metric_from", "metric_to"].forEach((f) => {
        const field = $(".field-" + f);
        // console.log("Toggling field:", f, "Found elements:", field.length); // Debug log
        field.toggle(on);
      });
    }
    $("#id_metric_enabled").change(toggleMetrics);
    toggleMetrics(); // Initial call

    // Add any additional initialization logic here
    // file continues
```

#### Measurement Analysis

##### `backend/measurement_analysis/serializers.py`

To add more information about new metrics returned from the `/api/measurements/aggregated` endpoint, add the following under the class `MeasurementAggregatedSerializer` in `backend/measurement_analysis/serializers.py`. Replace `metric_info_x` and `{SpecifyField}` with the appropriate metric statistic and field type.

```python
# existing code ...
class MeasurementAggregatedSerializer(serializers.Serializer):
    """Serializer for exporting measurements in aggregated format.

    This serializer is used to export aggregate measurements with their location and count
    """

    location = LocationField()
    count = serializers.FloatField()
    avg_temperature = serializers.FloatField()
    min_temperature = serializers.FloatField()
    max_temperature = serializers.FloatField()
    # add here
    metric_info_1 = serializers.{SpecifyField}()
    metric_info_2 = serializers.{SpecifyField}()
    # etc.
```

##### `backend/measurement_analysis/views.py`

Then, add the following under the method `analyzed_measurements_view(request)` in `backend/measurement_analysis/views.py`, replacing `metric_info_x`, `metric__value`, and `{Statistic}` with the appropriate metric statistic and field type:

```python
# existing code
results = query.values("location").annotate(
    count=Count("location"),
    avg_temperature=Avg("temperature__value"),
    min_temperature=Min("temperature__value"),
    max_temperature=Max("temperature__value"),
    # add here
    metric_info_1={Statistic}("metric__value"),
    metric_info_2={Statistic}("metric__value"),
)
```

Finally, modify the method `_build_optimized_queryset` to include the added metric, replacing `metric` with the name of your metric model:

````python
def _build_optimized_queryset():
    """Build an optimized base queryset for aggregation."""
    # Only select_related the temperature and metric models since that's what we're aggregating
    return Measurement.objects.select_related("temperature", "metric")

#### Final Steps

Once changes to the have been finalized, run the following commands:

```bash
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
````

### Frontend

#### Views

##### `frontend/src/views/MapView.vue`

Change the `MeasurementData` and `MeasurementResponseDataPoint` types in `frontend/src/views/MapView.vue` to include the new metric, replacing `newMetric` with the name of your metric:

```typescript
/**
 * Fetches measurements from the API and formats them for the HexMap component.
 * The data is fetched asynchronously and transformed into a format suitable for the map.
 */
type MeasurementData = {
  point: L.LatLng;
  temperature: number;
  minTemp: number;
  maxTemp: number;
  newMetric: number; // Add the new metric here
  // Add any additional fields as necessary
  count: number;
};
type MeasurementResponseDataPoint = {
  location: { latitude: number; longitude: number };
  avgTemperature: number;
  minTemperature: number;
  maxTemperature: number;
  avgNewMetric: number; // Add the new metric here
  // Add any additional fields as necessary
  count: number;
};
```

Add these same fields to the `data` const:

```typescript
// Fetches aggregated measurement data from the API and formats it for the HexMap component
const data = asyncComputed(async (): Promise<MeasurementData[]> => {
  refresh.value = !refresh.value; // Trigger re-fetching when refresh changes
  const res = await axios.post(
    "/api/measurements/aggregated/",
    range.value ? { month: range.value } : {},
    {
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": cookies.get("csrftoken"),
      },
    }
  );

  if (res.status !== 200) throw new Error(`Status: ${res.status}`);
  const data = res.data;

  return data.measurements.map((measurement: MeasurementResponseDataPoint) => ({
    point: L.latLng(
      measurement.location.latitude,
      measurement.location.longitude
    ),
    temperature: measurement.avg_temperature,
    minTemp: measurement.min_temperature,
    maxTemp: measurement.max_temperature,
    newMetric: measurement.avg_new_metric, // Add the new metric here
    count: measurement.count,
  }));
}, [] as MeasurementData[]);
```

#### Composables

##### `frontend/src/composables/Export/useFilters.ts`

In `frontend/src/composables/Export/useFilters.ts`, add the new metric to the filters, replacing `newMetric` with the name of your metric:

```typescript
export interface MeasurementFilter {
  temperature?: TemperatureFilter | null;
  newMetric?: NewMetricFilter | null; // Add the new metric filter here
  waterSources: string[];
}

export interface NewMetricFilter {
  from?: number | null;
  to?: number | null;
}

// other filters

// Adjust the method signature of the `useFilters` composable to include the new metric filter
/**
 * Composable for managing filters for the export page.
 *
 * @param selectedContinents The selected continents.
 * @param selectedCountries The selected countries.
 * @param selectedWaterSources The selected water sources.
 * @param temperatureEnabled Whether the temperature filter is enabled.
 * @param temperature The temperature filter settings.
 * @param newMetricEnabled Whether the new metric filter is enabled.
 * @param newMetric The new metric filter settings.
 * @param dateRange The date range filter settings.
 * @param times The time slots for filtering measurements.
 * @returns {Object} An object containing methods and computed properties for managing filters.
 */
export function useFilters(
  selectedContinents: MaybeRefOrGetter<string[]>,
  selectedCountries: MaybeRefOrGetter<string[]>,
  selectedWaterSources: MaybeRefOrGetter<string[]>,
  temperatureEnabled: MaybeRefOrGetter<boolean>,
  temperature: MaybeRefOrGetter<TemperatureFilter>,

  // Add the new metric filter here
  newMetricEnabled: MaybeRefOrGetter<boolean>,
  newMetric: MaybeRefOrGetter<MetricFilter>,

  dateRange: MaybeRefOrGetter<DateRangeFilter>,
  times: MaybeRefOrGetter<TimeSlot[]>
) {
  // existing logic

  // Add validation for the metric range
  /**
   * Checks if the new metric range is valid.
   * A new metric range is considered valid if both 'from' and 'to' are defined and 'to' is greater than or equal to 'from'.
   *
   * @returns {boolean} True if the metric range is valid, false otherwise.
   */
  const newMetricRangeValid = computed(() => {
    const f = parseFloat(toValue(newMetric).from);
    const t = parseFloat(toValue(newMetric).to);
    return isNaN(f) || isNaN(t) || t >= f;
  });

  // existing logic

  // Add the new metric filter to the search parameters
  /**
   * Generates search parameters based on the current filter selections.
   * This function constructs a `MeasurementSearchParams` object
   * containing the selected filters and their values.
   *
   * @param {string} [query] The search query string.
   * @returns {MeasurementSearchParams} The search parameters object.
   */
  function getSearchParams(query?: string): MeasurementSearchParams {
    return {
      query,
      location: {
        continents: toValue(selectedContinents),
        countries: toValue(selectedCountries),
      },
      measurements: {
        waterSources: toValue(selectedWaterSources),
        temperature: toValue(temperatureEnabled)
          ? { ...standardizeTemperature(toValue(temperature)) }
          : null,
        // Add the new metric filter here
        newMetric: toValue(newMetricEnabled) ? { ...toValue(newMetric) } : null,
      },
      dateRange: {
        from: toValue(dateRange).from,
        to: toValue(dateRange).to,
      },
      times: toValue(times),
    };
  }

  // existing logic

  return {
    // existing methods and computed properties

    // Add the new metric validation to the returned object
    newMetricRangeValid,
  };
}
```

##### `frontend/src/composables/Export/usePresets.ts`

In `frontend/src/composables/Export/usePresets.ts`, ensure that the new metric is included in the preset filters, replacing `newMetric` with the name of your metric:

```typescript
export interface Filters {
  location?: {
    continents: string[];
    countries: string[];
  };
  measurements?: {
    waterSources: string[];
    temperature?: {
      from: number | null;
      to: number | null;
      unit: "C" | "F";
    };
    // Add the new metric filter here
    newMetric?: {
      from: number | null;
      to: number | null;
    };
  };
  dateRange?: {
    from: string | null;
    to: string | null;
  };
  times?: Array<{
    from: string;
    to: string;
  }>;
}
```

##### `frontend/src/composables/Export/useSearch.ts`

In `frontend/src/composables/Export/useSearch.ts`, ensure that the new metric is included in the search results, replacing `newMetric` with the name of your metric:

```typescript
const state = reactive({
    activeSearchCount: 0,
    isLoading: false,
    count: 0,
    avgTemp: 0,
    // Add the new metric to the state
    avgNewMetric: 0,
});

// in the `useSearch` composable, ensure that the search results include the new metric
/**
 * Composable for searching measurements with various filters.

 * This composable provides methods to search for measurements based on
 * user-defined filters, and returns the results including count, average temperature, and average new metric.
 *
 * @returns {Object} An object containing:
 * - `hasSearched`: A computed property indicating if a search has been performed.
 * - `isLoading`: A computed property indicating if a search is currently in progress.
 * - `results`: A computed property containing the search results (count, average temperature, and average new metric).
 * - `searchMeasurements`: A method to perform the search with given parameters.
 * - `resetSearch`: A method to reset the search state.
 * - `flattenSearchParams`: A utility method to flatten nested search parameters for API requests.
 */
export function useSearch() {
    const cookies = new Cookies();

    /**
     * Searches for measurements with the given parameters.
     *
     * @param params The search parameters to use.
     * @return {Promise<void>} A promise that resolves when the search is complete.
     */
    async function searchMeasurements(params: MeasurementSearchParams): Promise<void> {
        state.activeSearchCount++;
        state.isLoading = state.activeSearchCount > 0;
        const flatParams = flattenSearchParams(params);

        try {
            const response = await axios.post("/api/measurements/search/", flatParams, {
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": cookies.get("csrftoken"),
                },
            });

            // Update results
            state.count = response.data.count;
            const rawTemp = response.data.avgTemp;
            state.avgTemp = Math.round(raw * 10) / 10;
            // Add the new metric to the results
            const rawNewMetric = response.data.avgNewMetric;
            state.avgNewMetric = Math.round(rawNewMetric * 10) / 10;

            exportStore.hasSearched = true;
        } catch (err) {
            console.error("Search failed:", err);
            state.count = 0;
            state.avgTemp = 0;

            // Reset the new metric in case of an error
            state.avgNewMetric = 0;

        } finally {
            state.activeSearchCount = Math.max(0, state.activeSearchCount - 1);
            state.isLoading = state.activeSearchCount > 0;
        }
    }

    // Computed property to return results
    const results = computed(() => {
        return {
            count: state.count,
            avgTemp: state.avgTemp,

            // Add the new metric to the results
            avgNewMetric: state.avgNewMetric,
        };
    });

    /**
     * Resets the search state.
     * This method clears the search results and resets the state to its initial values.
     *
     * @return {void}
     */
    function resetSearch(): void {
        exportStore.hasSearched = true;
        state.activeSearchCount = 0;
        state.isLoading = false;
        state.count = 0;
        state.avgTemp = 0;

        // Reset the new metric
        state.avgNewMetric = 0;
    }

    return {
        // Expose primitive state value directly
        isLoading: computed(() => state.isLoading),

        // Expose results as a computed property
        results,

        // Methods
        searchMeasurements,
        resetSearch,
    };
}

/**
 * Flattens the nested search parameters for use in API requests.
 * This function converts the structured search parameters into a flat object
 * suitable for URL query parameters.
 *
 * @param params The search parameters to flatten.
 * @return {Record<string, any>} A flat object containing the search parameters.
 */
export function flattenSearchParams(params: MeasurementSearchParams): Record<string, string | string[] | undefined> {
    const flattened: Record<string, string | string[] | undefined> = {};

    if (params.query) {
        flattened.query = params.query;
    }

    if (params.location) {
        if (params.location.continents?.length) {
            flattened["location[continents]"] = params.location.continents;
        }
        if (params.location.countries?.length) {
            flattened["location[countries]"] = params.location.countries;
        }
    }

    if (params.measurements) {
        const includedMetrics = Object.entries(params.measurements)
            .filter(([, filter]) => filter != null)
            .map(([metric]) => metric);

        if (includedMetrics.length) {
            flattened["measurements_included"] = includedMetrics;
        }
    }

    if (params.measurements?.waterSources?.length) {
        flattened["measurements[waterSources]"] = params.measurements.waterSources;
    }

    if (params.measurements?.temperature) {
        const temp = params.measurements.temperature;
        if (temp.from) flattened["measurements[temperature][from]"] = temp.from;
        if (temp.to) flattened["measurements[temperature][to]"] = temp.to;
    }

    // Add the new metric filter
    if (params.measurements?.newMetric) {
        const newMetric = params.measurements.newMetric;
        if (newMetric.from) flattened["measurements[newMetric][from]"] = newMetric.from;
        if (newMetric.to) flattened["measurements[newMetric][to]"] = newMetric.to;
    }

    if (params.dateRange) {
        if (params.dateRange.from) flattened["dateRange[from]"] = params.dateRange.from;
        if (params.dateRange.to) flattened["dateRange[to]"] = params.dateRange.to;
    }

    if (params.times?.length) {
        flattened["times"] = JSON.stringify(params.times);
    }

    return flattened;
}

    // function continues
```

##### `frontend/src/composables/MeasurementCollectionLogic.ts`

In `frontend/src/composables/MeasurementCollectionLogic.ts`, ensure that the new metric is included in the collection logic, replacing `newMetric` with the name of your metric:

```typescript
export type NewMetric = {
  value: number;
  // Add  any additional fields as necessary
};

// Update the Metric type to include the new metric
export type Metric = "temperature" | "newMetric" | never;

// Update the MeasurementData type to include the new metric
export type MeasurementData = {
  location: L.LatLng;
  waterSource?: WaterSource;
  temperature: Temperature;
  newMetric: NewMetric;
  selectedMetrics: Metric[];
  time: Time;
};

// Update the createPayload function to include the new metric
/**
 * Creates a payload object for measurement collection.
 *
 * @param {MeasurementData} data - The measurement data containing location, water source, and temperature information.
 * @param {Metric[]} selectedMetrics - An array of selected metrics to include in the payload.
 * @returns {{ timestamp_local: string; location: { type: string; coordinates: [number | undefined, number | undefined] }; water_source: string; temperature: { sensor: string; value: number; time_waited: string } }} the payload
 */
export function createPayload(
  data: MaybeRefOrGetter<MeasurementData>,
  selectedMetrics: MaybeRefOrGetter<Metric[]>
) {
  const measurementData = toValue(data);
  const temperature = toValue(selectedMetrics).includes("temperature")
    ? {
        sensor: measurementData.temperature.sensor,
        value: getTemperatureInCelsius(measurementData.temperature),
        time_waited: `00:${String(
          measurementData.temperature.time_waited.minutes ?? 0
        ).padStart(2, "0")}:${String(
          measurementData.temperature.time_waited.seconds ?? 0
        ).padStart(2, "0")}`,
      }
    : undefined;

  // Add the new metric to the payload
  const newMetric = toValue(selectedMetrics).includes("newMetric")
    ? {
        value: measurementData.newMetric.value,
        // Add any additional fields as necessary
      }
    : undefined;

  const longitudeRounded = Number(measurementData.location.lng.toFixed(3));
  const latitudeRounded = Number(measurementData.location.lat.toFixed(3));
  let local_date: string;
  let local_time: string;
  if (
    measurementData.time &&
    measurementData.time.localDate != undefined &&
    measurementData.time.localTime != undefined
  ) {
    local_date = measurementData.time.localDate;
    local_time = measurementData.time.localTime;
  } else {
    const localISO = DateTime.local().toISO();
    local_date = localISO
      ? localISO.split("T")[0]
      : DateTime.local().toFormat("yyyy-MM-dd");
    local_time = localISO
      ? localISO.split("T")[1].split(".")[0]
      : DateTime.local().toFormat("HH:mm:ss");
  }

  return {
    timestamp: DateTime.utc().toISO(),
    local_date: local_date,
    local_time: local_time,
    location: {
      type: "Point",
      coordinates: [longitudeRounded, latitudeRounded],
    },
    water_source: measurementData.waterSource,
    temperature: temperature,
    // Add the new metric to the payload
    metric: newMetric,
  };
}
```

#### Components

##### `frontend/src/components/HexMap.vue`

In `frontend/src/components/HexMap.vue`, change the `DataPoint` type to include the new metric, replacing `newMetric` with the name of your metric:

```typescript
// type for each incoming “measurement” point
type DataPoint = {
  point: L.LatLng;
  temperature: number;
  minTemp: number;
  maxTemp: number;
  countTemp: number;
  // Add the new metric here
  newMetric: number;
};
```

Furthermore, to ensure selected hexagons are deselected when their data changes, modify the `createSignature` const:

```typescript
/**
 * Creates a signature string for a set of data points.
 *
 * @param points - The array of data points to create a signature for.
 * @returns A signature string representing the data points.
 */
const createSignature = (points: DataPoint[]) => {
  if (points.length === 0) return "empty";

  const avgTemp =
    points.reduce((sum, p) => sum + p.temperature, 0) / points.length;
  // Add the new metric to the signature
  const avgNewMetric =
    points.reduce((sum, p) => sum + p.newMetric, 0) / points.length;
  const totalCount = points.reduce((sum, p) => sum + p.count, 0);
  const sortedTemps = points
    .map((p) => p.temperature)
    .sort()
    .join(",");

  // Return a signature string that includes the new metric
  return `${points.length}-${avgTemp.toFixed(
    2
  )}-${totalCount}-${sortedTemps}-${avgNewMetric.toFixed(2)}`;
};
```

Lastly, change the following lines:
```typescript
        if (!props.selectMult) {
            (async () => {
                // Fetch the hexagon data for the selected hexagon
                const cookies = new Cookies();
                const res = await axios.post(
                    "/api/measurements/aggregated/",
                    {
                        boundary_geometry: wkt,
                        month: props.month,
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRF-Token": cookies.get("csrftoken") || "",
                        },
                    },
                );

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const points = res.data.measurements.map((m: any) => ({
                    o: {
                        temperature: m.avg_temperature,
                        min: m.min_temperature,
                        max: m.max_temperature,
                        newMetric: m.new_metric, // Add the new metric here
                        count: m.count,
                    },
                }));
```

##### `frontend/src/components/Analysis/HexAnalysis.vue`

To ensure that the statistics for the new metric are displayed in the map, modify the `HexAnalysis.vue` component to include the new metric in the data processing and rendering logic.

```vue
<template>
  <div class="bg-white text-center">
    <h4 data-testid="count" class="font-bold mt-2">
      {{ count }} Measurement{{ count === 1 ? "" : "s" }}
    </h4>
    <!-- Clarify the temperature statistics -->
    <p data-testid="avg">Avg Temp: {{ avgTemp }}°C</p>
    <p data-testid="min">Min Temp: {{ minTemp }}°C</p>
    <p data-testid="max">Max Temp: {{ maxTemp }}°C</p>
    <!-- Add the new metric display -->
    <p data-testid="avg-new-metric">Avg New Metric: {{ avgNewMetric }}</p>
    <button
      data-testid="submit"
      class="bg-main text-white px-2 py-1 rounded hover:cursor-pointer"
      @click="
        props.onOpenDetails();
        props.onClose();
      "
    >
      See Details
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
interface Props {
  // Change the type of points to include the new metric
  points: {
    o: {
      temperature: number;
      minTemp: number;
      maxTemp: number;
      newMetric: number;
      count: number;
    };
  }[];
  onOpenDetails: () => void;
  onClose: () => void;
}
const props = defineProps<Props>();

const count = computed(() =>
  props.points.reduce((sum, p) => sum + p.o.count, 0)
);
const avgTemp = computed(() => {
  return (
    props.points.reduce((sum, p) => sum + p.o.temperature * p.o.count, 0) /
    props.points.reduce((sum, p) => sum + p.o.count, 0)
  ).toFixed(1);
});
const minTemp = computed(() => {
  return Math.min(...props.points.map((p) => p.o.min)).toFixed(1);
});
const maxTemp = computed(() => {
  return Math.max(...props.points.map((p) => p.o.max)).toFixed(1);
});
// Add the new metric average calculation
const avgNewMetric = computed(() => {
  return (
    props.points.reduce((sum, p) => sum + p.o.newMetric * p.o.count, 0) /
    props.points.reduce((sum, p) => sum + p.o.count, 0)
  ).toFixed(1);
});
</script>
```

##### `frontend/src/components/Export/SearchResultsComponent.vue`

In `frontend/src/components/Export/SearchResultsComponent.vue`, ensure that the new metric is included in the search results display, replacing `newMetric` with the name of your metric:
First, ensure that `Props` interface includes the new metric:

```typescript
interface Props {
  //  Change the type of results to include the new metric
  results: { count: number; avgTemp: number; avgNewMetric: number };
  searched: boolean;
  isLoading: boolean;
  showModal: boolean;
  filtersOutOfSync: boolean;
  temperatureUnit: "C" | "F";
  format: "csv" | "xml" | "json" | "geojson";
}
```

Next, in the template, add the new metric to the displayed results:

```vue
<!-- Show results only when search is complete and not loading -->
<template v-else-if="searched">
  <div class="flex justify-between">
    <span>Number of Results:</span>
    <span data-testid="num-results">{{ props.results.count }}</span>
  </div>
  <div class="flex justify-between">
    <span>Average Temperature:</span>
    <span data-testid="avg-temp">
      {{ avgTempConverted.toFixed(1) }}°{{ props.temperatureUnit }}
    </span>
  </div>
  <!-- Add the new metric display -->
  <div class="flex justify-between">
    <span>Average New Metric:</span>
    <span data-testid="avg-new-metric">
      {{ props.results.avgNewMetric.toFixed(1) }}
    </span>
  </div>
</template>
```

##### `frontend/src/components/Export/FilterPanelComponent.vue`

To filter by the new metric in the export filters, modify the `FilterPanelComponent.vue` to include the new metric filter, replacing `newMetric` with the name of your metric:

```vue
<script setup lang="ts">
import {
  useFilters,
  type DateRangeFilter,
  type TemperatureFilter,
  // Add the new metric filter type
  type NewMetricFilter,
  type TimeSlot,
} from "../../composables/Export/useFilters";

// Define the constants for the new metric filter
const newMetricEnabled = ref(true);
const newMetric = reactive<NewMetricFilter>({
  from: "",
  to: "",
});

// Initialize the filter states
const {
  continents,
  countriesByContinent,
  loadLocations,
  allCountries,
  continentPlaceholder,
  countryPlaceholder,
  toggleContinent,
  toggleCountry,
  toggleAllContinents,
  toggleAllCountries,
  toggleWaterSource,
  toggleAllWaterSources,
  formatContinentSelectionText,
  formatCountrySelectionText,
  waterSources,
  loadWaterSources,
  formatWaterSourceSelectionText,
  waterSourcePlaceholder,
  tempRangeValid,
  dateRangeValid,
  slotValid,
  allSlotsValid,
  slotsNonOverlapping,
  addSlot,
  removeSlot,
  getSearchParams,

  // Add the new metric range validation
  newMetricRangeValid,
} = useFilters(
  selectedContinents,
  selectedCountries,
  selectedWaterSources,
  temperatureEnabled,
  temperature,

  // Add the new metric filter
  newMetricEnabled,
  newMetric,

  dateRange,
  times
);

// Reset the new metric filter when the reset function is called
/**
 * Resets all filters to their default state.
 * Clears all selected continents, countries, water sources, temperature settings, date range, time slots, and search results.
 *
 * @returns {void}
 */
function reset() {
  selectedContinents.value = [];
  selectedCountries.value = [];
  selectedWaterSources.value = [];
  temperatureEnabled.value = true;
  temperature.from = "";
  temperature.to = "";
  temperature.unit = "C";

  // Reset the new metric filter
  newMetricEnabled.value = true;
  newMetric.from = "";
  newMetric.to = "";

  dateRange.from = "";
  dateRange.to = "";
  times.value = [];
  resetSearch();
}

// Add new metric to applyFilters
/**
 * Apply filters from a preset to the current filter state.
 * This function takes a preset's filters object and applies it to the component's reactive state.
 *
 * @param {any} filters - The filters object from a preset
 * @returns {void}
 */
function applyFilters(filters: Filters) {
  // Reset all filters first
  reset();

  if (!filters) return;

  // Apply location filters
  if (filters.location) {
    if (
      filters.location.continents &&
      Array.isArray(filters.location.continents)
    ) {
      selectedContinents.value = [...filters.location.continents];
    }
    nextTick(() => {
      if (
        filters.location &&
        filters.location.countries &&
        Array.isArray(filters.location.countries)
      ) {
        selectedCountries.value = [...filters.location.countries];
      }
    });
  }

  // Apply measurement filters
  if (filters.measurements) {
    if (
      filters.measurements.waterSources &&
      Array.isArray(filters.measurements.waterSources)
    ) {
      selectedWaterSources.value = [...filters.measurements.waterSources];
    }

    // Apply temperature filters
    if (filters.measurements.temperature) {
      temperatureEnabled.value = true;
      const temp = filters.measurements.temperature;
      temperature.from = temp.from?.toString() || "";
      temperature.to = temp.to?.toString() || "";
      temperature.unit = temp.unit || "C";
    }

    // Apply new metric filters
    if (filters.measurements.newMetric) {
      newMetricEnabled.value = true;
      const newMetricFilter = filters.measurements.newMetric;
      newMetric.from = newMetricFilter.from?.toString() || "";
      newMetric.to = newMetricFilter.to?.toString() || "";
    }
  }

  // Apply date range filters
  if (filters.dateRange) {
    dateRange.from = filters.dateRange.from || "";
    dateRange.to = filters.dateRange.to || "";
  }

  // Apply time slot filters
  if (filters.times && Array.isArray(filters.times)) {
    times.value = filters.times.map((slot: TimeSlot) => ({
      from: slot.from || "",
      to: slot.to || "",
    }));
  }
}

defineExpose({
  /** Calculate dropdown height based on panel size. */ calculateDropdownHeight,
  /** Close dropdowns on outside click. */ handleClickOutside,
  /** Toggle continent dropdown. */ toggleContinentDropdown,
  /** Toggle country dropdown. */ toggleCountryDropdown,
  /** Toggle water source dropdown. */ toggleWaterSourceDropdown,
  /** Clear search input when dropdown closes. */ clearSearchOnClose,
  /** Reset filters to defaults. */ reset,
  /** Get serialized search parameters for current filters. */ getSearchParams,
  /** Reactive temperature filter object. */ temperature,

  /** Reactive new metric filter object. */ newMetric,

  /** Apply preset filters */ applyFilters,
  /** Validation flags for search enable/disable */
  tempRangeValid,

  // Add the new metric range validation
  newMetricRangeValid,
  dateRangeValid,
  allSlotsValid,
  slotsNonOverlapping,
});
</script>

<template>
    <!-- Existing template code for the new metric component -->
                <!-- Temperature checkbox -->
                <div class="flex items-center justify-between mb-1">
                    <UCheckbox
                        v-model="temperatureEnabled"
                        label="Temperature"
                        class="mt-2"
                        :ui="{ base: 'bg-white' }"
                    />

                    <!-- Units -->
                    <div v-if="temperatureEnabled" class="flex space-x-2">
                        <button
                            @click="temperature.unit = 'C'"
                            :class="{ 'bg-main text-white': temperature.unit === 'C' }"
                            class="cursor-pointer px-3 rounded border"
                        >
                            °C
                        </button>
                        <button
                            @click="temperature.unit = 'F'"
                            :class="{ 'bg-main text-white': temperature.unit === 'F' }"
                            class="cursor-pointer px-3 rounded border"
                        >
                            °F
                        </button>
                    </div>
                </div>

                <!-- Temperature range fields with equal widths -->
                <div v-if="temperatureEnabled" class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end relative mt-2">
                    <!-- From -->
                    <div>
                        <label class="block text-sm mb-1">From</label>
                        <input
                            type="number"
                            v-model="temperature.from"
                            min="0"
                            max="212"
                            placeholder="Min temperature"
                            class="w-full border rounded bg-default px-3 py-2"
                        />
                    </div>

                    <!-- To -->
                    <div>
                        <label class="block text-sm mb-1">To</label>
                        <input
                            type="number"
                            v-model="temperature.to"
                            min="0"
                            max="212"
                            placeholder="Max temperature"
                            class="w-full border rounded bg-default px-3 py-2"
                        />
                    </div>

                    <p v-if="!tempRangeValid" class="text-red-600 text-sm col-span-1 md:col-span-2 -mt-2">
                        Temperature range is invalid.
                    </p>
                </div>

                <!-- New Metric checkbox -->
                <div class="flex items-center justify-between mb-1 mt-4">
                    <UCheckbox
                        v-model="newMetricEnabled"
                        label="New Metric"
                        class="mt-2"
                        :ui="{ base: 'bg-white' }"
                    />
                </div>

                <!-- New Metric range fields with equal widths -->
                <div v-if="newMetricEnabled" class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end relative mt-2">
                    <!-- From -->
                    <div>
                        <label class="block text-sm mb-1">From</label>
                        <!-- Adjust as necessary -->
                        <input
                            type="number"
                            v-model="newMetric.from"
                            min="0"
                            placeholder="Min new metric"
                            class="w-full border rounded bg-default px-3 py-2"
                        />
                    </div>

                    <!-- To -->
                    <div>
                        <label class="block text-sm mb-1">To</label>
                        <!-- Adjust as necessary -->
                        <input
                            type="number"
                            v-model="newMetric.to"
                            min="0"
                            placeholder="Max new metric"
                            class="w-full border rounded bg-default px-3 py-2"
                        />
                    </div>

                    <p v-if="!newMetricRangeValid" class="text-red-600 text-sm col-span-1 md:col-span-2 -mt-2">
                        New metric range is invalid.
                    </p>
                </div>
                <!-- Template continues-->

            <!-- Add new metric validation to search button -->
            <button
                @click="emit('search')"
                data-testid="search-button"
                :disabled="!tempRangeValid || !dateRangeValid || !allSlotsValid || !slotsNonOverlapping || !newMetricRangeValid"
                :class="
                    tempRangeValid && dateRangeValid && allSlotsValid && slotsNonOverlapping && newMetricRangeValid
                        ? 'bg-main cursor-pointer hover:bg-[#007ea4]'
                        : 'bg-accented cursor-not-allowed'
                "
                class="px-12 py-2 text-white rounded-2xl font-semibold text-lg"
            >
                Search
            </button>

</template>
```

##### `frontend/src/components/Measurement/NewMetric.vue`

To add the new metric to the frontend, create a new component in `frontend/src/components/Measurement/`, e.g. `NewMetric.vue`. This component should allow users to input the metric value and any other relevant fields. The component should also handle validation and submission of the metric data.

```vue
<script setup lang="ts">
import type { SensorOptions, NewMetric } from "@/composables/MeasurementCollectionLogic";
import { ref, watch } from "vue";
const priorDot = ref(false);

/**
 * Handles key presses for the new metric input field.
 *
 * @param {KeyboardEvent} event - The keypress event.
 * @return {void}
 */
const handleNewMetricPress = (event: KeyboardEvent) => {
    const key = event.key;
    const target = event.target as HTMLInputElement;

    if (key === "Backspace" || key === "Delete") {
        // handle backspace and delete
        priorDot.value = false;
        return;
    } else if (/^\d$/.test(key)) {
        // check if the key is a digit (0-9)
        priorDot.value = false;
        return;
    } else if (key === ".") {
        // handle decimal points (consecutive and non consecutive)
        if (target.value.includes(".") || priorDot.value) {
            event.preventDefault();
            return;
        }

        priorDot.value = true;
        return;
    }

    // Block any other input
    event.preventDefault();
};

/**
 * Handles input changes for the new metric input field, specifically with regard to leading/trailing zeros.
 *
 * @param {Event} event - The input event.
 * @return {void}
 */
const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    let value = target.value;
    if (value.length > 1 && value[0] === "0" && value[1] !== ".") {
        value = value.replace(/^0+/, "");
        if (value === "" || value === ".") {
            value = "0" + value;
        }
    }

    if (target.value !== value) {
        const cursorPos = target.selectionStart;
        target.value = value;
        target.setSelectionRange(cursorPos, cursorPos);
    }
};

const modelValue = defineModel<NewMetric>({
    required: true,
});

defineProps<{
    sensorOptions: SensorOptions;
}>();

type NewMetricErrors = {
    value: string | false;
};
const errors = ref<NewMetricErrors>({
    value: false,
});

// Add any validation and verification logic here, see `Temperature.vue` for reference
</script>

<template>
    <Block title="New Metric">
        <!-- Sensor Type -->
        <div class="flex-1 items-start gap-4 mb-4">
            <div class="flex flex-col">
                <UFormField class="xs:flex xs:items-center xs:gap-4" :error="errors.sensor" label="Sensor Type">
                    <USelect
                        data-testid="sensor-type"
                        :items="sensorOptions"
                        value-key="value"
                        v-model="modelValue.sensor"
                        class="w-60"
                        :ui="{
                            content: 'z-10',
                        }"
                    />
                </UFormField>
            </div>
        </div>

        <!-- New Metric Value -->
        <UFormField class="xs:flex xs:items-center xs:gap-4" :error="errors.value" label="New Metric Value">
            <div class="flex items-center gap-4">
                <UInput
                    data-testid="new-metric-val"
                    id="new-metric-val"
                    v-model="modelValue.value"
                    type="text"
                    @keydown="handleNewMetricPress"
                    @input="handleInput"
                    ref="newMetricRef"
                    placeholder="e.g. 24.3"
                    class="min-w-16 max-w-20"
                    aria-label="New metric value input"
                />
            </div>
        </UFormField>

        <!-- Time waited -->
        <div class="flex items-center gap-2">
            <UFormField class="xs:flex xs:items-center xs:gap-4" :error="errors.time_waited" label="Time waited">
                <DurationInput v-model="modelValue.time_waited" />
            </UFormField>
        </div>
    </Block>
</template>
```

##### `frontend/src/components/MeasurementComponent.vue`
To integrate the new metric into the measurement component, modify the `MeasurementComponent.vue` to include the new metric input and validation logic.

```vue
<script setup lang="ts">

// Add new metric
const selectedMetrics = ref<Metric[]>(["temperature", "newMetric"]);
const metricOptions: MetricOptions = [
    { label: "Temperature", value: "temperature" },
    { label: "New Metric", value: "newMetric" },
];

// Add new metric to the default data
const defaultData: MeasurementData = {
    location: L.latLng(0, 0),
    waterSource: undefined,
    temperature: {
        sensor: undefined,
        value: undefined,
        unit: "C",
        time_waited: {
            minutes: undefined,
            seconds: undefined,
        },
    },
    newMetric: {
        value: undefined,
        // Add any additional fields as necessary
    },
    selectedMetrics: ["temperature"],
    time: {
        localDate: undefined,
        localTime: undefined,
    },
};

const TemperatureMetricComponent = useTemplateRef<VerifiableComponent>("TemperatureMetric");
// Add the new metric component
const NewMetricComponent = useTemplateRef<VerifiableComponent>("NewMetric");
</script>

<template>
    <!-- Existing template code for the measurement component -->
            <!-- Temperature Metric (if selected) -->
            <TemperatureMetric
                v-if="selectedMetrics.includes('temperature')"
                v-model="data.temperature"
                :sensor-options="sensorOptions"
                ref="TemperatureMetric"
            />

            <!-- New Metric (if selected) -->
            <NewMetric
                v-if="selectedMetrics.includes('newMetric')"
                v-model="data.newMetric"
                :sensor-options="sensorOptions"
                ref="NewMetric"
            />
</template>
```

## Adding Water Sources

This section outlines how additional water sources can be integrated into WATERWATCH.

### Backend

#### Measurements

##### `backend/measurements/models.py`

In `backend/measurements/models.py`, add the desired water sources to `water_source_choices` in the `Measurement` model. Replace `water source` with the name of your new water source:

```python
water_source_choices = {
    "network": "network",
    "rooftop tank": "rooftop tank",
    "well": "well",
    "water source": "water source",  # Add your new water source here
    "other": "other",
}
```

#### Measurement Export

##### `backend/measurement_export/admin.py`

Add the new water sources to the `__init__` method of `PresetAdminForm` in `backend/measurement_export/admin.py`, replacing `Water Source` with the name of your new water source:

```python
# existing code

# ---- Water sources
# Add new water sources here
opts = ["Network", "Rooftop Tank", "Well", "Water Source", "Other"]
self.fields["water_sources"].choices = [(w, w) for w in opts]
self.fields["water_sources"].initial = data.get("measurements", {}).get("waterSources", [])

# method continues
```

### Frontend

#### `frontend/src/composables/MeasurementCollectionLogic.ts`

Add the new water source to the `WaterSource` type and `waterSourceOptions` LabelValuePair in `frontend/src/composables/MeasurementCollectionLogic.ts`, replacing `Water Source` with the name of your new water source:

```typescript
// Add your new water source to the WaterSource type
export type WaterSource =
  | "network"
  | "rooftop tank"
  | "well"
  | "water source"
  | "other";
export const waterSourceOptions: WaterSourceOptions = [
  { label: "Network", value: "network" },
  { label: "Rooftop Tank", value: "rooftop tank" },
  { label: "Well", value: "well" },
  { label: "Water Source", value: "water source" }, // Add your new water source here
  { label: "Other", value: "other" },
];
```

#### `frontend/src/composables/Export/useFilters.ts`

Add the new water source to the `loadWaterSources()` function in `frontend/src/composables/Export/useFilters.ts`, replacing `Water Source` with the name of your new water source:

```typescript
async function loadWaterSources(): Promise<void> {
  // add your new water source here
  waterSources.value = [
    "Network",
    "Rooftop Tank",
    "Well",
    "Water Source",
    "Other",
  ];
}
```
