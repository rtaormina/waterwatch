import Cookies from "universal-cookie";
import { toValue, type MaybeRefOrGetter } from "vue";
import { saveAs } from "file-saver";
import { flattenSearchParams } from "./useSearch";
import type { MeasurementSearchParams } from "./useSearch";

/**
 * Composables for exporting data from the API.
 * This is used by the export button in the export data page.
 * It allows the user to export data in different formats (CSV, JSON, etc.) and with different filters applied.
 * It uses the `useSearch` composable to flatten the search parameters and the `file-saver` library to save the file.
 *
 * @returns {Object} An object containing the `exportData` function.
 */
export function useExportData() {
    const cookies = new Cookies();

    /**
     * Exports data from the API in the specified format and with the given filters.
     *
     * @param {MaybeRefOrGetter} format - The format to export the data in (e.g., "csv", "json").
     * @param {MeasurementSearchParams} [filters] - Optional filters to apply to the data export.
     * @return {Promise<boolean>} - Returns a promise that resolves to true if the export was successful, or false if it failed.
     */
    async function exportData(format: MaybeRefOrGetter, filters?: MeasurementSearchParams): Promise<boolean> {
        // Get flattenSearchParams from useSearch instance
        const flatFilters = filters ? flattenSearchParams(filters) : {};

        // Prepare the data for the POST request body
        const bodyData = {
            ...flatFilters,
            format: toValue(format), // Add format to the body
        };

        const url = "/api/measurements/search/"; // URL without query parameters
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "X-CSRFToken": cookies.get("csrftoken"),
                    "Content-Type": "application/json", // Set Content-Type for JSON payload
                },
                credentials: "same-origin",
                body: JSON.stringify(bodyData), // Send data as a JSON string in the body
            });

            if (!res.ok) {
                const errorBody = await res.text(); // Try to get more error info
                throw new Error(`HTTP ${res.status} - ${errorBody}`);
            }
            const blob = await res.blob();
            saveAs(blob, `water-data.${toValue(format)}`);
            return true;
        } catch (err) {
            console.error("Export failed:", err);
            return false;
        }
    }

    return {
        exportData,
    };
}
