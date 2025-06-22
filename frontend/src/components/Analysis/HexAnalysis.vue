<template>
    <div class="bg-default text-center">
        <h4 data-testid="count" class="font-bold mt-2">{{ count }} Measurement{{ count === 1 ? "" : "s" }}</h4>
        <p data-testid="avg">Avg: {{ avgTemp }}°C</p>
        <p data-testid="min">Min: {{ minTemp }}°C</p>
        <p data-testid="max">Max: {{ maxTemp }}°C</p>

        <button
            data-testid="submit"
            class="bg-main text-inverted px-2 py-1 rounded hover:cursor-pointer"
            @click="
                props.onOpenDetails();
                props.onClose();
            "
        >
            See Details
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
interface Props {
    points: { o: { temperature: number; min: number; max: number; count: number } }[];
    onOpenDetails: () => void;
    onClose: () => void;
}
const props = defineProps<Props>();

const count = computed(() => props.points.reduce((sum, p) => sum + p.o.count, 0));
const avgTemp = computed(() => {
    return (
        props.points.reduce((sum, p) => sum + p.o.temperature * p.o.count, 0) /
        props.points.reduce((sum, p) => sum + p.o.count, 0)
    ).toFixed(1);
});
const minTemp = computed(() => {
    return Math.min(...props.points.map((p) => p.o.min)).toFixed(1);
});
const maxTemp = computed(() => {
    return Math.max(...props.points.map((p) => p.o.max)).toFixed(1);
});
</script>
