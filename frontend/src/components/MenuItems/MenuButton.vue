<template>
    <UTooltip :delay-duration="0" :text="props.tooltip">
        <UButton
            class="bg-main rounded-md p-1 text-inverted hover:cursor-pointer"
            :data-testid="props.testid"
            @click="$emit('click')"
            :aria-label="props.tooltip"
        >
            <UIcon :name="props.icon" class="w-10 h-10" />
            <label v-if="props.label" class="leading-none mr-2 whitespace-nowrap text-2xl">{{ props.label }}</label>
        </UButton>
    </UTooltip>
</template>

<script setup lang="ts">
const props = defineProps<{
    icon: string;
    tooltip: string;
    label?: string;
    testid?: string;
}>();

defineEmits(["click"]);
</script>
