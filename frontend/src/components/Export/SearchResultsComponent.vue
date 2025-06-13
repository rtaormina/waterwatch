<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, defineProps, computed } from "vue";
import { ArrowDownTrayIcon } from "@heroicons/vue/24/solid";
import Modal from "../Modal.vue";
import { permissionsLogic } from "../../composables/PermissionsLogic";

// Define the logic for permissions
const canDownload = ref(false);
const perms = ref<string[]>([]);

const { fetchPermissions, hasPermission, allPermissions } = permissionsLogic();

// Define the emits for the component
const emit = defineEmits<{
    (e: "update:format", newFormat: typeof props.format): void;
    (e: "download"): void;
    (e: "close-modal"): void;
    (e: "show-on-map"): void;
}>();

// Define the props for the component
interface Props {
    results: { count: number; avgTemp: number };
    searched: boolean;
    isLoading: boolean;
    showModal: boolean;
    filtersOutOfSync: boolean;
    temperatureUnit: "C" | "F";
    format: "csv" | "xml" | "json" | "geojson";
}
const props = defineProps<Props>();

// Computed properties for average temperature conversion and format handling
const avgTempConverted = computed(() => {
    const c = props.results.avgTemp || 0;
    if (props.results.count === 0) {
        return 0;
    }
    return props.temperatureUnit === "F" ? (c * 9) / 5 + 32 : c;
});

// Computed property for model format with two-way binding
const modelFormat = computed({
    /**
     * Getter for the format prop.
     * This allows the component to reactively bind to the format prop.
     *
     * @returns {typeof props.format} The current format prop value.
     */
    get: () => props.format,
    /**
     * Setter for the format prop.
     * This emits an event to update the format prop in the parent component.
     *
     * @param {typeof props.format} val - The new format value to set.
     * @returns {void}
     */
    set: (val: typeof props.format) => {
        emit("update:format", val);
    },
});

// Reference for the wrapper element and total width
const wrapperRef = ref<HTMLElement | null>(null);
const totalWidth = ref(0);

/**
 * Handles the resize event to adjust the total width of the wrapper element.
 * This function is called on component mount and whenever the window is resized.
 *
 * @returns {void}
 */
onMounted(async () => {
    // wait for DOM
    await nextTick();
    /**
     * Measures the width of the wrapper element and updates the totalWidth ref.
     * This function is called on component mount and whenever the window is resized.
     *
     * @returns {void}
     */
    const measure = (): void => {
        if (wrapperRef.value) {
            totalWidth.value = wrapperRef.value.scrollWidth + 100;
        }
    };
    measure();
    window.addEventListener("resize", measure);
    onBeforeUnmount(() => {
        window.removeEventListener("resize", measure);
    });
    await fetchPermissions();
    canDownload.value = hasPermission("measurement_export.can_export");
    perms.value = allPermissions();
});
defineExpose({
    /** Computes the converted average temperature. */
    avgTempConverted,
    /** Two-way bound computed property for the download format. */
    modelFormat,
});
</script>

<template>
    <div class="flex flex-col flex-grow result-component">
        <div class="md:overflow-y-auto space-y-4 px-4 md:pt-6 md:mt-[54px] result-component">
            <h3 class="font-bold text-lg mb-4 hidden md:block">Search Results</h3>
            <h4 class="font-semibold text-lg hidden md:block">Summary</h4>
            <div class="mt-2 space-y-1">
                <!-- Show loading state -->
                <div v-if="isLoading" class="flex justify-center items-center py-4">
                    <div class="flex space-x-1">
                        <div class="w-2 h-2 bg-main rounded-full animate-bounce"></div>
                        <div class="w-2 h-2 bg-main rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                        <div class="w-2 h-2 bg-main rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    </div>
                    <span class="ml-3 text-gray-600">Searching...</span>
                </div>
                <!-- Show results only when search is complete and not loading -->
                <template v-else-if="searched">
                    <div class="flex justify-between">
                        <span>Number of Results:</span>
                        <span data-testid="num-results">{{ props.results.count }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Average Temperature:</span>
                        <span data-testid="avg-temp">
                            {{ avgTempConverted.toFixed(1) }}°{{ props.temperatureUnit }}
                        </span>
                    </div>
                </template>
            </div>
        </div>
        <div class="flex-grow result-component"></div>
        <div class="md:overflow-y-auto flex flex-col items-center mb-4 md:mb-8">
            <button
                data-testid="download-icon"
                @click="emit('download')"
                :disabled="!canDownload || !searched || props.filtersOutOfSync || props.isLoading"
                class="flex items-center justify-center md:min-h-0 md:min-w-0 w-25 h-25 max-h-25 max-w-25 stroke-current stroke-[1.25] mb-4 transition-colors duration-200 disabled:cursor-not-allowed disabled:text-gray-400 enabled:cursor-pointer enabled:text-gray-800 enabled:hover:text-gray-600"
            >
                <ArrowDownTrayIcon class="w-full h-full" />
            </button>
            <div class="w-11/12 md:w-9/12 flex items-center justify-between space-x-2 mb-4">
                <label for="format" class="font-semibold">Download as</label>
                <select
                    data-testid="format"
                    v-model="modelFormat"
                    class="flex-1 border rounded bg-white px-3 py-2"
                    :disabled="!canDownload"
                >
                    <option value="csv">CSV</option>
                    <option value="xml">XML</option>
                    <option value="json">JSON</option>
                    <option value="geojson">GeoJSON</option>
                </select>
            </div>
            <button
                @click="emit('show-on-map')"
                :disabled="!canDownload || !searched || props.filtersOutOfSync"
                class="w-11/12 md:w-9/12 py-3 text-white rounded-2xl font-semibold text-lg mb-3"
                :class="
                    canDownload && searched && !props.filtersOutOfSync
                        ? 'bg-main cursor-pointer hover:bg-[#0098c4]'
                        : 'bg-gray-300 cursor-not-allowed'
                "
            >
                See Results on Map
            </button>
            <button
                @click="emit('download')"
                :disabled="!canDownload || !searched || props.filtersOutOfSync || props.isLoading"
                class="w-11/12 md:w-9/12 py-3 text-white rounded-2xl font-semibold text-lg"
                :class="
                    canDownload && searched && !props.filtersOutOfSync && !props.isLoading
                        ? 'bg-main cursor-pointer hover:bg-[#0098c4]'
                        : 'bg-gray-300 cursor-not-allowed'
                "
            >
                Download
            </button>
            <Modal data-testid="export-failed-modal" :visible="props.showModal" @close="emit('close-modal')">
                <h2 class="text-lg font-semibold mb-4">Export Failed</h2>
                <div class="flex items-center mt-4 gap-2">
                    <button
                        @click="emit('close-modal')"
                        class="flex-1 bg-main text-white mr-2 px-4 py-2 rounded hover:cursor-pointer hover:bg-primary-light"
                    >
                        Okay
                    </button>
                </div>
            </Modal>
        </div>
    </div>
</template>
<style>
@media (max-height: 500px) {
    .result-component {
        padding: 0.5rem !important;
        overflow-y: visible !important;
        height: auto !important;
    }

    .result-component .font-bold {
        font-size: 1rem !important;
        margin-bottom: 0.5rem !important;
        line-height: 1.25rem;
    }

    .result-component .font-semibold {
        font-size: 0.875rem !important;
        margin-bottom: 0.25rem !important;
    }

    .result-component label.block.text-sm {
        font-size: 0.75rem !important;
        margin-bottom: 0.25rem !important;
    }

    .result-component .gap-4 {
        gap: 0.5rem !important;
    }
    .result-component .gap-2 {
        gap: 0.25rem !important;
    }

    .result-component .mb-2 {
        margin-bottom: 0.25rem !important;
    }
    .result-component .mb-4 {
        margin-bottom: 0.5rem !important;
    }

    .result-component .text-sm {
        font-size: 0.625rem !important;
    }

    .result-component svg.h-5,
    .result-component svg.w-5 {
        height: 0.75rem !important;
        width: 0.75rem !important;
    }
}
</style>
