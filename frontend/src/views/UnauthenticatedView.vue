<template>
    <ErrorPage
        icon="i-heroicons-no-symbol-20-solid"
        title="Authentication Required"
        subtitle="Please Login"
        description="You must be logged in to access this part of WATERWATCH."
    >
        <template #action-button>
            <RouterLink to="/login">
                <UButton
                    size="xl"
                    icon="i-heroicons-arrow-right-start-on-rectangle-20-solid"
                    label="Login"
                    data-testid="login-button"
                    class="w-full px-4 py-2 rounded text-inverted justify-center text-md bg-primary hover:cursor-pointer"
                />
            </RouterLink>
        </template>
    </ErrorPage>
</template>

<script setup lang="ts">
/**
 * This component renders an unauthenticated view.
 * It provides a message indicating that authentication is required and a button to navigate to the login page.
 */
import ErrorPage from "../components/ErrorPage.vue";
</script>
