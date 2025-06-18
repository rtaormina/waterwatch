<template>
    <ErrorPage
        icon="i-heroicons-shield-exclamation-20-solid"
        title="Access Denied"
        subtitle="Insufficient Permissions"
        description="This section of WATERWATCH requires researcher or admin privileges."
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
 * This component renders an unauthorized view.
 * It provides a message indicating insufficient permissions and a button to navigate to the login page.
 */
import ErrorPage from "../components/ErrorPage.vue";
</script>
