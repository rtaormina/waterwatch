import { ref, computed, onMounted, toValue, type MaybeRefOrGetter } from "vue";
import axios from "axios";
import type { MeasurementSearchParams } from "./useSearch";

export interface LocationFilter {
  continents: string[];
  countries: string[];
}

export interface MeasurementFilter {
  temperature?: TemperatureFilter | null;
  waterSources: string[];
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

export function useFilters(
  selectedContinents: MaybeRefOrGetter<string[]>,
  selectedCountries: MaybeRefOrGetter<string[]>,
  selectedWaterSources: MaybeRefOrGetter<string[]>,
  temperatureEnabled: MaybeRefOrGetter<boolean>,
  temperature: MaybeRefOrGetter<TemperatureFilter>,
  dateRange: MaybeRefOrGetter<DateRangeFilter>,
  times: MaybeRefOrGetter<TimeSlot[]>
) {
  // Location filter logic
  const continents = ref<string[]>([]);
  const countriesByContinent = ref<Record<string, string[]>>({});

  // Load location data
  async function loadLocations() {
    const { data } = await axios.get<Record<string, string[]>>(
      "/api/locations/"
    );
    continents.value = Object.keys(data);
    countriesByContinent.value = data;
  }

  // Derived state
  const allCountries = computed(() =>
    toValue(selectedContinents).flatMap(
      (c) => toValue(countriesByContinent)[c] || []
    )
  );
  const continentPlaceholder = computed(() =>
    toValue(selectedContinents).length ? "" : "Select continents"
  );
  const countryPlaceholder = computed(() =>
    toValue(selectedCountries).length ? "" : "Select countries"
  );

  // Toggle logic
  function toggleItem<T>(list: T[], item: T): T[] {
    return list.includes(item)
      ? list.filter((x) => x !== item)
      : [...list, item];
  }

  function toggleAll<T>(list: T[], all: T[]): T[] {
    return list.length ? [] : [...all];
  }

  // Display formatting
  function formatContinentSelectionText() {
    const n = toValue(selectedContinents).length;
    if (n === 0) return "";
    if (n === 1) return toValue(selectedContinents)[0];
    return `${n} continents selected`;
  }

  function formatCountrySelectionText() {
    const n = toValue(selectedCountries).length;
    if (n === 0) return "";
    if (n === 1) return toValue(selectedCountries)[0];
    return `${n} countries selected`;
  }

  // Measurement filter logic
  const waterSources = ref<string[]>([]);

  // Load water sources data
  async function loadWaterSources() {
    waterSources.value = ["Network", "Rooftop Tank", "Well", "Other"];
  }

  const waterSourcePlaceholder = computed(() =>
    toValue(selectedWaterSources).length ? "" : "Select water sources"
  );

  function formatWaterSourceSelectionText() {
    const n = toValue(selectedWaterSources).length;
    if (n === 0) return "";
    if (n === 1) return toValue(selectedWaterSources)[0];
    if (n === 2)
      return `${toValue(selectedWaterSources)[0]} and ${
        toValue(selectedWaterSources)[1]
      }`;
    return `${n} water sources selected`;
  }

  const tempRangeValid = computed(() => {
    const f = parseFloat(toValue(temperature).from);
    const t = parseFloat(toValue(temperature).to);
    return isNaN(f) || isNaN(t) || t >= f;
  });

  // Date range filter logic
  const dateRangeValid = computed(() => {
    if (!toValue(dateRange).from || !toValue(dateRange).to) return true;
    return new Date(toValue(dateRange).to) >= new Date(toValue(dateRange).from);
  });

  // Time slot filter logic
  function slotValid(slot: TimeSlot) {
    if (!slot.from || !slot.to) return true;
    return slot.to >= slot.from;
  }

  const allSlotsValid = computed<boolean>(() => {
    if (toValue(times).length === 0) return true;
    return toValue(times).every((slot) => slotValid(slot));
  });

  const slotsNonOverlapping = computed(() => {
    const ranges = toValue(times)
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
    if (toValue(times).length < 3) {
      toValue(times).push({ from: "", to: "" });
    }
  }

  function removeSlot(index: number) {
    toValue(times).splice(index, 1);
  }

  // Get current filter state as search parameters
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
      },
      dateRange: {
        from: toValue(dateRange).from,
        to: toValue(dateRange).to,
      },
      times: toValue(times),
    };
  }

  function standardizeTemperature(temp: TemperatureFilter): TemperatureFilter {
    const from = temp.from === "" ? 0 : parseFloat(temp.from);
    const to = temp.to === "" ? 212 : parseFloat(temp.to);
    if (temp.unit === "F") {
      return {
        from: ((from - 32) * 5) / 9 + "",
        to: ((to - 32) * 5) / 9 + "",
        unit: "C",
      };
    }
    return { from: temp.from, to: temp.to, unit: "C" };
  }

  return {
    continents,
    countriesByContinent,
    loadLocations,
    allCountries,
    continentPlaceholder,
    countryPlaceholder,
    toggleContinent: (list: string[], continent: string) =>
      toggleItem(list, continent),
    toggleCountry: (list: string[], country: string) =>
      toggleItem(list, country),
    toggleAllContinents: (list: string[]) =>
      toggleAll(list, toValue(continents)),
    toggleAllCountries: (list: string[]) => toggleAll(list, allCountries.value),
    toggleWaterSource: (list: string[], ws: string) => toggleItem(list, ws),
    toggleAllWaterSources: (list: string[]) =>
      toggleAll(list, toValue(waterSources)),
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
  };
}
