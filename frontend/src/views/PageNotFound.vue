<template>
    <div class="max-w-2xl h-full flex flex-col justify-center mx-auto">
        <div class="text-center">
            <h1 class="text-9xl font-bold text-highlight mb-4">404</h1>
            <p class="text-2xl text-muted mb-6">Page Not Found</p>
            <p class="text-dimmed mb-8">Oops! It seems this part of WATERWATCH is yet to be discovered.</p>
        </div>

        <div class="flex flex-col sm:flex-row mx-4 gap-4 justify-center">
            <UButton
                v-if="has_history"
                @click="goBack"
                size="xl"
                icon="i-heroicons-arrow-left-20-solid"
                class="border bg-default text-md border-primary justify-center text-default px-4 py-2 rounded hover:bg-accented hover:cursor-pointer"
                label="Go Back"
                data-testid="go-back-button"
            />
            {{ has_history }}
            <RouterLink to="/">
                <UButton
                    size="xl"
                    icon="i-heroicons-map-pin-20-solid"
                    label="Return to Homepage"
                    data-testid="go-home-button"
                    class="w-full px-4 py-2 rounded text-inverted justify-center text-md bg-primary hover:cursor-pointer"
                />
            </RouterLink>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

/**
 * Navigates back in the browser history, if this fail it redirects to the homepage after halve a second.
 */
function goBack() {
    router.back();
    setTimeout(() => {
        router.push({ path: "/" });
    }, 500);
}

const has_history = computed(() => window.history.length);
</script>
