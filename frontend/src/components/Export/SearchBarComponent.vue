<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { usePresets, type Preset } from "../../composables/usePresets";

const { presets, loading, error, loadPresets, filterPresets } = usePresets();

const props = defineProps<{
    query: string;
    searchDisabled?: boolean;
}>();

const emit = defineEmits<{
    search: [];
    "apply-preset": [preset: Preset];
}>();

const inputQuery = ref(props.query);
const showDropdown = ref(false);

// Computed property for filtered presets
const filteredPresets = computed(() => {
    // If input is empty and dropdown is shown, show all presets
    if (!inputQuery.value.trim() && showDropdown.value) {
        return presets.value;
    }

    // If input has value, filter presets
    if (inputQuery.value.trim()) {
        return filterPresets(inputQuery.value);
    }

    return [];
});

const showNoResults = computed(() => {
    return inputQuery.value.trim() && filteredPresets.value.length === 0 && !loading.value;
});

// Watch for prop changes
watch(
    () => props.query,
    (newValue) => {
        inputQuery.value = newValue;
    },
);

/**
 * Clears the search input and hides the dropdown.
 * This function is called when the clear button is clicked.
 *
 * @returns {void}
 */
function clearSearch() {
    inputQuery.value = "";
}

/**
 * Applies the selected preset and emits an event to the parent component.
 * This function is called when a preset is clicked in the dropdown.
 *
 * @param {Preset} preset - The preset to apply.
 * @returns {void}
 */
function applyPreset(preset: Preset) {
    emit("apply-preset", preset);
    clearSearch();
}

/**
 * Handles the search action when the search button is clicked or Enter key is pressed.
 * This emits a search event to the parent component.
 *
 * @returns {void}
 */
function handleSearch() {
    emit("search");
}

/**
 * Handles input focus event to show the dropdown and load presets if not already loaded.
 *
 * @returns {void}
 */
function handleFocus() {
    showDropdown.value = true;
    // Load presets if not already loaded
    if (presets.value.length === 0 && !loading.value) {
        loadPresets();
    }
}

/**
 * Handles input blur event to hide the dropdown after a short delay.
 * This allows for click events on dropdown items to register before hiding.
 *
 * @returns {void}
 */
function handleBlur() {
    setTimeout(() => {
        showDropdown.value = false;
    }, 200);
}

/**
 * Handles keyboard events for the search input.
 *
 * @param event - The keyboard event.
 * @returns {void}
 */
function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
        handleSearch();
    }
    if (event.key === "Escape") {
        showDropdown.value = false;
    }
}

// Load presets on component mount
loadPresets();

defineExpose({
    clearSearch,
    applyPreset,
    handleSearch,
    handleFocus,
    handleBlur,
    handleKeydown,
});
</script>

<template>
    <div class="relative w-full">
        <div class="flex items-center">
            <UInput
                v-model="inputQuery"
                placeholder="Search for presets..."
                size="lg"
                :ui="{
                    base: 'relative',
                }"
                @focus="handleFocus"
                @blur="handleBlur"
                @keydown="handleKeydown"
                class="flex-1"
                data-testid="search-input"
            >
                <template #trailing>
                    <div class="flex items-center gap-1">
                        <UButton
                            @mousedown.prevent
                            @click="clearSearch"
                            variant="ghost"
                            size="xs"
                            icon="i-heroicons-x-mark-20-solid"
                            aria-label="Clear search"
                            class="cursor-pointer"
                            data-testid="clear-search-bar-button"
                        />
                        <UButton
                            @click="handleSearch"
                            :disabled="props.searchDisabled"
                            variant="solid"
                            size="xs"
                            icon="i-heroicons-magnifying-glass-20-solid"
                            :class="{
                                '!bg-gray-300 cursor-not-allowed': props.searchDisabled,
                                'bg-main cursor-pointer hover:bg-[#0098c4]': !props.searchDisabled,
                            }"
                            aria-label="Search"
                            data-testid="search-bar-button"
                        />
                    </div>
                </template>
            </UInput>
        </div>

        <!-- Preset Dropdown -->
        <div
            v-if="showDropdown"
            data-testid="preset-dropdown"
            class="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-md shadow-lg z-50 max-h-[50vh] overflow-y-scroll mt-1"
        >
            <div v-if="loading" class="px-4 py-3 text-gray-500 text-sm flex items-center gap-2">
                <UIcon name="i-heroicons-arrow-path-20-solid" class="animate-spin" />
                Loading presets...
            </div>
            <div v-else-if="error" class="px-4 py-3 text-red-500 text-sm">
                <UIcon name="i-heroicons-exclamation-triangle-20-solid" class="inline mr-2" />
                {{ error }}
            </div>
            <div v-else-if="showNoResults" class="px-4 py-3 text-gray-500 text-sm">
                <UIcon name="i-heroicons-magnifying-glass-20-solid" class="inline mr-2" />
                No presets found
            </div>
            <div v-else-if="filteredPresets.length > 0">
                <div
                    v-for="preset in filteredPresets"
                    :key="preset.id"
                    class="px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                    @click="applyPreset(preset)"
                    data-testid="preset-item"
                >
                    <div class="flex items-start justify-between">
                        <div class="flex-1 min-w-0">
                            <div class="font-medium text-sm text-gray-900 truncate">
                                {{ preset.name }}
                            </div>
                            <div v-if="preset.description" class="text-xs text-gray-600 mt-1 line-clamp-2">
                                {{ preset.description }}
                            </div>
                        </div>
                        <UIcon
                            name="i-heroicons-chevron-right-20-solid"
                            class="h-4 w-4 text-gray-400 ml-2 flex-shrink-0"
                        />
                    </div>
                </div>
            </div>
            <div v-else-if="!inputQuery.trim()" class="px-4 py-3 text-gray-500 text-sm flex items-center">
                <UIcon name="i-heroicons-x-circle-20-solid" class="mr-2" data-testid="empty-state-icon" />
                <span data-testid="no-presets-message">No presets available.</span>
            </div>
        </div>
    </div>
</template>
