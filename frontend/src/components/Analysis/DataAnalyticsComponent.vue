<script setup lang="ts">
import {
    drawHistogramWithKDE,
    getGraphData,
    getGraphDataExportMapView,
} from "../../composables/Analysis/DataVisualizationLogic";
import { onMounted, ref, watch } from "vue";
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

onMounted(render);
watch(() => props.location, render);
watch(() => props.month, render);
</script>

<template>
    <div class="bg-default rounded-lg p-4 mb-6 shadow max-w-screen-md mx-auto">
        <h3 class="text-lg font-semibold mb-4">Frequency Analysis</h3>
        <div ref="graph" class="w-full h-64"></div>
    </div>
</template>
