<template>
    <ErrorPage
        title="404"
        title-size="text-6xl"
        md-title-size="text-9xl"
        subtitle="Page Not Found"
        description="Oops! It seems this part of WATERWATCH is yet to be discovered."
    />
</template>

<script setup lang="ts">
/**
 * This component renders a 404 page not found view.
 * It provides options to navigate back or return to the homepage.
 */
import ErrorPage from "../../components/ErrorPage.vue";
</script>
