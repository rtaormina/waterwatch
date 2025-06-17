import { defineStore } from "pinia";

import type { Filters } from "../composables/Export/usePresets";

export const useExportStore = defineStore("export", {
    /**
     * Store to save the state of the export view.
     */
    state: () => ({
        filters: {} as Filters,
        hasSearched: false as boolean,
    }),
});
