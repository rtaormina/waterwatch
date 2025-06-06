<template>
    <div class="legend-popup">
        <h4 class="text-lg font-bold mb-2">Average Temperature</h4>

        <!-- Gradient bar -->
        <div class="relative w-full h-3 rounded overflow-hidden">
            <div
                class="absolute inset-0"
                :style="{
                    background: `linear-gradient(to right, ${colors[0]}, ${colors[1]})`,
                }"
            ></div>
            <!-- ticks -->
            <div class="absolute inset-0 flex justify-between items-center">
                <span class="w-px h-2 bg-gray-700"></span>
                <span class="w-px h-2 bg-gray-700"></span>
                <span class="w-px h-2 bg-gray-700"></span>
                <span class="w-px h-2 bg-gray-700"></span>
                <span class="w-px h-2 bg-gray-700"></span>
            </div>
        </div>

        <!-- Labels under ticks -->
        <div class="mt-1 flex justify-between text-sm text-gray-700">
            <span>&leq;{{ scale[0] }}°C</span>
            <span>{{ scale[0] + step }}°C</span>
            <span>{{ scale[0] + step * 2 }}°C</span>
            <span>{{ scale[0] + step * 3 }}°C</span>
            <span>&geq;{{ scale[1] }}°C</span>
        </div>

        <div>
            <button
                @click="toTempMode"
                :class="{ 'bg-main text-white': colorByTemp }"
                class="cursor-pointer px-3 rounded border"
            >
                Temperature
            </button>
            <button
                @click="toCountMode"
                :class="{ 'bg-main text-white': !colorByTemp }"
                class="cursor-pointer px-3 rounded border"
            >
                Count
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { ref } from "vue";

const colorByTemp = ref(true);

const props = defineProps<{
    colors: string[];
    scale: [number, number];
}>();

const emit = defineEmits<{
    (e: "switch"): void;
}>();

/**
 * Switch to count mode.
 */
function toCountMode() {
    if (!colorByTemp.value) return;
    colorByTemp.value = false;
    emit("switch");
}

/**
 * Switch to temperature mode.
 */
function toTempMode() {
    if (colorByTemp.value) return;
    colorByTemp.value = true;
    emit("switch");
}

const step = computed(() => (props.scale[1] - props.scale[0]) / 4);
const { colors, scale } = props;
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
    right: 1rem;
    transform: translateY(-100%);
    border-width: 0 0.6rem 0.6rem 0.6rem;
    border-style: solid;
    border-color: transparent transparent white transparent;
    border-radius: 0.75rem;
}
</style>
