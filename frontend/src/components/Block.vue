<template>
    <div class="bg-muted rounded-lg p-4 mb-6 shadow max-w-screen-md mx-auto">
        <h3 class="text-lg font-semibold mb-4">{{ title }}</h3>
        <slot />
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{ title: string; optional?: boolean }>();
const { title, optional = false } = props;
</script>
