<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, defineProps, computed } from "vue";
import { ArrowDownTrayIcon } from "@heroicons/vue/24/solid";
import Modal from "./Modal.vue";
import { permissionsLogic } from "../composables/PermissionsLogic";

// Define the logic for permissions
const canDownload = ref(false);
const perms = ref<string[]>([]);

const { fetchPermissions, hasPermission, allPermissions } = permissionsLogic();

// Define the emits for the component
const emit = defineEmits<{
    (e: "update:format", newFormat: typeof props.format): void;
    (e: "download"): void;
    (e: "close-modal"): void;
}>();

// Define the props for the component
interface Props {
    results: { count: number; avgTemp: number };
    searched: boolean;
    showModal: boolean;
    filtersOutOfSync: boolean;
    temperatureUnit: "C" | "F";
    format: "csv" | "xml" | "json" | "geojson";
}
const props = defineProps<Props>();

// Computed properties for average temperature conversion and format handling
const avgTempConverted = computed(() => {
    const c = props.results.avgTemp || 0;
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
    <div class="flex flex-col flex-grow min-h-0">
        <div class="md:overflow-y-auto space-y-4 px-4 md:pt-6 md:mt-[54px]">
            <h3 class="font-bold text-lg mb-4 hidden md:block">Search Results</h3>
            <h4 class="font-semibold text-lg hidden md:block">Summary</h4>
            <div class="mt-2 space-y-1">
                <div v-if="searched" class="flex justify-between">
                    <span>Number of Results:</span>
                    <span data-testid="num-results">{{ props.results.count }}</span>
                </div>
                <div v-if="searched" class="hidden md:flex md:justify-between">
                    <span>Average Temperature:</span>
                    <span data-testid="avg-temp">{{ avgTempConverted.toFixed(1) }}°{{ props.temperatureUnit }}</span>
                </div>
            </div>
        </div>
        <div class="flex-grow"></div>
        <div class="md:overflow-y-auto flex flex-col items-center mb-4 md:mb-8">
            <button
                data-testid="download-icon"
                @click="emit('download')"
                :disabled="!canDownload || !searched || props.filtersOutOfSync"
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
                @click="emit('download')"
                :disabled="!canDownload || !searched || props.filtersOutOfSync"
                class="w-11/12 md:w-9/12 py-3 text-white rounded-2xl font-semibold text-lg"
                :class="
                    canDownload && searched && !props.filtersOutOfSync
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
