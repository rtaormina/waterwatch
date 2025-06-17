<template>
    <div class="max-w-2xl h-full flex flex-col justify-center mx-auto">
        <div class="text-center">
            <UIcon v-if="icon" :name="icon" class="w-24 h-24 text-highlight mb-4 mx-auto" />
            <h1 v-if="title" :class="['font-bold', 'text-highlight', 'mb-4', titleSize]">{{ title }}</h1>
            <p v-if="subtitle" class="text-2xl text-muted mb-6">{{ subtitle }}</p>
            <p v-if="description" class="text-dimmed mb-8">{{ description }}</p>
        </div>

        <div class="flex flex-col sm:flex-row mx-4 gap-4 justify-center">
            <UButton
                @click="goBack"
                size="xl"
                icon="i-heroicons-arrow-left-20-solid"
                class="border bg-default text-md border-primary justify-center text-default px-4 py-2 rounded hover:bg-accented hover:cursor-pointer"
                label="Go Back"
                data-testid="go-back-button"
            />
            <slot name="action-button">
                <RouterLink to="/">
                    <UButton
                        size="xl"
                        icon="i-heroicons-map-pin-20-solid"
                        label="Return to Homepage"
                        data-testid="go-home-button"
                        class="w-full px-4 py-2 rounded text-inverted justify-center text-md bg-primary hover:cursor-pointer"
                    />
                </RouterLink>
            </slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

defineProps({
    icon: String,
    title: String,
    titleSize: {
        type: String,
        default: "text-6xl",
    },
    subtitle: String,
    description: String,
});

const router = useRouter();

/**
 * Navigates back in the browser history; if this fails, it redirects to the homepage after half a second.
 */
function goBack() {
    router.back();
    setTimeout(() => {
        if (window.history.state === null) {
            router.push("/");
        }
    }, 500);
}
</script>
