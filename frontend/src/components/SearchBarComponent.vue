<script setup lang="ts">
import { ref } from "vue";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/vue/24/solid";

const props = defineProps<{
    query: string;
}>();

const inputQuery = ref(props.query);
const searchBarRef = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const showDropdown = ref(false);
const loading = ref(false);
const error = ref<string | null>(null);
const showNoResults = ref(false);
</script>

<template>
    <div class="relative flex items-center w-full" ref="searchBarRef">
        <input
            type="text"
            v-model="inputQuery"
            placeholder="Keyword Search"
            class="w-full border rounded px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#00acdd]"
        />
        <button class="absolute right-12 p-1 text-gray-500 hover:text-gray-700" aria-label="Clear search">
            <XMarkIcon class="h-5 w-5" />
        </button>
        <button class="absolute right-1 p-2 border-l bg-white hover:bg-gray-100" aria-label="Search">
            <MagnifyingGlassIcon class="h-5 w-5 text-gray-600" />
        </button>

        <!-- Preset Dropdown -->
        <div
            v-if="showDropdown"
            ref="dropdownRef"
            class="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-b-md shadow-lg z-50 max-h-64 overflow-y-auto"
        >
            <div data-testid="loading-presets" v-if="loading" class="px-4 py-3 text-gray-500 text-sm">
                Loading presets...
            </div>
            <div data-testid="preset-error" v-else-if="error" class="px-4 py-3 text-red-500 text-sm">
                {{ error }}
            </div>
            <div data-testid="results" v-else-if="showNoResults" class="px-4 py-3 text-gray-500 text-sm">
                No presets found
            </div>
            <!-- Uncomment once preset functionality exists -->
            <!-- <div
        v-else
        v-for="(preset, index) in filteredPresets"
        :key="preset.id"
        :class="[
          'px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0',
          index === selectedPresetIndex ? 'bg-blue-50' : 'hover:bg-gray-50',
        ]"
      >
        <div class="font-medium text-sm">{{ preset.name }}</div>
        <div v-if="preset.description" class="text-xs text-gray-600 mt-1">
          {{ preset.description }}
        </div>
      </div> -->
        </div>
    </div>
</template>
