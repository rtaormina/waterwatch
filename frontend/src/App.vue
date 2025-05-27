<script setup lang="ts">
import { onMounted } from "vue";
import { useLogin } from "@/composables/LoginLogic";

const { isLoggedIn } = useLogin();

onMounted(async () => {
    await isLoggedIn();
});
</script>

<template>
    <UApp>
        <div class="w-full h-screen flex flex-col">
            <NavBar />

            <!-- take up all leftover space under the navbar -->
            <div class="flex-1 min-h-0 overflow-auto">
                <RouterView />
            </div>
        </div>
    </UApp>
</template>
