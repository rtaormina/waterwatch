import { defineStore } from "pinia";

import type { MeasurementSearchParams } from "@/composables/Export/useSearch";

export const useExportStore = defineStore("export", {
    /**
     * Store to save the state of the export view.
     */
    state: () => ({
        filters: {} as MeasurementSearchParams,
        hasSearched: false as boolean,
    }),
});
