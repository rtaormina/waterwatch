<script setup lang="ts">
defineProps<{
    title: string;
}>();
const emit = defineEmits<{
    (e: "close"): void;
}>();
import { XMarkIcon } from "@heroicons/vue/24/outline";
</script>

<template>
    <div class="mx-4 p-1 flex flex-col h-full overflow-visible box-border md:p-4 md:block md:overflow-y-auto">
        <h1
            class="bg-primary text-lg font-bold text-inverted rounded-lg p-4 mb-6 mt-2 shadow w-full md:max-w-screen-md md:mx-auto flex items-center justify-between"
        >
            {{ title }}
            <button
                class="bg-primary rounded-md p-1 text-inverted hover:cursor-pointer"
                @click="emit('close')"
                aria-label="close sidebar"
            >
                <XMarkIcon class="w-10 h-10" />
            </button>
        </h1>
        <slot />
    </div>
</template>
