<script setup lang="ts">
import { ref, reactive, watch, onMounted, onUpdated, onBeforeUnmount, computed } from "vue";
import { PlusIcon, MinusIcon, ChevronDownIcon, CheckIcon } from "@heroicons/vue/24/solid";
import { useFilters, type DateRangeFilter, type TemperatureFilter, type TimeSlot } from "@/composables/useFilters";
import { useSearch } from "@/composables/useSearch";

// Define the emits for the component
const emit = defineEmits(["search"]);

// Refs for selected filters
const selectedContinents = ref<string[]>([]);
const selectedCountries = ref<string[]>([]);
const selectedWaterSources = ref<string[]>([]);
const temperatureEnabled = ref(false);
const temperature = reactive<TemperatureFilter>({
    from: "",
    to: "",
    unit: "C",
});
const dateRange = reactive<DateRangeFilter>({
    from: "",
    to: "",
});
const times = ref<TimeSlot[]>([]);

// Initialize the filter states
const {
    continents,
    countriesByContinent,
    loadLocations,
    allCountries,
    continentPlaceholder,
    countryPlaceholder,
    toggleContinent,
    toggleCountry,
    toggleAllContinents,
    toggleAllCountries,
    toggleWaterSource,
    toggleAllWaterSources,
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
} = useFilters(
    selectedContinents,
    selectedCountries,
    selectedWaterSources,
    temperatureEnabled,
    temperature,
    dateRange,
    times,
);

// Reset search function from useSearch composable
const { resetSearch } = useSearch();

// Refs for the filter panel and scrollable area
const filterPanelRef = ref<HTMLElement | null>(null);
const scrollableAreaRef = ref<HTMLElement | null>(null);

// Dropdown state
const continentDropdownOpen = ref(false);
const countryDropdownOpen = ref(false);
const continentWrapperRef = ref<HTMLElement | null>(null);
const countryWrapperRef = ref<HTMLElement | null>(null);
const waterSourceDropdownOpen = ref(false);
const waterSourceWrapperRef = ref<HTMLElement | null>(null);

// Refs for click outside detection
const dropdownMaxHeight = ref(250);

/**
 * Calculate the maximum height for the dropdowns based on the scrollable area.
 * This ensures that the dropdowns do not exceed half the height of the scrollable area,
 * with a minimum height of 120px.
 *
 * @returns {void}
 */
const calculateDropdownHeight = () => {
    if (scrollableAreaRef.value) {
        const scrollableHeight = scrollableAreaRef.value.clientHeight;
        dropdownMaxHeight.value = Math.max(Math.floor(scrollableHeight * 0.5), 120);
    }
};

/**
 * Handle clicks outside the dropdowns
 * This function checks if the click event target is outside the continent, country, and water source dropdowns.
 * If it is, it closes all dropdowns.
 *
 * @param event - The mouse event triggered by clicking outside the dropdowns.
 * @return {void}
 */
const handleClickOutside = (event: MouseEvent): void => {
    // Only process if we have a click outside our components
    if (
        continentWrapperRef.value &&
        !continentWrapperRef.value.contains(event.target as Node) &&
        countryWrapperRef.value &&
        !countryWrapperRef.value.contains(event.target as Node) &&
        waterSourceWrapperRef.value &&
        !waterSourceWrapperRef.value.contains(event.target as Node)
    ) {
        continentDropdownOpen.value = false;
        countryDropdownOpen.value = false;
        waterSourceDropdownOpen.value = false;
    }
};

/**
 * Toggles the continent dropdown visibility.
 * If the continent dropdown is opened, it closes the country and water source dropdowns.
 *
 * @returns {void}
 */
function toggleContinentDropdown() {
    continentDropdownOpen.value = !continentDropdownOpen.value;

    // Close the other dropdown if it's open
    if (continentDropdownOpen.value) {
        countryDropdownOpen.value = false;
        waterSourceDropdownOpen.value = false;
    }
}

/**
 * Toggles the country dropdown visibility.
 * If the country dropdown is opened, it closes the continent and water source dropdowns.
 *
 * @returns {void}
 */
function toggleCountryDropdown() {
    countryDropdownOpen.value = !countryDropdownOpen.value;

    // Close the other dropdown if it's open
    if (countryDropdownOpen.value) {
        continentDropdownOpen.value = false;
        waterSourceDropdownOpen.value = false;
    }
}

/**
 * Toggles the water source dropdown visibility.
 * If the water source dropdown is opened, it closes the continent and country dropdowns.
 *
 * @returns {void}
 */
function toggleWaterSourceDropdown() {
    waterSourceDropdownOpen.value = !waterSourceDropdownOpen.value;

    // Close the other dropdown if it's open
    if (waterSourceDropdownOpen.value) {
        continentDropdownOpen.value = false;
        countryDropdownOpen.value = false;
    }
}

// Functionality to search for countries
const countrySearchQuery = ref("");
const filteredCountries = computed(() => {
    if (!countrySearchQuery.value) return allCountries.value;
    return allCountries.value.filter((country) =>
        country.toLowerCase().includes(countrySearchQuery.value.toLowerCase()),
    );
});

/**
 * Clears the country search query when the country dropdown is closed.
 * This ensures that the search input is reset when the dropdown is not open.
 *
 * @returns {void}
 */
const clearSearchOnClose = () => {
    if (!countryDropdownOpen.value) countrySearchQuery.value = "";
};

watch([countryDropdownOpen], clearSearchOnClose);

/**
 * Resets the filter panel to its initial state.
 * Clears all selected continents, countries, water sources, temperature settings, date range, and time slots.
 *
 * @returns {void}
 */
onMounted(() => {
    calculateDropdownHeight();
    window.addEventListener("resize", calculateDropdownHeight);
    document.addEventListener("mousedown", handleClickOutside);
    loadLocations();
    loadWaterSources();
});

// Recalculate dropdown height on component updates
onUpdated(() => {
    calculateDropdownHeight();
});

// Clean up event listeners on component unmount
onBeforeUnmount(() => {
    window.removeEventListener("resize", calculateDropdownHeight);
    document.removeEventListener("mousedown", handleClickOutside);
});

// Watch for changes in selected continents to update selected countries
watch(selectedContinents, (newList) => {
    selectedCountries.value = Array.from(new Set(newList.flatMap((c) => countriesByContinent.value[c] || [])));
});

/**
 * Resets all filters to their default state.
 * Clears all selected continents, countries, water sources, temperature settings, date range, time slots, and search results.
 *
 * @returns {void}
 */
function reset() {
    selectedContinents.value = [];
    selectedCountries.value = [];
    selectedWaterSources.value = [];
    temperatureEnabled.value = false;
    temperature.from = "";
    temperature.to = "";
    temperature.unit = "C";
    dateRange.from = "";
    dateRange.to = "";
    times.value = [];
    resetSearch();
}

// Expose methods and properties to the parent component
defineExpose({
    getSearchParams,
    temperature,
});
</script>

<template>
    <div class="bg-light p-6 rounded-lg flex flex-col h-full max-h-full" ref="filterPanelRef">
        <!-- Filter Header -->
        <div class="font-bold text-lg mb-2 shrink-0">Filter By</div>

        <!-- Scrollable Filter Content Area -->
        <div class="overflow-y-scroll flex-grow flex flex-col pr-6 mb-4" ref="scrollableAreaRef">
            <!-- Location: two‑column grid -->
            <div class="mb-2">
                <div class="font-semibold mb-1">Location</div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Continent multi‑select -->
                    <div>
                        <label class="block text-sm font-medium mb-1">Continent</label>
                        <div class="relative" ref="continentWrapperRef">
                            <div class="multiselect-custom-wrapper rounded border" @click="toggleContinentDropdown">
                                <span class="multiselect-placeholder" v-if="selectedContinents.length === 0">
                                    {{ continentPlaceholder }}
                                </span>
                                <span class="multiselect-display-text" v-else>
                                    {{ formatContinentSelectionText() }}
                                </span>
                                <span class="multiselect-arrow">
                                    <ChevronDownIcon class="w-5 h-5" />
                                </span>
                            </div>
                            <div
                                v-show="continentDropdownOpen"
                                class="multiselect-custom-dropdown"
                                :style="{ 'max-height': dropdownMaxHeight + 'px' }"
                            >
                                <div
                                    class="multiselect-select-all"
                                    @click.stop="selectedContinents = toggleAllContinents(selectedContinents)"
                                >
                                    {{ selectedContinents.length > 0 ? "Deselect All" : "Select All" }}
                                </div>

                                <div class="multiselect-options">
                                    <div
                                        v-for="continent in continents"
                                        :key="continent"
                                        class="multiselect-option"
                                        :class="{
                                            'multiselect-option-selected': selectedContinents.includes(continent),
                                        }"
                                        @click.stop="
                                            selectedContinents = toggleContinent(selectedContinents, continent)
                                        "
                                    >
                                        <span class="multiselect-option-checkbox">
                                            <CheckIcon
                                                v-if="selectedContinents.includes(continent)"
                                                class="w-5 h-5"
                                                fill="currentColor"
                                            />
                                        </span>
                                        <span>{{ continent }}</span>
                                    </div>
                                </div>

                                <div v-if="continents.length === 0" class="multiselect-no-options">
                                    No continents found.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Country multi‑select -->
                    <div>
                        <label class="block text-sm font-medium mb-1">Country</label>
                        <div class="relative" ref="countryWrapperRef">
                            <div class="multiselect-custom-wrapper rounded border" @click="toggleCountryDropdown">
                                <span class="multiselect-placeholder" v-if="selectedCountries.length === 0">
                                    {{ countryPlaceholder }}
                                </span>
                                <span class="multiselect-display-text" v-else>
                                    {{ formatCountrySelectionText() }}
                                </span>
                                <span class="multiselect-arrow">
                                    <ChevronDownIcon class="w-5 h-5" />
                                </span>
                            </div>

                            <div
                                v-show="countryDropdownOpen"
                                class="multiselect-custom-dropdown"
                                :style="{ 'max-height': dropdownMaxHeight + 'px' }"
                            >
                                <div class="p-2 border-b">
                                    <input
                                        type="text"
                                        v-model="countrySearchQuery"
                                        placeholder="Search countries..."
                                        class="w-full px-3 py-2 border rounded text-sm"
                                        @click.stop
                                    />
                                </div>
                                <div
                                    class="multiselect-select-all"
                                    @click.stop="selectedCountries = toggleAllCountries(selectedCountries)"
                                >
                                    {{ selectedCountries.length > 0 ? "Deselect All" : "Select All" }}
                                </div>

                                <div v-if="allCountries.length === 0" class="multiselect-no-options">
                                    No countries available.
                                    <br />
                                    Please select a continent first.
                                </div>

                                <div v-else class="multiselect-options">
                                    <div
                                        v-for="country in filteredCountries"
                                        :key="country"
                                        id="country-option"
                                        class="multiselect-option"
                                        :class="{
                                            'multiselect-option-selected': selectedCountries.includes(country),
                                        }"
                                        @click.stop="selectedCountries = toggleCountry(selectedCountries, country)"
                                    >
                                        <span class="multiselect-option-checkbox">
                                            <CheckIcon
                                                v-if="selectedCountries.includes(country)"
                                                class="w-5 h-5"
                                                fill="currentColor"
                                            />
                                        </span>
                                        <span>{{ country }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Measurement Type -->
            <div class="mb-2">
                <div class="font-semibold mb-1">Measurement Type</div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-1">
                    <!-- Water source multi‑select -->
                    <div>
                        <label class="block text-sm font-medium mb-1">Water Source</label>
                        <div class="relative" ref="waterSourceWrapperRef">
                            <div class="multiselect-custom-wrapper rounded border" @click="toggleWaterSourceDropdown">
                                <span class="multiselect-placeholder" v-if="selectedWaterSources.length === 0">
                                    {{ waterSourcePlaceholder }}
                                </span>
                                <span class="multiselect-display-text" v-else>
                                    {{ formatWaterSourceSelectionText() }}
                                </span>
                                <span class="multiselect-arrow">
                                    <ChevronDownIcon class="w-5 h-5" />
                                </span>
                            </div>
                            <div
                                v-show="waterSourceDropdownOpen"
                                class="multiselect-custom-dropdown"
                                :style="{ 'max-height': dropdownMaxHeight + 'px' }"
                            >
                                <div
                                    class="multiselect-select-all"
                                    @click.stop="selectedWaterSources = toggleAllWaterSources(selectedWaterSources)"
                                >
                                    {{ selectedWaterSources.length > 0 ? "Deselect All" : "Select All" }}
                                </div>

                                <div class="multiselect-options">
                                    <div
                                        v-for="waterSource in waterSources"
                                        :key="waterSource"
                                        class="multiselect-option"
                                        :class="{
                                            'multiselect-option-selected': selectedWaterSources.includes(waterSource),
                                        }"
                                        @click.stop="
                                            selectedWaterSources = toggleWaterSource(selectedWaterSources, waterSource)
                                        "
                                    >
                                        <span class="multiselect-option-checkbox">
                                            <CheckIcon
                                                v-if="selectedWaterSources.includes(waterSource)"
                                                class="w-5 h-5"
                                                fill="currentColor"
                                            />
                                        </span>
                                        <span>{{ waterSource }}</span>
                                    </div>
                                </div>

                                <div v-if="waterSources.length === 0" class="multiselect-no-options">
                                    No water sources found.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Temperature checkbox -->
                <div class="flex items-center justify-between mb-1">
                    <UCheckbox
                        v-model="temperatureEnabled"
                        label="Temperature"
                        class="mt-2"
                        :ui="{ base: 'bg-white' }"
                    />

                    <!-- Units -->
                    <div v-if="temperatureEnabled" class="flex space-x-2">
                        <button
                            @click="temperature.unit = 'C'"
                            :class="{ 'bg-main text-white': temperature.unit === 'C' }"
                            class="cursor-pointer px-3 rounded border"
                        >
                            °C
                        </button>
                        <button
                            @click="temperature.unit = 'F'"
                            :class="{ 'bg-main text-white': temperature.unit === 'F' }"
                            class="cursor-pointer px-3 rounded border"
                        >
                            °F
                        </button>
                    </div>
                </div>

                <!-- Temperature range fields with equal widths -->
                <div v-if="temperatureEnabled" class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end relative mt-2">
                    <!-- From -->
                    <div>
                        <label class="block text-sm mb-1">From</label>
                        <input
                            type="number"
                            v-model="temperature.from"
                            min="0"
                            max="212"
                            placeholder="Min temperature"
                            class="w-full border rounded bg-white px-3 py-2"
                        />
                    </div>

                    <!-- To -->
                    <div>
                        <label class="block text-sm mb-1">To</label>
                        <input
                            type="number"
                            v-model="temperature.to"
                            min="0"
                            max="212"
                            placeholder="Max temperature"
                            class="w-full border rounded bg-white px-3 py-2"
                        />
                    </div>

                    <p v-if="!tempRangeValid" class="text-red-600 text-sm col-span-1 md:col-span-2 -mt-2">
                        Temperature range is invalid.
                    </p>
                </div>
            </div>

            <!-- Date -->
            <div class="mb-2">
                <div class="font-semibold mb-1">Date</div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm mb-1">From</label>
                        <input type="date" v-model="dateRange.from" class="w-full border rounded bg-white px-3 py-2" />
                    </div>
                    <div>
                        <label class="block text-sm mb-1">To</label>
                        <input type="date" v-model="dateRange.to" class="w-full border rounded bg-white px-3 py-2" />
                    </div>
                    <p v-if="!dateRangeValid" class="text-red-600 text-sm col-span-1 md:col-span-2 -mt-2">
                        Date range is invalid.
                    </p>
                </div>
            </div>

            <!-- Time -->
            <div class="mb-2">
                <div class="font-semibold mb-1">Time</div>
                <div class="space-y-2">
                    <p v-if="!slotsNonOverlapping" class="text-red-600 text-sm">Time slots must not overlap.</p>
                    <div v-for="(slot, i) in times" :key="i" class="mb-2">
                        <!-- Mobile: Remove button above From field -->
                        <div class="flex items-center justify-between md:hidden mb-1">
                            <label class="block text-sm">From</label>
                            <button @click="removeSlot(i)" class="p-1 text-gray-700 hover:text-gray-900">
                                <MinusIcon class="h-5 w-5" />
                            </button>
                        </div>

                        <!-- Time input fields with equal width -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- From input -->
                            <div>
                                <label class="sr-only md:not-sr-only block text-sm mb-1">From:</label>
                                <input
                                    type="time"
                                    v-model="slot.from"
                                    class="w-full border rounded bg-white px-3 py-2"
                                />
                            </div>
                            <div class="relative">
                                <label class="sr-only md:not-sr-only block text-sm mb-1">To:</label>
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
                            <p v-if="!slotValid(slot)" class="text-red-600 text-sm">Time range is invalid.</p>
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

        <!-- Action Buttons -->
        <div class="flex justify-center space-x-4 mt-auto shrink-0">
            <button
                @click="reset"
                class="cursor-pointer px-6 py-2 border border-gray-300 rounded-2xl hover:bg-gray-100 font-semibold text-lg"
            >
                Reset
            </button>
            <button
                @click="emit('search')"
                :disabled="!tempRangeValid || !dateRangeValid || !allSlotsValid || !slotsNonOverlapping"
                :class="
                    tempRangeValid && dateRangeValid && allSlotsValid && slotsNonOverlapping
                        ? 'bg-main cursor-pointer hover:bg-[#0098c4]'
                        : 'bg-gray-300 cursor-not-allowed'
                "
                class="px-12 py-2 text-white rounded-2xl font-semibold text-lg"
            >
                Search
            </button>
        </div>
    </div>
</template>

<style>
.multiselect-custom-wrapper {
    width: 100%;
    min-height: 38px;
    padding: 0 12px;
    display: flex;
    align-items: center;
    position: relative;
    cursor: pointer;
    background-color: white;
    user-select: none;
}

.multiselect-placeholder {
    color: #a0aec0;
}

.multiselect-display-text {
    color: #4a5568;
}

.multiselect-arrow {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #718096;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
}

.multiselect-custom-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background-color: white;
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
    margin-top: 4px;
    box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.06);
    z-index: 50;
    overflow-y: auto;
}

.multiselect-select-all {
    padding: 8px 16px;
    cursor: pointer;
    color: #2c3e50;
    font-weight: 600;
    border-bottom: 1px solid #e8e8e8;
}

.multiselect-select-all:hover {
    background-color: #f8f8f8;
}

.multiselect-options {
    max-height: 250px;
}

.multiselect-option {
    padding: 8px 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
}

.multiselect-option:hover {
    background-color: #f7fafc;
}

.multiselect-option-selected {
    background-color: #ebf8ff;
}

.multiselect-option-checkbox {
    width: 20px;
    height: 20px;
    margin-right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #3182ce;
}

.multiselect-no-options {
    padding: 16px;
    text-align: center;
    color: #718096;
    font-style: italic;
}
</style>
