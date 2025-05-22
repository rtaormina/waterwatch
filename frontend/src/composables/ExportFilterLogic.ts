import { ref, reactive, computed, onMounted } from "vue";
import axios from "axios";
import type { PresetFilters } from "./ExportPresetLogic";
import type { MeasurementSearchParams } from "./ExportSearchLogic";

export interface LocationFilter {
  continents: string[];
  countries: string[];
}

export interface MeasurementFilter {
  temperature?: TemperatureFilter | null;
}

export interface TemperatureFilter {
  from: string;
  to: string;
  unit: "C" | "F";
}
export interface DateRangeFilter {
  from: string;
  to: string;
}

export interface TimeSlot {
  from: string;
  to: string;
}

export function useFilters() {
  // --- Location filter logic ---
  // --- Reactive state ---
  const continents = ref<string[]>([]);
  const countriesByContinent = ref<Record<string, string[]>>({});
  const selectedContinents = ref<string[]>([]);
  const selectedCountries = ref<string[]>([]);

  // --- Derived state ---
  const allCountries = computed(() =>
    selectedContinents.value.flatMap((c) => countriesByContinent.value[c] || [])
  );

  const continentPlaceholder = computed(() =>
    selectedContinents.value.length ? "" : "Select continents"
  );
  const countryPlaceholder = computed(() =>
    selectedCountries.value.length ? "" : "Select countries"
  );

  // --- Load data ---
  async function load() {
    const { data } = await axios.get<Record<string, string[]>>(
      "/api/locations/"
    );
    continents.value = Object.keys(data);
    countriesByContinent.value = data;
  }
  onMounted(load);

  // --- Toggle logic ---
  function toggleContinent(continent: string) {
    const idx = selectedContinents.value.indexOf(continent);
    if (idx > -1) {
      selectedContinents.value = selectedContinents.value.filter(
        (c) => c !== continent
      );
    } else {
      selectedContinents.value = [...selectedContinents.value, continent];
    }
  }

  function toggleCountry(country: string) {
    const idx = selectedCountries.value.indexOf(country);
    if (idx > -1) {
      selectedCountries.value = selectedCountries.value.filter(
        (c) => c !== country
      );
    } else {
      selectedCountries.value = [...selectedCountries.value, country];
    }
  }

  function toggleAllContinents() {
    if (selectedContinents.value.length) {
      selectedContinents.value = [];
    } else {
      selectedContinents.value = [...continents.value];
    }
  }

  function toggleAllCountries() {
    if (selectedCountries.value.length) {
      selectedCountries.value = [];
    } else {
      selectedCountries.value = [...allCountries.value];
    }
  }

  // --- Display formatting ---
  function formatContinentSelectionText() {
    const n = selectedContinents.value.length;
    if (n === 0) return "";
    if (n === 1) return selectedContinents.value[0];
    return `${n} continents selected`;
  }

  function formatCountrySelectionText() {
    const n = selectedCountries.value.length;
    if (n === 0) return "";
    if (n === 1) return selectedCountries.value[0];
    return `${n} countries selected`;
  }

  // --- Measurement filter logic ---
  const temperatureEnabled = ref(false);
  const temperature = reactive<TemperatureFilter>({
    from: "",
    to: "",
    unit: "C",
  });

  const tempRangeValid = computed(() => {
    const f = parseFloat(temperature.from);
    const t = parseFloat(temperature.to);
    return isNaN(f) || isNaN(t) || t >= f;
  });

  // --- Date range filter logic ---
  const dateRange = reactive<DateRangeFilter>({
    from: "",
    to: "",
  });

  const dateRangeValid = computed(() => {
    if (!dateRange.from || !dateRange.to) return true;
    return new Date(dateRange.to) >= new Date(dateRange.from);
  });

  // --- Time slot filter logic ---
  const times = ref<TimeSlot[]>([]);

  function slotValid(slot: TimeSlot) {
    if (!slot.from || !slot.to) return true;
    return slot.to >= slot.from;
  }

  const allSlotsValid = computed<boolean>(() => {
    if (times.value.length === 0) return true;
    return times.value.every((slot) => slotValid(slot));
  });

  const slotsNonOverlapping = computed(() => {
    const ranges = times.value
      .map((slot) => {
        const start = slot.from || "00:00";
        const end = slot.to || "23:59";
        return [start, end] as [string, string];
      })
      .sort((a, b) => a[0].localeCompare(b[0]));
    for (let i = 1; i < ranges.length; i++) {
      if (ranges[i][0] <= ranges[i - 1][1]) {
        return false;
      }
    }
    return true;
  });

  function addSlot() {
    if (times.value.length < 3) {
      times.value.push({ from: "", to: "" });
    }
  }

  function removeSlot(index: number) {
    times.value.splice(index, 1);
  }

  // Get current filter state as search parameters
  function getSearchParams(query?: string): MeasurementSearchParams {
    return {
      query,
      location: {
        continents: selectedContinents.value,
        countries: selectedCountries.value,
      },
      measurements: {
        temperature: temperatureEnabled.value ? { ...temperature } : null,
      },
      dateRange: {
        from: dateRange.from,
        to: dateRange.to,
      },
      times: times.value,
    };
  }

  // Apply preset filters
  function applyPreset(presetFilters: PresetFilters): void {
    try {
      // Reset current filters first
      resetFilters();

      // Apply location filters
      if (presetFilters.location) {
        if (presetFilters.location.continents) {
          selectedContinents.value = [...presetFilters.location.continents];
        }
        if (presetFilters.location.countries) {
          selectedCountries.value = [...presetFilters.location.countries];
        }
      }

      // Apply measurement filters
      if (presetFilters.measurements?.temperature) {
        temperatureEnabled.value = true;
        temperature.from = presetFilters.measurements.temperature.from || "";
        temperature.to = presetFilters.measurements.temperature.to || "";
        temperature.unit = presetFilters.measurements.temperature.unit || "C";
      }

      // Apply date range filters
      if (presetFilters.dateRange) {
        dateRange.from = presetFilters.dateRange.from || "";
        dateRange.to = presetFilters.dateRange.to || "";
      }

      // Apply time filters
      if (presetFilters.times) {
        times.value = [...presetFilters.times];
      }

      console.log("Preset applied successfully:", presetFilters);
    } catch (error) {
      console.error("Error applying preset:", error);
    }
  }

  // Reset all filters
  function resetFilters(): void {
    selectedContinents.value = [];
    selectedCountries.value = [];
    temperature.from = "";
    temperature.to = "";
    temperature.unit = "C";
    temperatureEnabled.value = false;
    dateRange.from = "";
    dateRange.to = "";
    times.value = [];
  }

  return {
    // Location filter
    continents,
    countriesByContinent,
    selectedContinents,
    selectedCountries,
    allCountries,
    continentPlaceholder,
    countryPlaceholder,
    toggleContinent,
    toggleCountry,
    toggleAllContinents,
    toggleAllCountries,
    formatContinentSelectionText,
    formatCountrySelectionText,
    // Measurement filter
    temperatureEnabled,
    temperature,
    tempRangeValid,
    // Date range filter
    dateRange,
    dateRangeValid,
    // Time slot filter
    times,
    allSlotsValid,
    slotsNonOverlapping,
    addSlot,
    removeSlot,
    slotValid,
    // Filter logic
    getSearchParams,
    applyPreset,
    resetFilters,
  };
}
