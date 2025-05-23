import { ref, reactive, readonly, toRefs, computed } from "vue";
import axios from "axios";
import type {
  LocationFilter,
  MeasurementFilter,
  DateRangeFilter,
  TimeSlot,
} from "./useFilters";

export interface MeasurementSearchParams {
  query?: string;
  location?: LocationFilter;
  measurements?: MeasurementFilter;
  dateRange?: DateRangeFilter;
  times?: TimeSlot[];
}

const state = reactive({
  loading: false,
  error: "",
  hasSearched: false,
  count: 0,
  avgTemp: 0,
});

export function useSearch() {
  // Search measurements with filters
  async function searchMeasurements(
    params: MeasurementSearchParams
  ): Promise<void> {
    state.loading = true;
    state.error = "";
    state.hasSearched = true;

    try {
      const response = await axios.get("/api/measurements/", {
        params: flattenSearchParams(params),
      });

      // Update results
      state.count = response.data.count || 0;
      state.avgTemp = response.data.avgTemp || 0;
    } catch (err) {
      console.error("Search failed:", err);
      state.error = err instanceof Error ? err.message : "Search failed";
      state.count = 0;
      state.avgTemp = 0;
    } finally {
      state.loading = false;
    }
  }

  const results = computed(() => {
    return {
      count: state.count,
      avgTemp: state.avgTemp,
    };
  });

  // Reset search state
  function resetSearch(): void {
    state.hasSearched = false;
    state.count = 0;
    state.avgTemp = 0;
    state.error = "";
  }

  // Helper function to flatten nested params for axios
  function flattenSearchParams(
    params: MeasurementSearchParams
  ): Record<string, any> {
    const flattened: Record<string, any> = {};

    if (params.query) {
      flattened.query = params.query;
    }

    if (params.location) {
      if (params.location.continents?.length) {
        flattened["locstateation[continents]"] = params.location.continents;
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
      flattened["measurements[waterSources]"] =
        params.measurements.waterSources;
    }

    if (params.measurements?.temperature) {
      const temp = params.measurements.temperature;
      if (temp.from) flattened["measurements[temperature][from]"] = temp.from;
      if (temp.to) flattened["measurements[temperature][to]"] = temp.to;
    }

    if (params.dateRange) {
      if (params.dateRange.from)
        flattened["dateRange[from]"] = params.dateRange.from;
      if (params.dateRange.to) flattened["dateRange[to]"] = params.dateRange.to;
    }

    if (params.times?.length) {
      flattened["times"] = JSON.stringify(params.times);
    }

    return flattened;
  }

  return {
    // Expose primitive state values directly
    loading: computed(() => state.loading),
    error: computed(() => state.error),
    hasSearched: computed(() => state.hasSearched),

    // Expose results as a computed property
    results,

    // Also expose individual result values for more granular binding
    count: computed(() => state.count),
    avgTemp: computed(() => state.avgTemp),

    // Methods
    searchMeasurements,
    resetSearch,
    flattenSearchParams,
  };
}
