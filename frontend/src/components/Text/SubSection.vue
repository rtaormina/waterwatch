<template>
    <div class="my-4">
        <h3 v-if="title" class="font-bold">{{ title }}</h3>

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
