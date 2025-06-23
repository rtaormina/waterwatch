import { ref, computed, toValue, type MaybeRefOrGetter } from "vue";
import axios from "axios";
import type { MeasurementSearchParams } from "./useSearch";

// Define the structure of the location filter
export interface LocationFilter {
    continents: string[];
    countries: string[];
}

// Define the structure of the measurement filter
export interface MeasurementFilter {
    temperature?: TemperatureFilter | null;
    waterSources: string[];
}

// Define the structure of the temperature filter
export interface TemperatureFilter {
    from: string;
    to: string;
    unit: "C" | "F";
}

// Define the structure of the date range filter
export interface DateRangeFilter {
    from: string;
    to: string;
}

// Define the structure of the time slot filter
export interface TimeSlot {
    from: string;
    to: string;
}

/**
 * Composable for managing filters for the export page.
 *
 * @param selectedContinents The selected continents.
 * @param selectedCountries The selected countries.
 * @param selectedWaterSources The selected water sources.
 * @param temperatureEnabled Whether the temperature filter is enabled.
 * @param temperature The temperature filter settings.
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
    dateRange: MaybeRefOrGetter<DateRangeFilter>,
    times: MaybeRefOrGetter<TimeSlot[]>,
) {
    // Location filter logic
    const continents = ref<string[]>([]);
    const countriesByContinent = ref<Record<string, string[]>>({});

    /**
     * Loads the available locations (continents and countries) from the API.
     * This function fetches the locations and populates the `continents` and `countriesByContinent` reactive variables.
     *
     * @returns {Promise<void>} A promise that resolves when the locations are loaded.
     * @throws {Error} If the API request fails.
     */
    async function loadLocations(): Promise<void> {
        const { data } = await axios.get<Record<string, string[]>>("/api/locations/");
        continents.value = Object.keys(data);
        countriesByContinent.value = data;
    }

    // Derived state
    const allCountries = computed(() =>
        toValue(selectedContinents)
            .flatMap((c) => toValue(countriesByContinent)[c] || [])
            .sort((a, b) => a.localeCompare(b)),
    );
    const continentPlaceholder = computed(() => (toValue(selectedContinents).length ? "" : "Select regions"));
    const countryPlaceholder = computed(() => (toValue(selectedCountries).length ? "" : "Select subregions"));

    /**
     * Toggles the presence of an item in a list.
     *
     * @param list The list to modify.
     * @param item The item to toggle.
     * @returns {T[]} The modified list.
     */
    function toggleItem<T>(list: T[], item: T): T[] {
        return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
    }

    /**
     * Toggles all items in a list based on the provided 'all' list.
     * If the list is empty, it returns all items; otherwise, it returns an empty list.
     *
     * @param list The current list of items.
     * @param all The complete list of items to toggle.
     * @returns {T[]} The modified list containing either all items or an empty list.
     */
    function toggleAll<T>(list: T[], all: T[]): T[] {
        return list.length ? [] : [...all];
    }

    /**
     * Formats the selected continent text for display.
     *
     * @returns {string} The formatted text.
     */
    function formatContinentSelectionText() {
        const n = toValue(selectedContinents).length;
        if (n === 0) return "";
        if (n === 1) return toValue(selectedContinents)[0];
        return `${n} regions selected`;
    }

    /**
     * Formats the selected country text for display.
     *
     * @returns {string} The formatted text.
     */
    function formatCountrySelectionText() {
        const n = toValue(selectedCountries).length;
        if (n === 0) return "";
        if (n === 1) return toValue(selectedCountries)[0];
        return `${n} subregions selected`;
    }

    // Measurement filter logic
    const waterSources = ref<string[]>([]);

    /**
     * Loads the available water sources.
     * This function fetches the water sources and populates the `waterSources` reactive variable.
     *
     * @returns {Promise<void>} A promise that resolves when the water sources are loaded.
     */
    async function loadWaterSources(): Promise<void> {
        waterSources.value = ["Network", "Rooftop Tank", "Well", "Other"];
    }

    // Derived state for water sources
    const waterSourcePlaceholder = computed(() => (toValue(selectedWaterSources).length ? "" : "Select water sources"));

    /**
     * Formats the selected water source text for display.
     *
     * @returns {string} The formatted text.
     */
    function formatWaterSourceSelectionText() {
        const n = toValue(selectedWaterSources).length;
        if (n === 0) return "";
        if (n === 1) return toValue(selectedWaterSources)[0];
        if (n === 2) return `${toValue(selectedWaterSources)[0]} and ${toValue(selectedWaterSources)[1]}`;
        return `${n} water sources selected`;
    }

    /**
     * Checks if the temperature range is valid.
     * A temperature range is considered valid if both 'from' and 'to' are defined and 'to' is greater than or equal to 'from'.
     *
     * @returns {boolean} True if the temperature range is valid, false otherwise.
     */
    const tempRangeValid = computed(() => {
        const f = parseFloat(toValue(temperature).from);
        const t = parseFloat(toValue(temperature).to);
        return isNaN(f) || isNaN(t) || t >= f;
    });

    /**
     * Checks if the date range is valid.
     *
     * A date range is considered valid if both 'from' and 'to' are defined and 'to' is greater than or equal to 'from'.
     * @returns {boolean} True if the date range is valid, false otherwise.
     */
    const dateRangeValid = computed(() => {
        if (!toValue(dateRange).from || !toValue(dateRange).to) return true;
        return new Date(toValue(dateRange).to) >= new Date(toValue(dateRange).from);
    });

    /**
     * Checks if a time slot is valid.
     *
     * A time slot is considered valid if both 'from' and 'to' are defined and 'to' is greater than or equal to 'from'.
     * @param slot The time slot to validate.
     * @returns {boolean} True if the slot is valid, false otherwise.
     */
    function slotValid(slot: TimeSlot) {
        if (!slot.from || !slot.to) return true;
        return slot.to >= slot.from;
    }

    /**
     * Checks if all time slots are valid.
     *
     * This function checks if each time slot in the provided list is valid.
     * If the list is empty, it returns true.
     *
     * @returns {boolean} True if all slots are valid, false otherwise.
     */
    const allSlotsValid = computed<boolean>(() => {
        if (toValue(times).length === 0) return true;
        return toValue(times).every((slot) => slotValid(slot));
    });

    /**
     * Checks if all time slots are non-overlapping.
     *
     * This function checks if the time slots do not overlap with each other.
     * It returns true if there are no overlaps, false otherwise.
     *
     * @returns {boolean} True if all slots are non-overlapping, false otherwise.
     */
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

    /**
     * Adds a new time slot to the list of time slots.
     *
     * This function adds a new time slot with empty 'from' and 'to' values
     * if the current number of time slots is less than 3.
     *
     * @returns {void}
     */
    function addSlot(): void {
        if (toValue(times).length < 3) {
            toValue(times).push({ from: "", to: "" });
        }
    }

    /**
     * Removes a time slot at the specified index.
     *
     * This function removes the time slot at the given index from the list of time slots.
     *
     * @param {number} index The index of the time slot to remove.
     * @returns {void}
     */
    function removeSlot(index: number): void {
        toValue(times).splice(index, 1);
    }

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
                temperature: toValue(temperatureEnabled) ? { ...standardizeTemperature(toValue(temperature)) } : null,
            },
            dateRange: {
                from: toValue(dateRange).from,
                to: toValue(dateRange).to,
            },
            times: toValue(times),
        };
    }

    /**
     * Standardizes the temperature filter values.
     *
     * This function converts the temperature values from Fahrenheit to Celsius if the unit is 'F'.
     * If the 'from' value is empty, it defaults to 0, and if the 'to' value is empty, it defaults to 212.
     *
     * @param {TemperatureFilter} temp The temperature filter to standardize.
     * @returns {TemperatureFilter} The standardized temperature filter.
     */
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
        /**
         * Toggles the selection of a continent in the given list.
         *
         * @param list The list of selected items.
         * @param continent The continent to toggle.
         * @returns The updated list of selected items.
         */
        toggleContinent: (list: string[], continent: string) => toggleItem(list, continent),
        /**
         * Toggles the selection of a country in the given list.
         *
         * @param list The list of selected items.
         * @param country The country to toggle.
         * @returns The updated list of selected items.
         */
        toggleCountry: (list: string[], country: string) => toggleItem(list, country),
        /**
         * Toggles the selection of all continents in the given list.
         *
         * @param list The list of selected items.
         * @returns The updated list of selected items.
         */
        toggleAllContinents: (list: string[]) => toggleAll(list, toValue(continents)),
        /**
         * Toggles the selection of all countries in the given list.
         *
         * @param list The list of selected items.
         * @returns The updated list of selected items.
         */
        toggleAllCountries: (list: string[]) => toggleAll(list, allCountries.value),
        /**
         * Toggles the selection of a water source in the given list.
         *
         * @param list The list of selected water sources.
         * @param ws The water source to toggle.
         * @returns The updated list of selected water sources.
         */
        toggleWaterSource: (list: string[], ws: string) => toggleItem(list, ws),
        /**
         * Toggles the selection of all water sources in the given list.
         *
         * @param list The list of selected water sources.
         * @returns The updated list of selected water sources.
         */
        toggleAllWaterSources: (list: string[]) => toggleAll(list, toValue(waterSources)),
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
