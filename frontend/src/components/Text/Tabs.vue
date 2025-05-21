<template>
  <USelect v-model="activeTab" :items :class="cssClass" v-if="smallScreen" />
  <UTabs
    v-else
    v-model="activeTab"
    :items
    :class="cssClass"
    variant="link"
    color="primary"
    :ui="{
      label: 'text-balance',
    }"
  />
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
    value: string;
  }[];
  switchPoint?: number;
  class?: string;
}>();
const activeTab = defineModel("activeTab", {
  type: String,
  default: "",
});

const windowSize = useWindowSize();

const smallScreen = computed<boolean>(() => {
  return windowSize.width.value < switchPoint;
});
</script>
