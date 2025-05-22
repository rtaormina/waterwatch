<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount } from "vue";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/vue/24/solid";
import { usePresets } from "@/composables/ExportPresetLogic";
import type { Preset } from "@/composables/ExportPresetLogic";

const props = defineProps<{
  query: string;
}>();

const emit = defineEmits<{
  "update:query": [value: string];
  search: [];
  applyPreset: [preset: Preset];
}>();

const inputQuery = ref(props.query);
const searchBarRef = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);

// Use presets composable
const {
  presets,
  loading,
  error,
  filteredPresets,
  showDropdown,
  showNoResults,
  selectedPresetIndex,
  fetchPresets,
  updateSearchQuery,
  handleKeyNavigation,
  clearSelection,
  getPresetByIndex,
} = usePresets();

// Watch for prop changes
watch(
  () => props.query,
  (newValue) => {
    inputQuery.value = newValue;
  }
);

// Watch for input changes
watch(inputQuery, (newValue) => {
  emit("update:query", newValue);
  updateSearchQuery(newValue);
});

// Handle keyboard navigation
function handleKeydown(event: KeyboardEvent) {
  const result = handleKeyNavigation(event.key);

  if (result.handled) {
    event.preventDefault();

    if (result.selectedPreset) {
      selectPreset(result.selectedPreset);
    }
  } else if (event.key === "Enter") {
    search();
  }
}

// Handle click outside
function handleClickOutside(event: MouseEvent) {
  if (
    searchBarRef.value &&
    !searchBarRef.value.contains(event.target as Node)
  ) {
    clearSelection();
  }
}

// Select a preset
function selectPreset(preset: Preset) {
  inputQuery.value = preset.name;
  emit("update:query", preset.name);
  emit("applyPreset", preset);
  clearSelection();
}

// Clear input
function clear() {
  inputQuery.value = "";
  emit("update:query", "");
  clearSelection();
}

// Trigger search
function search() {
  clearSelection();
  emit("search");
}

// Computed properties
const showClear = computed(() => inputQuery.value.length > 0);

// Lifecycle
onMounted(async () => {
  await fetchPresets();
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div class="relative flex items-center w-full" ref="searchBarRef">
    <input
      type="text"
      v-model="inputQuery"
      @keydown="handleKeydown"
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
    <button
      @click="search"
      class="absolute right-1 p-2 border-l bg-white hover:bg-gray-100"
      aria-label="Search"
    >
      <MagnifyingGlassIcon class="h-5 w-5 text-gray-600" />
    </button>

    <!-- Preset Dropdown -->
    <div
      v-if="showDropdown"
      ref="dropdownRef"
      class="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-b-md shadow-lg z-50 max-h-64 overflow-y-auto"
    >
      <div v-if="loading" class="px-4 py-3 text-gray-500 text-sm">
        Loading presets...
      </div>
      <div v-else-if="error" class="px-4 py-3 text-red-500 text-sm">
        {{ error }}
      </div>
      <div v-else-if="showNoResults" class="px-4 py-3 text-gray-500 text-sm">
        No presets found
      </div>
      <div
        v-else
        v-for="(preset, index) in filteredPresets"
        :key="preset.id"
        @click="selectPreset(preset)"
        :class="[
          'px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0',
          index === selectedPresetIndex ? 'bg-blue-50' : 'hover:bg-gray-50',
        ]"
      >
        <div class="font-medium text-sm">{{ preset.name }}</div>
        <div v-if="preset.description" class="text-xs text-gray-600 mt-1">
          {{ preset.description }}
        </div>
      </div>
    </div>
  </div>
</template>
