<script setup>
import { ref, reactive } from "vue";
import NavBar from "@/components/NavBar.vue";
import SearchBar from "@/components/SearchBarComponent.vue";
import FilterPanel from "@/components/FilterPanelComponent.vue";
import SearchResults from "@/components/SearchResultsComponent.vue";

const query = ref("");
const hasSearched = ref(false);
const results = reactive({
    count: 0,
    avgTemp: 0,
});

// Define presets - can be expanded with more options
// const presets = [
//     {
//         name: "Mediterranean Waters",
//         continents: ["Europe", "Africa"],
//         countries: ["Italy", "Spain", "France", "Greece", "Morocco", "Tunisia"],
//         temperature: {
//             enabled: true,
//             from: 15,
//             to: 30,
//             unit: "C",
//         },
//         dateRange: {
//             from: "",
//             to: "",
//         },
//         times: [],
//     },
// ];

/**
 * Function to handle search with server communication
 *
 * @param {Object} payload - The search parameters
 */
async function onSearch(payload) {
    console.log("Search with:", payload);
    hasSearched.value = true;

    try {
        // In a real implementation, this would be an API call
        // const response = await fetch('/api/search', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(payload)
        // });
        // const data = await response.json();

        // For demonstration, set sample results
        // In production, you would use data from the response
        results.count = 1000;
        results.avgTemp = 23.5;
        results.avgTurbidity = 2;
        results.avgPH = 6.8;
    } catch (error) {
        console.error("Search failed:", error);
        // Handle error state
    }
}

// Function to apply preset to filter panel
// function applyPreset(presetIndex) {
//     // This would trigger an event to update the filter panel
//     // Currently we're just logging
//     console.log("Applying preset:", presets[presetIndex]);
//     // In a real implementation, you would emit this to the filter panel
//     // or use a shared state management solution
// }
</script>

<template>
    <div class="h-screen bg-white flex flex-col">
        <NavBar />
        <div
            class="w-full max-w-full mx-auto px-4 md:px-16 pt-6 flex flex-col flex-grow md:overflow-y-auto relative z-10"
        >
            <h1 class="text-2xl font-bold mb-6 shrink-0">Data Download</h1>

            <div class="flex flex-col md:flex-row md:space-x-8 flex-grow min-h-0 pb-[14px]">
                <div class="w-full md:w-7/12 flex flex-col min-h-0">
                    <div class="mb-4 shrink-0">
                        <SearchBar v-model:query="query" @search="onSearch" />
                    </div>
                    <div class="flex-grow bg-light min-h-0 mb-[14px]">
                        <FilterPanel @search="onSearch" />
                    </div>
                </div>

                <div class="w-full md:w-5/12 flex flex-col min-h-0">
                    <SearchResults :results="results" :searched="hasSearched" />
                </div>
            </div>
        </div>
    </div>
</template>
