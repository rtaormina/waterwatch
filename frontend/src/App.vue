<script setup lang="ts">
import { onMounted } from "vue";
import { useLogin } from "@/composables/LoginLogic";

const { isLoggedIn } = useLogin();

onMounted(async () => {
    await isLoggedIn();
});
</script>

<template>
    <UApp :toaster="{ expand: false }">
        <div class="w-full h-screen flex flex-col overflow-hidden">
            <NavBar />

            <!-- this is your only scrollable area -->
            <div class="relative flex-1 overflow-auto min-h-0">
                <RouterView />
            </div>
        </div>
    </UApp>
</template>
