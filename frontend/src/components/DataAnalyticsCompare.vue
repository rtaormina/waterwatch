<script setup lang="ts">
import { onMounted, watch, ref, nextTick } from "vue";
import { getGraphData, drawHistogramWithKDE, drawOverlayedKDE } from "../composables/DataVisualizationLogic";
import { XMarkIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/vue/24/outline";

const props = defineProps<{
    group1WKT: string;
    group2WKT: string;
}>();

const graph1 = ref<HTMLElement | null>(null);
const graph2 = ref<HTMLElement | null>(null);
const graphOverlay = ref<HTMLElement | null>(null);

// Track which accordion items are open
const openItems = ref<Set<string>>(new Set(["overlaid"]));

/**
 * Toggles the visibility of an accordion item.
 *
 * @param itemKey The key of the accordion item to toggle.
 * @return {void}
 */
function toggleAccordion(itemKey: string) {
    if (openItems.value.has(itemKey)) {
        openItems.value.delete(itemKey);
    } else {
        openItems.value.add(itemKey);
    }
    // Trigger reactivity
    openItems.value = new Set(openItems.value);

    // Re-render graphs after DOM updates
    nextTick(() => {
        renderCompare();
    });
}

/**
 * Checks if an accordion item is currently open.
 *
 * @param itemKey The key of the accordion item to check.
 * @return {boolean} True if the item is open, false otherwise.
 */
function isOpen(itemKey: string): boolean {
    return openItems.value.has(itemKey);
}

/**
 * Renders the comparison graphs for the two groups and the graphs for each group separately.
 * This function fetches the data for each group, checks which accordion items are open,
 * and draws the appropriate graphs using the provided data.
 *
 * @return {Promise<void>} A promise that resolves when the graphs are rendered.
 */
async function renderCompare() {
    // Wait for DOM to be ready
    await nextTick();

    // Get separate arrays
    const [vals1, vals2] = await Promise.all([getGraphData(props.group1WKT), getGraphData(props.group2WKT)]);

    // Only render graphs that are currently visible (accordion open)
    if (isOpen("overlaid") && graphOverlay.value) {
        // Small delay to ensure element is fully rendered
        setTimeout(() => {
            if (graphOverlay.value) {
                drawOverlayedKDE(graphOverlay.value, vals1, vals2, {
                    barOpacity: 0.15,
                    barColor1: "steelblue",
                    lineColor1: "steelblue",
                    barColor2: "crimson",
                    lineColor2: "crimson",
                });
            }
        }, 50);
    }

    if (isOpen("group1") && graph1.value) {
        setTimeout(() => {
            if (graph1.value) {
                drawHistogramWithKDE(graph1.value, vals1, "steelblue", "orange", {
                    barOpacity: 0.5,
                });
            }
        }, 50);
    }

    if (isOpen("group2") && graph2.value) {
        setTimeout(() => {
            if (graph2.value) {
                drawHistogramWithKDE(graph2.value, vals2, "crimson", "orange", {
                    barOpacity: 0.5,
                });
            }
        }, 50);
    }
}

/**
 * Lifecycle hook to render the comparison graphs when the component is mounted.
 * It uses a timeout to ensure the DOM is ready before rendering.
 */
onMounted(() => {
    // Initial render with delay to ensure DOM is ready
    setTimeout(renderCompare, 100);
});

// Watch for changes in the WKT strings and re-render the graphs
watch(
    () => [props.group1WKT, props.group2WKT],
    () => {
        setTimeout(renderCompare, 50);
    },
);
</script>

<template>
    <div
        class="bg-white m-4 p-1 md:p-4 h-full overflow-y-scroll overflow-x-hidden box-border"
        style="scrollbar-width: thin"
    >
        <h1
            class="bg-main text-lg font-bold text-white rounded-lg p-4 mb-6 mt-2 shadow max-w-screen-md mx-auto flex items-center justify-between"
        >
            Compare Distributions
            <button class="bg-main rounded-md p-1 text-white hover:cursor-pointer" @click="$emit('close')">
                <XMarkIcon class="w-10 h-10" />
            </button>
        </h1>

        <div class="max-w-screen-md mx-auto space-y-2">
            <!-- Overlaid KDEs Accordion Item -->
            <div class="border border-gray-200 rounded-lg">
                <button
                    @click="toggleAccordion('overlaid')"
                    class="w-full flex items-center justify-between p-4 text-left text-sm font-semibold bg-gray-50 hover:bg-gray-100 rounded-t-lg cursor-pointer transition-colors"
                    :class="{ 'rounded-b-lg': !isOpen('overlaid') }"
                >
                    <span>Frequency Analysis: Group 1 and Group 2</span>
                    <ChevronUpIcon v-if="isOpen('overlaid')" class="w-5 h-5" />
                    <ChevronDownIcon v-else class="w-5 h-5" />
                </button>
                <div v-if="isOpen('overlaid')" class="p-4 border-t border-gray-200">
                    <div class="bg-white rounded-lg p-4 shadow">
                        <div ref="graphOverlay" class="w-full h-64"></div>
                    </div>
                </div>
            </div>

            <!-- Group 1 Accordion Item -->
            <div class="border border-gray-200 rounded-lg">
                <button
                    @click="toggleAccordion('group1')"
                    class="w-full flex items-center justify-between p-4 text-left text-sm font-semibold bg-gray-50 hover:bg-gray-100 rounded-t-lg cursor-pointer transition-colors"
                    :class="{ 'rounded-b-lg': !isOpen('group1') }"
                >
                    <span>Frequency Analysis: Group 1</span>
                    <ChevronUpIcon v-if="isOpen('group1')" class="w-5 h-5" />
                    <ChevronDownIcon v-else class="w-5 h-5" />
                </button>
                <div v-if="isOpen('group1')" class="p-4 border-t border-gray-200">
                    <div class="bg-white rounded-lg p-4 shadow">
                        <div ref="graph1" class="w-full h-64"></div>
                    </div>
                </div>
            </div>

            <!-- Group 2 Accordion Item -->
            <div class="border border-gray-200 rounded-lg">
                <button
                    @click="toggleAccordion('group2')"
                    class="w-full flex items-center justify-between p-4 text-left text-sm font-semibold bg-gray-50 hover:bg-gray-100 rounded-t-lg cursor-pointer transition-colors"
                    :class="{ 'rounded-b-lg': !isOpen('group2') }"
                >
                    <span>Frequency Analysis: Group 2</span>
                    <ChevronUpIcon v-if="isOpen('group2')" class="w-5 h-5" />
                    <ChevronDownIcon v-else class="w-5 h-5" />
                </button>
                <div v-if="isOpen('group2')" class="p-4 border-t border-gray-200">
                    <div class="bg-white rounded-lg p-4 shadow">
                        <div ref="graph2" class="w-full h-64"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
