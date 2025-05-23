<template>
    <div class="my-6">
        <h2 v-if="title" class="font-bold text-lg">{{ title }}</h2>
        <USeparator v-if="title" />
        <slot />
    </div>
</template>

<script setup lang="ts">
defineProps({
    title: {
        type: String,
    },
});
</script>
