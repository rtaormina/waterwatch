<template>
    <div class="bg-elevated rounded-lg p-4 mb-6 shadow max-w-screen-md mx-auto">
        <h3 class="text-lg font-semibold mb-4 flex items-baseline">
            <span>{{ title }}</span>
            <span v-if="optional" class="ml-2 text-gray-500 italic text-sm">(optional)</span>
        </h3>
        <slot />
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{ title: string; optional?: boolean }>();
const { title, optional = false } = props;
</script>
