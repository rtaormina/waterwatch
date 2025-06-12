<template>
    <div class="legend-popup">
        <h4 v-if="legendStore.colorByTemp" class="text-lg font-bold mb-2">Average Temperature</h4>
        <h4 v-if="!legendStore.colorByTemp" class="text-lg font-bold mb-2">Number of Measurements</h4>

        <!-- Gradient bar -->
        <div class="relative w-full h-3 rounded overflow-hidden">
            <div
                class="absolute inset-0"
                :style="{
                    background: `linear-gradient(to right, ${props.colors[0]}, ${props.colors[1]})`,
                }"
            ></div>
            <!-- ticks -->
            <div class="absolute inset-0 flex justify-between items-center">
                <span class="w-px h-2 bg-gray-700"></span>
                <span class="w-px h-2 bg-gray-700"></span>
                <span class="w-px h-2 bg-gray-700"></span>
                <span class="w-px h-2 bg-gray-700"></span>
                <span class="w-px h-2 bg-gray-700"></span>
                <span class="w-px h-2 bg-gray-700"></span>
            </div>
        </div>

        <!-- Labels under ticks -->
        <div class="mt-1 mb-2 flex justify-between text-sm text-gray-700">
            <span>
                <span v-if="legendStore.colorByTemp">&leq;</span>
                {{ legendStore.scale[0] }}
                <span v-if="legendStore.colorByTemp">°C</span>
            </span>
            <span>
                {{ legendStore.scale[0] + step }}
                <span v-if="legendStore.colorByTemp">°C</span>
            </span>
            <span>
                {{ legendStore.scale[0] + step * 2 }}
                <span v-if="legendStore.colorByTemp">°C</span>
            </span>
            <span>
                {{ legendStore.scale[0] + step * 3 }}
                <span v-if="legendStore.colorByTemp">°C</span>
            </span>
            <span>
                {{ legendStore.scale[0] + step * 4 }}
                <span v-if="legendStore.colorByTemp">°C</span>
            </span>
            <span>
                &geq;{{ legendStore.scale[1] }}
                <span v-if="legendStore.colorByTemp">°C</span>
            </span>
        </div>

        <div class="flex items-center gap-2">
            <h4 class="text-lg font-bold mb-2 mt-2">Hexagon Coloring</h4>
            <button
                data-testid="info-button-hex"
                @click="toggleInfoTextColoring"
                class="cursor-pointer hover:text-blue-600 transition-colors"
            >
                <InformationCircleIcon class="w-5 h-5" />
            </button>
        </div>
        <div
            data-testid="info-text-hex"
            v-if="showInfoTextColoring"
            class="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800"
        >
            <p>
                Use the buttons below to toggle between the hexagon overlay being colored according to the average
                temperature or the number of measurements in the hexagon.
            </p>
        </div>
        <div class="flex gap-2 w-full">
            <button
                @click="toTempMode"
                :class="{ 'bg-main text-white': legendStore.colorByTemp }"
                class="flex-1 text-center cursor-pointer px-3 rounded border rounded-md"
            >
                Temperature
            </button>
            <button
                data-testid="count"
                @click="toCountMode"
                :class="{ 'bg-main text-white': !legendStore.colorByTemp }"
                class="flex-1 text-center cursor-pointer px-3 rounded border rounded-md"
            >
                Count
            </button>
        </div>

        <!-- Time range selector -->
        <div class="flex items-center gap-2">
            <h4 class="text-lg font-bold mb-2 mt-2">Time Range</h4>
            <button
                data-testid="info-button"
                @click="toggleInfoTextTimeRange"
                class="cursor-pointer hover:text-blue-600 transition-colors"
            >
                <InformationCircleIcon class="w-5 h-5" />
            </button>
        </div>

        <!-- Information text -->
        <div
            data-testid="info-text"
            v-if="showInfoTextTime"
            class="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800"
        >
            <p>
                Time range corresponds to which measurements are displayed on the map. Selecting a month means that all
                measurements taken in that month of any year will be displayed. To view all data ever collected, select
                every month.
            </p>
        </div>

        <div>
            <USelect
                v-model="internalValue"
                :items="items"
                :multiple="isMulti"
                class="w-full"
                @update:model-value="onChange"
                :ui="{
                    content: 'z-[9999]',
                }"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { InformationCircleIcon } from "@heroicons/vue/24/outline";
import { computed, ref } from "vue";
import { useLegendStore } from "../stores/LegendStore";

const legendStore = useLegendStore();
const props = defineProps<{
    colors: string[];
}>();

const emit = defineEmits<{
    (e: "update", value: string | string[]): void;
}>();

const isMulti = computed(() => internalValue.value !== "Past 30 Days");
const internalValue = ref<string | string[]>("Past 30 Days");
const showInfoTextTime = ref(false);
const showInfoTextColoring = ref(false);

/**
 * Toggle the visibility of the information text for the hex coloring
 *
 * @return {void}
 */
function toggleInfoTextColoring() {
    showInfoTextColoring.value = !showInfoTextColoring.value;
}

/**
 * Toggle the visibility of the information text for the time range
 *
 * @return {void}
 */
function toggleInfoTextTimeRange() {
    showInfoTextTime.value = !showInfoTextTime.value;
}

const monthMap = new Map<string, number>([
    ["January", 1],
    ["February", 2],
    ["March", 3],
    ["April", 4],
    ["May", 5],
    ["June", 6],
    ["July", 7],
    ["August", 8],
    ["September", 9],
    ["October", 10],
    ["November", 11],
    ["December", 12],
]);

/**
 * Handles selection of dropdown such that either multiselect of months is possible or
 * only past 30 days is selected and then emits selection
 *
 * @param val updated value that is selected
 * @return {void}
 */
function onChange(val: string | string[]) {
    if (
        (typeof val === "string" && val === "Past 30 Days") ||
        (Array.isArray(val) && (val.length === 0 || val[val.length - 1] === "Past 30 Days"))
    ) {
        internalValue.value = ["Past 30 Days"];
        console.log("0");
        emit("update", [0]);
        return;
    }

    if (typeof val === "string") {
        internalValue.value = [val];
        console.log(monthMap.get(val));
        emit("update", [monthMap.get(val) ?? 0]);
        return;
    }

    if (Array.isArray(val)) {
        const nums = val.map((x) => monthMap.get(x) ?? 0).filter((x) => x != 0);
        console.log(nums);
        internalValue.value = val.filter((x) => x != "Past 30 Days");
        emit("update", nums);

        return;
    }
}

const items = ref([
    "Past 30 Days",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
]);

/**
 * Switch to count mode.
 */
function toCountMode() {
    if (!legendStore.colorByTemp) return;
    legendStore.colorByTemp = false;
}

/**
 * Switch to temperature mode.
 */
function toTempMode() {
    if (legendStore.colorByTemp) return;
    legendStore.colorByTemp = true;
    legendStore.scale = [0, 40];
}

const step = computed(() => (legendStore.scale[1] - legendStore.scale[0]) / 5);
</script>

<style scoped>
.legend-popup {
    position: absolute;
    background-color: #fff;
    border-radius: 0.75rem;
    padding: 1rem;
    box-shadow:
        0 10px 15px -3px rgba(0, 0, 0, 0.1),
        0 4px 6px -4px rgba(0, 0, 0, 0.1);
}

.legend-popup::before {
    content: "";
    position: absolute;
    top: 0.15rem;
    right: 13rem;
    transform: translateY(-100%);
    border-width: 0 0.6rem 0.6rem 0.6rem;
    border-style: solid;
    border-color: transparent transparent white transparent;
    border-radius: 0.75rem;
}
</style>
