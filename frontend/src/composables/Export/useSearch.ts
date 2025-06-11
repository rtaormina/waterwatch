import { reactive, computed } from "vue";
import axios from "axios";
import type { LocationFilter, MeasurementFilter, DateRangeFilter, TimeSlot } from "./useFilters";
import Cookies from "universal-cookie";

// Define the structure of the search parameters
export interface MeasurementSearchParams {
    query?: string;
    location?: LocationFilter;
    measurements?: MeasurementFilter;
    dateRange?: DateRangeFilter;
    times?: TimeSlot[];
}

const state = reactive({
    hasSearched: false,
    activeSearchCount: 0,
    isLoading: false,
    count: 0,
    avgTemp: 0,
});

/**
 * Composable for searching measurements with various filters.
 * Each call to useSearch() creates its own isolated state.
 */
export function useSearch() {
    const cookies = new Cookies();

    /**
     * Searches for measurements with the given parameters.
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
            const raw = response.data.avgTemp;
            state.avgTemp = Math.round(raw * 10) / 10;
            state.hasSearched = true;
        } catch (err) {
            console.error("Search failed:", err);
            state.count = 0;
            state.avgTemp = 0;
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
        };
    });

    /**
     * Resets the search state.
     */
    function resetSearch(): void {
        state.hasSearched = false;
        state.activeSearchCount = 0;
        state.isLoading = false;
        state.count = 0;
        state.avgTemp = 0;
    }

    /**
     * Flattens the nested search parameters for use in API requests.
     */
    function flattenSearchParams(params: MeasurementSearchParams): Record<string, string | string[] | undefined> {
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

        if (params.dateRange) {
            if (params.dateRange.from) flattened["dateRange[from]"] = params.dateRange.from;
            if (params.dateRange.to) flattened["dateRange[to]"] = params.dateRange.to;
        }

        if (params.times?.length) {
            flattened["times"] = JSON.stringify(params.times);
        }

        return flattened;
    }

    return {
        // Expose primitive state value directly
        hasSearched: computed(() => state.hasSearched),
        isLoading: computed(() => state.isLoading),

        // Expose results as a computed property
        results,

        // Methods
        searchMeasurements,
        resetSearch,
        flattenSearchParams,
    };
}
