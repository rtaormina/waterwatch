<template>
    <UCard
        class="override-card absolute z-9 bg-default/70 backdrop-blur-sm shadow-lg rounded-md p-0 md:top-4 md:bottom-auto md:w-[36rem] md:max-w-[36rem] md:block bottom-8 w-100 max-w-100"
        style="left: 50%; transform: translateX(-50%)"
    >
        <div class="flex items-center justify-between">
            <UButton
                class="font-medium flex justify-center items-center cursor-pointer disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted md:px-4 md:py-2 md:w-40 md:text-base px-2 py-1 w-30 text-sm whitespace-nowrap"
                @click="props.leftButton.onButtonClick"
            >
                {{ props.leftButton.label }}
            </UButton>
            <span class="font-semibold text-highlighted md:text-lg text-sm whitespace-nowrap">
                {{ props.centerLabel }}
            </span>
            <UButton
                class="font-medium flex justify-center items-center cursor-pointer disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted md:px-4 md:py-2 md:w-40 md:text-base px-2 py-1 w-30 text-sm whitespace-nowrap"
                :disabled="props.rightButtonDisabled"
                @click="props.rightButton.onButtonClick"
            >
                {{ props.rightButton.label }}
            </UButton>
        </div>
    </UCard>
</template>

<style>
.override-card ::v-deep .p-4 {
    padding: 1rem !important;
}
.override-card ::v-deep .sm\:p-6 {
    padding: 1rem !important;
}
</style>

<script setup lang="ts">
type ButtonProps = {
    label: string;
    onButtonClick: () => void;
};

const props = defineProps<{
    leftButton: ButtonProps;
    rightButton: ButtonProps;
    rightButtonDisabled: boolean;
    centerLabel: string;
}>();
</script>
