<script setup lang="ts">
import { onMounted } from 'vue'
import { useLogin } from '@/composables/LoginLogic'

const { isLoggedIn } = useLogin()

onMounted(async () => {
  await isLoggedIn()
})
</script>

<template>

  <router-view />

</template>
