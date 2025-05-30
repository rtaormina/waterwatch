<script setup lang="ts">
import { drawHistogram } from "../composables/DataVisualizationLogic";
import { onMounted, ref, watch } from "vue";
import { XMarkIcon } from "@heroicons/vue/24/outline";

const props = defineProps({
    location: {
        type: String,
    },
});

const graph = ref<HTMLElement | null>(null);

/**
 * Fetches numeric values for the given location and returns them.
 *
 * @param {string} location The location for the measurements.
 * @returns the numeric values for the temperatures
 */
async function getGraphData(location: string): Promise<number[]> {
    try {
        const response = await fetch(`/api/measurements/?boundry_geometry=${location}`);
        const data = await response.json();

        console.log("Fetched values:", data);

        return data.map(Number);
    } catch (error) {
        console.error("Error fetching hexbin data:", error);
        return [];
    }
}

/**
 * Renders the histogram using the provided data.
 */
async function render() {
    if (!graph.value) return;

    const values = await getGraphData(props.location);
    drawHistogram(graph.value, values);
}

const emit = defineEmits(["close"]);

onMounted(render);
watch(() => props.location, render);
</script>

<template>
    <div class="bg-white m-4 p-1 md:p-4 h-full overflow-y-auto box-border">
        <h1
            class="bg-main text-lg font-bold text-white rounded-lg p-4 mb-6 mt-2 shadow max-w-screen-md mx-auto flex items-center justify-between"
        >
            Data Analytics
            <button class="bg-main rounded-md p-1 text-white" @click="emit('close')">
                <XMarkIcon class="w-10 h-10" />
            </button>
        </h1>
        <div class="bg-light rounded-lg p-4 mb-6 shadow max-w-screen-md mx-auto">
            <h3 class="text-lg font-semibold mb-4">Frequency analysis</h3>
            <div ref="graph" class="w-full h-64"></div>
        </div>
    </div>
</template>
