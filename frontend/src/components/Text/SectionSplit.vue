<template>
  <div class="my-6">
    <h2 v-if="title" class="font-bold text-lg">{{ title }}</h2>
    <USeparator v-if="title" />
    <div class="relative flex gap-4">
      <div class="flex-1">
        <slot name="left" />
      </div>
      <div class="flex-1">
        <slot name="right" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
  },
});
</script>
