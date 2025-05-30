<template>
    <div class="bg-white text-center">
        <h4 class="font-bold mt-2">{{ count }} Measurements</h4>
        <p>Avg: {{ avgTemp }}°C</p>

        <button
            class="bg-main text-white px-2 py-1 rounded hover:cursor-pointer"
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
    points: { o: { temperature: number } }[];
    onOpenDetails: () => void;
    onClose: () => void;
}
const props = defineProps<Props>();

const count = computed(() => props.points.length);
const avgTemp = computed(() => {
    return (props.points.reduce((sum, p) => sum + p.o.temperature, 0) / props.points.length).toFixed(1);
});
</script>
