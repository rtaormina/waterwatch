<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { computed } from "vue";
import NavBar from "@/components/NavBar.vue";
import SearchBar from "@/components/SearchBarComponent.vue";
import FilterPanel from "@/components/FilterPanelComponent.vue";
import SearchResults from "@/components/SearchResultsComponent.vue";
import { useSearch } from "@/composables/useSearch";
import { useExportData } from "@/composables/useExportData";

const query = ref("");
const filterPanelRef = ref<InstanceType<typeof FilterPanel> | null>(null);

const lastSearchParams = ref<
  import("@/composables/useSearch").MeasurementSearchParams | null
>(null);

const filtersOutOfSync = ref(false);

const temperatureUnit = computed(() => {
  if (filterPanelRef.value) {
    return filterPanelRef.value.temperature.unit || "C";
  }
  return "C";
});

// Use measurements composable
const { results, hasSearched, searchMeasurements } =
  useSearch();

// Use export data composable
const { exportData } = useExportData();
const format = ref<"csv" | "xml" | "json" | "geojson">("csv");

// Handle search from SearchBar or FilterPanel
async function onSearch() {
  if (!filterPanelRef.value) return;

  // Get current filters from FilterPanel
  const searchParams = filterPanelRef.value.getSearchParams(query.value);
  lastSearchParams.value = searchParams;

  console.log("Search params:", searchParams);

  // Perform search
  await searchMeasurements(searchParams);
  filtersOutOfSync.value = false;
}

const showModal = ref(false);
async function onDownload() {
  const ok = await exportData(
    format.value,
    lastSearchParams.value == null ? {} : lastSearchParams.value
  );
  showModal.value = !ok;
}

// Watch for filter changes that occur *after* a search has been made
watch(
  () => {
    // This dependency array re-runs the watcher if query or filter panel's internal state (via getSearchParams) changes
    if (filterPanelRef.value) {
      return filterPanelRef.value.getSearchParams(query.value);
    }
    return null;
  },
  (currentParams) => {
    if (hasSearched.value) {
      // Only act if a search has already been performed
      if (currentParams && lastSearchParams.value) {
        if (
          JSON.stringify(currentParams) !==
          JSON.stringify(lastSearchParams.value)
        ) {
          filtersOutOfSync.value = true;
        }
        // If params become same as lastSearchParams, filtersOutOfSync remains true
        // until a new search confirms the current filters. This is intentional.
      } else if (currentParams && !lastSearchParams.value) {
        // Edge case: should ideally not happen if onSearch sets lastSearchParams correctly
        filtersOutOfSync.value = true;
      }
    }
  },
  { deep: true } // Use deep watch as getSearchParams returns an object
);
</script>

<template>
  <div class="h-screen bg-white flex flex-col">
    <NavBar />
    <div
      class="w-full max-w-full mx-auto px-4 md:px-16 pt-6 flex flex-col flex-grow md:overflow-y-auto relative z-10"
    >
      <h1 class="text-2xl font-bold mb-6 shrink-0">Data Download</h1>

      <div
        class="flex flex-col md:flex-row md:space-x-8 flex-grow min-h-0 pb-[14px]"
      >
        <div class="w-full md:w-7/12 flex flex-col min-h-0">
          <div class="mb-4 shrink-0">
            <SearchBar
              v-model:query="query"
              @search="onSearch"
            />
          </div>
          <div class="flex-grow bg-light min-h-0 mb-[14px]">
            <FilterPanel
              ref="filterPanelRef"
              @search="onSearch"
            />
          </div>
        </div>

        <div class="w-full md:w-5/12 flex flex-col min-h-0">
          <SearchResults
            :results="results"
            :searched="hasSearched"
            v-model:format="format"
            @download="onDownload"
            :show-modal="showModal"
            :temperature-unit="temperatureUnit"
            @close-modal="showModal = false"
            :filters-out-of-sync="filtersOutOfSync"
          />
        </div>
      </div>
    </div>
  </div>
</template>
