<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { computed } from "vue";
import NavBar from "@/components/NavBar.vue";
import SearchBar from "@/components/SearchBarComponent.vue";
import FilterPanel from "@/components/FilterPanelComponent.vue";
import SearchResults from "@/components/SearchResultsComponent.vue";
import { useMeasurements } from "@/composables/ExportSearchLogic";
import type { Preset } from "@/composables/ExportPresetLogic";
import { exportData, format } from "@/composables/ExportDownloadLogic";

const query = ref("");
const filterPanelRef = ref<InstanceType<typeof FilterPanel> | null>(null);

const lastSearchParams = ref<
  import("@/composables/ExportSearchLogic").MeasurementSearchParams | null
>(null);

// Use measurements composable
const { results, hasSearched, loading, error, searchMeasurements } =
  useMeasurements();

// Handle search from SearchBar or FilterPanel
async function onSearch() {
  if (!filterPanelRef.value) return;

  // Get current filters from FilterPanel
  const searchParams = filterPanelRef.value.getSearchParams(query.value);
  lastSearchParams.value = searchParams;

  // Perform search
  await searchMeasurements(searchParams);
}

const showModal = ref(false);
async function onDownload() {;
  const ok = await exportData(lastSearchParams.value == null ? {} : lastSearchParams.value);
  showModal.value = !ok;
}

// Handle preset application
function onApplyPreset(preset: Preset) {
  if (filterPanelRef.value && preset.filters) {
    filterPanelRef.value.applyPreset(preset.filters);
  }
}
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
              @applyPreset="onApplyPreset"
            />
          </div>
          <div class="flex-grow bg-light min-h-0 mb-[14px]">
            <FilterPanel ref="filterPanelRef" @search="onSearch" />
          </div>
        </div>

        <div class="w-full md:w-5/12 flex flex-col min-h-0">
          <SearchResults
            :results="results"
            :searched="hasSearched"
            @download="onDownload"
            :show-modal="showModal"
            @close-modal="showModal = false"
          />
        </div>
      </div>
    </div>
  </div>
</template>
