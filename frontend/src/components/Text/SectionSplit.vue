<template>
  <div class="my-6">
    <h2 v-if="title" class="font-bold text-lg">{{ title }}</h2>
    <USeparator v-if="title" />
    <div class="relative flex gap-4">
      <div v-if="slots.left" class="flex-1">
        <slot name="left" />
      </div>
      <div v-if="slots.default" class="flex-1">
        <slot />
      </div>
      <div v-if="slots.right" class="flex-1">
        <slot name="right" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'
const slots = useSlots()

defineProps({
  title: {
    type: String,
  },
});
</script>
