<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/vue/24/solid";

const props = defineProps({
    query: {
        type: String,
        default: "",
    },
});

const emit = defineEmits(["update:query", "search"]);
const inputQuery = ref(props.query);

watch(
    () => props.query,
    (newValue) => {
        inputQuery.value = newValue;
    },
);

watch(inputQuery, (newValue) => {
    emit("update:query", newValue);
});

/**
 * Clears the contents of the search bar
 */
function clear() {
    inputQuery.value = "";
    emit("update:query", "");
}

/**
 * Searches for the current contents
 */
function search() {
    emit("search");
}

const showClear = computed(() => inputQuery.value.length > 0);
</script>

<template>
    <div class="relative flex items-center w-full">
        <input
            type="text"
            v-model="inputQuery"
            placeholder="Keyword Search"
            class="w-full border rounded px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#00acdd]"
        />
        <button
            v-if="showClear"
            @click="clear"
            class="absolute right-12 p-1 text-gray-500 hover:text-gray-700"
            aria-label="Clear search"
        >
            <XMarkIcon class="h-5 w-5" />
        </button>
        <button @click="search" class="absolute right-1 p-2 border-l bg-white hover:bg-gray-100" aria-label="Search">
            <MagnifyingGlassIcon class="h-5 w-5 text-gray-600" />
        </button>
    </div>
</template>
