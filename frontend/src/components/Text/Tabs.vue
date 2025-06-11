<template>
    <UAccordion v-if="smallScreen" :items>
        <template v-for="item in items" :key="item.slot" #[item.slot]>
            <div>
                <slot :name="item.slot"></slot>
            </div>
        </template>
    </UAccordion>
    <UTabs
        v-else
        :items
        :class="cssClass"
        variant="link"
        color="primary"
        :ui="{
            label: 'text-balance',
            trigger: 'grow cursor-pointer',
        }"
    >
        <template v-for="item in items" :key="item.slot" #[item.slot]>
            <div class="mx-4 md:mx-8 width-full">
                <slot :name="item.slot" />
            </div>
        </template>
    </UTabs>
</template>

<script setup lang="ts">
import { useWindowSize } from "@vueuse/core";
import { computed } from "vue";

const cssClass = computed(() => {
    return props.class ?? "w-full mb-4";
});

const { switchPoint = 800, ...props } = defineProps<{
    items: {
        label: string;
        slot: string;
    }[];
    switchPoint?: number;
    class?: string;
}>();

const windowSize = useWindowSize();

const smallScreen = computed<boolean>(() => {
    return windowSize.width.value < switchPoint;
});
</script>
