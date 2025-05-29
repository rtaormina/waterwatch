<template>
    <select v-model="locale">
        <option v-for="loc in locales" :key="loc" :value="loc">
            {{ loc.toUpperCase() }}
        </option>
    </select>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { watch } from "vue";

const { locale } = useI18n<object, "en" | "nl">();

const locales = ["en", "nl"];

watch(locale, (newLoc) => {
    localStorage.setItem("locale", newLoc);
});
</script>
