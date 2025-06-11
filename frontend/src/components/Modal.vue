<template>
    <div v-if="visible" class="fixed inset-0 g-black/5 backdrop-blur-sm flex items-center justify-center z-50">
        <div class="bg-default rounded-lg p-6 max-w-md w-full shadow-lg relative max-h-[90vh] overflow-y-auto">
            <div class="whitespace-normal break-words">
                <slot />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    visible: boolean;
}>();
</script>

<style scoped>
/* Optional: you can customize the styles here */
</style>
