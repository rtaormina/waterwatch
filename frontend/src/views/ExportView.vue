<script setup lang="ts">
/**
 * DataDownloadView
 *
 * This component provides a UI for querying measurement data via a search bar and filter panel,
 * displays search results, and allows exporting data in various formats. It tracks filter changes
 * to warn the user when filters are out of sync with the last executed search.
 */
defineOptions({ name: "DataDownloadView" });
import { onMounted, ref, watch } from "vue";
import { computed } from "vue";
import SearchBar from "../components/Export/SearchBarComponent.vue";
import FilterPanel from "../components/Export/FilterPanelComponent.vue";
import SearchResults from "../components/Export/SearchResultsComponent.vue";
import { useSearch } from "../composables/Export/useSearch";
import { useExportData } from "../composables/Export/useExportData";
import { type Preset } from "../composables/Export/usePresets";
import { useRouter } from "vue-router";
import { useExportStore } from "../stores/ExportStore";

const router = useRouter();
const exportStore = useExportStore();

const query = ref("");
// Reference to the FilterPanel component
const filterPanelRef = ref<InstanceType<typeof FilterPanel> | null>(null);

// Store last search parameters to detect changes in filters
const lastSearchParams = ref<import("@/composables/Export/useSearch").MeasurementSearchParams | null>(null);

// Flag to indicate if filters are out of sync with the last search
const filtersOutOfSync = ref(false);

/**
 * Shows the export data on a map.
 */
function handleShowOnMap() {
    router.push({ name: "ExportMap" });
}

// Computed property to get the temperature unit from FilterPanel or default to "C"
const temperatureUnit = computed(() => {
    if (filterPanelRef.value) {
        return filterPanelRef.value.temperature.unit || "C";
    }
    return "C";
});

// Use measurements composable
const { results, searchMeasurements } = useSearch();

// Use export data composable
const { exportData } = useExportData();
const format = ref<"csv" | "xml" | "json" | "geojson">("csv");

/**
 * Function to handle search action.
 * This function retrieves the current filters from the FilterPanel, constructs search parameters, and performs a search.
 *
 * @returns {Promise<void>} A promise that resolves when the search is complete.
 */
async function onSearch(): Promise<void> {
    if (!filterPanelRef.value) return;

    // Get current filters from FilterPanel
    const searchParams = filterPanelRef.value.getSearchParams(query.value);
    lastSearchParams.value = searchParams;
    exportStore.filters = searchParams;

    // Perform search
    await searchMeasurements(searchParams);
    filtersOutOfSync.value = false;
}

/**
 * Function to handle preset application.
 * This function applies the preset's filters to the FilterPanel and triggers a search.
 *
 * @param {Preset} preset - The preset to apply
 * @returns {Promise<void>} A promise that resolves when the preset is applied and search is complete.
 */
async function onApplyPreset(preset: Preset): Promise<void> {
    if (!filterPanelRef.value) return;

    // Apply preset filters to FilterPanel
    filterPanelRef.value.applyFilters(preset.filters);

    // Trigger search with the new filters
    await onSearch();
}

const presetSearchDisabled = computed(() => {
    const panel = filterPanelRef.value;
    if (!panel) return true; // disable until panel is mounted

    return !(panel.tempRangeValid && panel.dateRangeValid && panel.allSlotsValid && panel.slotsNonOverlapping);
});

// Modal state for export failure
const showModal = ref(false);
/**
 * Function to handle download action.
 * This function exports data based on the selected format and last search parameters.
 *
 * @returns {Promise<void>} A promise that resolves when the export is complete.
 */
async function onDownload(): Promise<void> {
    const ok = await exportData(format.value, lastSearchParams.value == null ? {} : lastSearchParams.value);
    showModal.value = !ok;
}

onMounted(() => {
    console.log(exportStore.hasSearched, filterPanelRef.value, filtersOutOfSync.value);
    if (exportStore.hasSearched && filterPanelRef.value) {
        filterPanelRef.value.applyFilters(exportStore.filters);
        onSearch();
    }
});

// Watch for filter changes that occur *after* a search has been made
watch(
    () => {
        if (filterPanelRef.value) {
            return filterPanelRef.value.getSearchParams(query.value);
        }
        return null;
    },
    (currentParams) => {
        if (exportStore.hasSearched) {
            // Only act if a search has already been performed
            if (currentParams && lastSearchParams.value) {
                if (JSON.stringify(currentParams) !== JSON.stringify(lastSearchParams.value)) {
                    filtersOutOfSync.value = true;
                }
                // If params become same as lastSearchParams, filtersOutOfSync remains true until a new search confirms the current filters.
            } else if (currentParams && !lastSearchParams.value) {
                filtersOutOfSync.value = true;
            }
        }
    },
    { deep: true },
);
</script>

<template>
    <div
        class="h-auto bg-white w-full max-w-full mx-auto px-4 md:px-16 pt-6 flex flex-col flex-grow overflow-y-auto relative md:fixed md:top-[64px] md:bottom-0 z-10 outer-container"
    >
        <h1 class="text-2xl font-bold mb-6 shrink-0">Data Download</h1>

        <div class="flex flex-col md:flex-row md:space-x-8 flex-grow min-h-0 pb-[14px]">
            <div class="w-full md:w-7/12 flex flex-col min-h-0 landscape-component component1">
                <div class="mb-4 shrink-0">
                    <SearchBar
                        v-model:query="query"
                        @search="onSearch"
                        @apply-preset="onApplyPreset"
                        :search-disabled="presetSearchDisabled"
                    />
                </div>
                <div class="h-auto bg-light mb-[14px] overflow-visible landscape-component">
                    <FilterPanel ref="filterPanelRef" @search="onSearch" />
                </div>
            </div>

            <div class="w-full md:w-5/12 flex flex-col h-auto overflow-visible landscape-component component2">
                <SearchResults
                    :results="results"
                    :searched="exportStore.hasSearched"
                    v-model:format="format"
                    @download="onDownload"
                    :show-modal="showModal"
                    :temperature-unit="temperatureUnit"
                    @close-modal="showModal = false"
                    :filters-out-of-sync="filtersOutOfSync"
                    @show-on-map="handleShowOnMap"
                />
            </div>
        </div>
    </div>
</template>

<style>
@media (max-height: 500px) {
    .outer-container {
        padding-inline: 2vw !important;
    }

    .landscape-component {
        padding: 0.5rem !important;
        overflow-y: visible !important;
        height: auto !important;
    }
    .component1 {
        width: 65% !important;
        max-width: 65% !important;
    }

    .component2 {
        width: 35% !important;
        max-width: 35% !important;
    }
}
</style>
