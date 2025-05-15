<template>
  <div v-if="visible" class="fixed inset-0 g-black/5 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full shadow-lg relative">
      <button @click="$emit('close')" class="absolute top-2 right-2 text-gray-600 hover:text-black">

      </button>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
}>()
</script>

<style scoped>
/* Optional: you can customize the styles here */
</style>
