<script setup lang="ts">
import { onMounted } from 'vue'
import { useLogin } from '@/composables/LoginLogic'

const { isLoggedIn } = useLogin()

onMounted(async () => {
  await isLoggedIn()
})
</script>

<template>
  <UApp>
    <RouterView />
  </UApp>
</template>
