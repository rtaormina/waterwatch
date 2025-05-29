<template>
    <div class="my-6">
        <h2 v-if="title" class="font-bold text-lg">{{ title }}</h2>
        <USeparator v-if="title" class="mb-1" />
        <div class="flex items-top flex-wrap md:flex-nowrap gap-4">
            <div v-if="slots.left" class="w-full md:w-80 md:flex-shrink-0">
                <slot name="left" />
            </div>
            <div v-if="slots.default" class="flex-1">
                <slot />
            </div>
            <div v-if="slots.right" class="w-full md:flex-1 min-w-0">
                <slot name="right" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useSlots } from "vue";
const slots = useSlots();

defineProps({
    title: {
        type: String,
    },
});
</script>
