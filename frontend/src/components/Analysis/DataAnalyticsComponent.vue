<script setup lang="ts">
import {
    drawHistogramWithKDE,
    getGraphData,
    getGraphDataExportMapView,
} from "../../composables/Analysis/DataVisualizationLogic";
import { onMounted, ref, watch } from "vue";
import { XMarkIcon } from "@heroicons/vue/24/outline";
import { useExportStore } from "../../stores/ExportStore";

const exportStore = useExportStore();

const props = defineProps({
    location: {
        type: String,
    },
    month: {
        type: String,
    },
    fromExport: {
        type: Boolean,
        default: false,
    },
});

const graph = ref<HTMLElement | null>(null);
/**
 * Renders the histogram using the provided data.
 */
async function render() {
    if (!graph.value) return;

    const filters = JSON.parse(JSON.stringify(exportStore.filters));
    const values = props.fromExport
        ? await getGraphDataExportMapView(filters, props.location, props.month)
        : await getGraphData(props.location, props.month);

    drawHistogramWithKDE(graph.value, values, "steelblue", "orange", {
        barOpacity: 0.5,
    });
}

const emit = defineEmits(["close"]);

onMounted(render);
watch(() => props.location, render);
watch(() => props.month, render);
</script>

<template>
    <div class="bg-default mx-4 pt-4 h-full md:p-4 overflow-y-auto box-border">
        <h1
            class="bg-main text-lg font-bold text-inverted rounded-lg p-4 mb-6 mt-2 shadow max-w-screen-md mx-auto flex items-center justify-between"
        >
            Data Analytics
            <button class="bg-main rounded-md p-1 text-inverted hover:cursor-pointer" @click="emit('close')">
                <XMarkIcon class="w-10 h-10" />
            </button>
        </h1>
        <div class="bg-default rounded-lg p-4 mb-6 shadow max-w-screen-md mx-auto">
            <h3 class="text-lg font-semibold mb-4">Frequency Analysis</h3>
            <div ref="graph" class="w-full h-64"></div>
        </div>
    </div>
</template>
