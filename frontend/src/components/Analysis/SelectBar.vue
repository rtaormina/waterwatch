<template>
    <UCard
        class="override-card absolute z-9 bg-default/70 backdrop-blur-sm shadow-lg rounded-md p-0 md:top-4 md:bottom-auto md:w-[36rem] md:max-w-[36rem] md:block bottom-8 w-100 max-w-100"
        style="left: 50%; transform: translateX(-50%)"
    >
        <div class="flex items-center justify-between gap-3">
            <div class="flex-1">
                <UButton
                    class="bg-primary font-medium flex justify-center items-center cursor-pointer disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted md:px-4 md:py-2 md:w-40 md:text-base px-2 py-1 w-30 text-sm whitespace-nowrap"
                    @click="emit('cancel-select')"
                >
                    Cancel
                </UButton>
            </div>
            <div class="flex-1 flex justify-center items-center">
                <span class="font-semibold text-toned md:text-lg text-sm whitespace-nowrap">Select Hexagons</span>
            </div>
            <div class="flex-1">
                <UButton
                    class="font-medium flex justify-center items-center cursor-pointer disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted md:px-4 md:py-2 md:w-40 md:text-base px-2 py-1 w-30 text-sm whitespace-nowrap"
                    :color="rightButtonColor"
                    :disabled="rightButtonDisabled"
                    @click="emit('select')"
                >
                    Select
                </UButton>
            </div>
        </div>
    </UCard>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
    count: {
        type: Number,
        required: true,
    },
});

const emit = defineEmits<{
    (e: "cancel-select"): void;
    (e: "select"): void;
}>();

const rightButtonDisabled = computed(() => {
    return props.count <= 0;
});

const rightButtonColor = computed(() => {
    return rightButtonDisabled.value ? "neutral" : "primary";
});
</script>

<style scoped>
.override-card ::v-deep .p-4 {
    padding: 1rem !important;
}
.override-card ::v-deep .sm\:p-6 {
    padding: 1rem !important;
}
</style>
