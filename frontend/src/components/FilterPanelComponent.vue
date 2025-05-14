<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { PlusIcon, MinusIcon } from "@heroicons/vue/24/solid";
import Multiselect from "vue-multiselect";
import "vue-multiselect/dist/vue-multiselect.min.css";

const emit = defineEmits(["search"]);

type ContinentName =
  | "Africa"
  | "Antarctica"
  | "Asia"
  | "Australia"
  | "Europe"
  | "North America"
  | "South America";

const continentOptions = [
  "Africa",
  "Antarctica",
  "Asia",
  "Australia",
  "Europe",
  "North America",
  "South America",
] as const;

type CountryMap = Record<ContinentName, string[]>;
const countryOptions: CountryMap = {
  Africa: ["Algeria", "Egypt", "Kenya", "Nigeria", "South Africa"],
  Antarctica: ["Antarctic Treaty Area"],
  Asia: ["China", "India", "Japan", "Russia", "South Korea"],
  Australia: ["Australia", "New Zealand", "Papua New Guinea"],
  Europe: ["France", "Germany", "Italy", "Spain", "United Kingdom"],
  "North America": ["Canada", "Mexico", "United States"],
  "South America": ["Argentina", "Brazil", "Chile", "Colombia", "Peru"],
};

// v-model arrays for multi‑select
const selectedContinents = ref<ContinentName[]>([]);
const selectedCountries = ref<string[]>([]);

// compute all countries for the selected continents
const availableCountries = computed(() => {
  if (selectedContinents.value.length === 0) return [];
  // flatten the arrays from each chosen continent
  return (
    selectedContinents.value
      .flatMap((cont) => countryOptions[cont])
      // remove duplicates (just in case)
      .filter((v, i, a) => a.indexOf(v) === i)
  );
});

// Measurement type
const temp = reactive({ from: 10, to: 30, unit: "C" });
const measurements = reactive({
  temperature: true,
});

// Date range
const dateRange = reactive({ from: "", to: "" });

// Time slots
const times = ref<{ from: string; to: string }[]>([]);

// Add and remove time slots
function addSlot() {
  if (times.value.length < 3) {
    times.value.push({ from: "", to: "" });
  }
}

function removeSlot(index: number) {
  times.value.splice(index, 1);
}

// Reset filters
function resetFilters() {
  selectedContinents.value = [];
  selectedCountries.value = [];
  temp.from = 10;
  temp.to = 30;
  temp.unit = "C";
  measurements.temperature = true;
  dateRange.from = "";
  dateRange.to = "";
  times.value = [];
}

// Search action
function search() {
  emit("search", {
    location: {
      continents: selectedContinents.value,
      countries: selectedCountries.value,
    },
    measurements: {
      temperature: measurements.temperature
        ? { from: temp.from, to: temp.to, unit: temp.unit }
        : null,
    },
    dateRange: dateRange,
    times: times.value,
  });
}
</script>

<template>
  <div class="bg-light p-6 rounded-lg flex flex-col h-full max-h-full">
    <!-- Filter Header (fixed at top) -->
    <div class="font-bold text-lg mb-1 shrink-0">Filter By:</div>

    <!-- Scrollable Filter Content Area -->
    <div class="overflow-y-scroll flex-grow flex flex-col pr-6 mb-4">
      <!-- Location: two‑column grid -->
      <div class="mb-2">
        <div class="font-medium mb-1">Location:</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Continent multi‑select -->
          <div>
            <label class="block text-sm font-medium mb-1">Continent:</label>
            <Multiselect
              v-model="selectedContinents"
              :options="continentOptions"
              placeholder="Select continents"
              track-by="this"
              :multiple="true"
              :close-on-select="false"
              :clear-on-select="false"
              :preserve-search="true"
              :custom-label="(option: ContinentName) => option"
              class="bg-white"
            />
          </div>

          <!-- Country multi‑select -->
          <div>
            <label class="block text-sm font-medium mb-1">Country:</label>
            <Multiselect
              v-model="selectedCountries"
              :options="availableCountries"
              placeholder="Select countries"
              track-by="this"
              :multiple="true"
              :close-on-select="false"
              :clear-on-select="false"
              :preserve-search="true"
              :custom-label="(option: string) => option"
              class="bg-white"
              :disabled="selectedContinents.length === 0"
            />
          </div>
        </div>
      </div>

      <!-- Measurement Type -->
      <div class="mb-2">
        <div class="font-medium mb-1">Measurement Type:</div>

        <!-- Temperature checkbox -->
        <div class="flex items-center justify-between mb-2">
          <label class="flex items-center">
            <input
              type="checkbox"
              v-model="measurements.temperature"
              class="mr-2"
            />
            <span>Temperature</span>
          </label>

          <!-- Units moved up here -->
          <div v-if="measurements.temperature" class="flex space-x-2">
            <button
              @click="temp.unit = 'C'"
              :class="{ 'bg-main text-white': temp.unit === 'C' }"
              class="cursor-pointer px-3 py-1 rounded border"
            >
              °C
            </button>
            <button
              @click="temp.unit = 'F'"
              :class="{ 'bg-main text-white': temp.unit === 'F' }"
              class="cursor-pointer px-3 py-1 rounded border"
            >
              °F
            </button>
          </div>
        </div>

        <!-- Temperature range fields with equal widths -->
        <div
          v-if="measurements.temperature"
          class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end"
        >
          <!-- From -->
          <div>
            <label class="block text-sm mb-1">From:</label>
            <input
              type="number"
              v-model.number="temp.from"
              class="w-full border rounded bg-white px-3 py-2"
            />
          </div>

          <!-- To -->
          <div>
            <label class="block text-sm mb-1">To:</label>
            <input
              type="number"
              v-model.number="temp.to"
              class="w-full border rounded bg-white px-3 py-2"
            />
          </div>
        </div>
      </div>

      <!-- Date -->
      <div class="mb-2">
        <div class="font-medium mb-1">Date:</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm mb-1">From:</label>
            <input
              type="date"
              v-model="dateRange.from"
              class="w-full border rounded bg-white px-3 py-2"
            />
          </div>
          <div>
            <label class="block text-sm mb-1">To:</label>
            <input
              type="date"
              v-model="dateRange.to"
              class="w-full border rounded bg-white px-3 py-2"
            />
          </div>
        </div>
      </div>

      <!-- Time -->
      <div class="mb-2">
        <div class="font-medium mb-1">Time:</div>
        <div class="space-y-2">
          <div v-for="(slot, i) in times" :key="i" class="mb-2">
            <!-- Mobile: Remove button above From field -->
            <div class="flex items-center justify-between md:hidden mb-1">
              <label class="block text-sm">From:</label>
              <button
                @click="removeSlot(i)"
                class="p-1 text-gray-700 hover:text-gray-900"
              >
                <MinusIcon class="h-5 w-5" />
              </button>
            </div>

            <!-- Time input fields with equal width -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- From input -->
              <div>
                <label class="sr-only md:not-sr-only block text-sm mb-1"
                  >From:</label
                >
                <input
                  type="time"
                  v-model="slot.from"
                  class="w-full border rounded bg-white px-3 py-2"
                />
              </div>
              <div class="relative">
                <label class="sr-only md:not-sr-only block text-sm mb-1"
                  >To:</label
                >
                <div class="flex items-center gap-2">
                  <input
                    type="time"
                    v-model="slot.to"
                    class="w-full border rounded bg-white px-3 py-2"
                  />
                  <button
                    @click="removeSlot(i)"
                    class="cursor-pointer absolute right-0 top-[-0.6rem] p-1 text-gray-700 hover:text-gray-900"
                  >
                    <MinusIcon class="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            v-if="times.length < 3"
            @click="addSlot"
            class="cursor-pointer flex items-center text-gray-700 hover:text-gray-900 mt-2"
          >
            <PlusIcon class="h-5 w-5 mr-1" />
            Add time slot
          </button>
        </div>
      </div>
    </div>

    <!-- Action Buttons (fixed at bottom) -->
    <div class="flex justify-center space-x-4 mt-auto shrink-0">
      <button
        @click="resetFilters"
        class="cursor-pointer px-6 py-2 border border-gray-300 rounded-full hover:bg-gray-100"
      >
        Reset
      </button>
      <button
        @click="search"
        class="cursor-pointer px-12 py-2 bg-main text-white rounded-full hover:bg-[#0098c4]"
      >
        Search
      </button>
    </div>
  </div>
</template>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
