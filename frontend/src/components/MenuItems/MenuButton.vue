<template>
    <UTooltip :delay-duration="0" :text="props.tooltip">
        <UButton
            class="bg-main rounded-md p-1 text-inverted hover:cursor-pointer"
            @click="$emit('click')"
            :aria-label="props.tooltip"
        >
            <UIcon :name="props.icon" class="w-10 h-10" />
        </UButton>
    </UTooltip>
</template>

<script setup lang="ts">
const props = defineProps<{
    icon: string;
    tooltip: string;
}>();

defineEmits(["click"]);
</script>
