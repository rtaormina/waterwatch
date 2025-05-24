import Cookies from "universal-cookie";
import { toValue, type MaybeRefOrGetter } from "vue";
import { saveAs } from "file-saver";
import { useSearch } from "./useSearch";
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
        // flatten whatever filters were given (or empty object)
        const flat = filters ? useSearch().flattenSearchParams(filters) : {};
        const params = new URLSearchParams(flat as Record<string, string>);

        // always include format
        params.append("format", toValue(format));

        const url = `/api/measurements/?${params.toString()}`;
        try {
            const res = await fetch(url, {
                method: "GET",
                headers: { "X-CSRFToken": cookies.get("csrftoken") },
                credentials: "same-origin",
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            saveAs(blob, `water-data.${toValue(format)}`);
            return true;
        } catch {
            return false;
        }
    }

    return {
        exportData,
    };
}
