<script setup lang="ts">
import { drawHistogram } from "@/composables/DataVisualizationLogic";
import { onMounted, ref, watch } from "vue";
import { XMarkIcon } from "@heroicons/vue/24/outline";

const props = defineProps({
    data: {
        type: Array,
    },
});

const graph = ref<HTMLElement | null>(null);

/**
 * Temporari function. Extracts one of the value from the mock data.
 *
 * @param data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNumericValues(data: any[]): number[] {
    return data.map((item) => item.temperature);
}

/**
 * Renders the histogram using the provided data.
 */
function render() {
    if (!graph.value) return;

    const values = getNumericValues(props.data);
    drawHistogram(graph.value, values);
}

const emit = defineEmits(["close"]);

onMounted(render);
watch(() => props.data, render);
</script>

<template>
    <div class="bg-white m-4 p-4 h-full overflow-y-auto box-border">
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
