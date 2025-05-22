import { ref, computed, watch, readonly } from 'vue';
import axios from 'axios';
import type { LocationFilter, MeasurementFilter, DateRangeFilter, TimeSlot } from './ExportFilterLogic';

export interface PresetFilters {
  location?: LocationFilter;
  measurements?: MeasurementFilter;
  dateRange?: DateRangeFilter;
  times?: TimeSlot[];
}

export interface Preset {
  id: number;
  name: string;
  description?: string;
  filters: PresetFilters;
  created_at: string;
  is_public: boolean;
}


export function usePresets() {
  const presets = ref<Preset[]>([]);
  const loading = ref(false);
  const error = ref<string>('');
  const searchQuery = ref('');
  const selectedPresetIndex = ref(-1);

  // Computed filtered presets based on search query
  const filteredPresets = computed(() => {
    if (!searchQuery.value.trim()) {
      return [];
    }

    return presets.value.filter(preset =>
      preset.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (preset.description && preset.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
    );
  });

  // Computed flag for showing dropdown
  const showDropdown = computed(() => {
    return searchQuery.value.trim().length > 0;
  });

  // Computed flag for showing "no results" message
  const showNoResults = computed(() =>
    searchQuery.value.trim() && filteredPresets.value.length === 0 && showDropdown.value
  );

  // Reset selection when filtered presets change
  watch(filteredPresets, () => {
    selectedPresetIndex.value = -1;
  });

  // Fetch presets from API
  async function fetchPresets(): Promise<void> {
    loading.value = true;
    error.value = '';

    try {
      const response = await axios.get<Preset[]>('/api/presets/');
      presets.value = response.data;
    } catch (err) {
      console.error('Failed to fetch presets:', err);
      error.value = 'Failed to load presets';
      presets.value = [];
    } finally {
      loading.value = false;
    }
  }

  // Update search query
  function updateSearchQuery(query: string): void {
    searchQuery.value = query;
  }

  // Handle keyboard navigation
  function handleKeyNavigation(key: string): { handled: boolean; selectedPreset?: Preset } {
    if (!showDropdown.value || filteredPresets.value.length === 0) {
      return { handled: false };
    }

    switch (key) {
      case 'ArrowDown':
        selectedPresetIndex.value = Math.min(
          selectedPresetIndex.value + 1,
          filteredPresets.value.length - 1
        );
        return { handled: true };

      case 'ArrowUp':
        selectedPresetIndex.value = Math.max(selectedPresetIndex.value - 1, -1);
        return { handled: true };

      case 'Enter':
        if (selectedPresetIndex.value >= 0) {
          const selectedPreset = filteredPresets.value[selectedPresetIndex.value];
          return { handled: true, selectedPreset };
        }
        return { handled: false };

      case 'Escape':
        clearSelection();
        return { handled: true };

      default:
        return { handled: false };
    }
  }

  // Clear selection and hide dropdown
  function clearSelection(): void {
    selectedPresetIndex.value = -1;
    searchQuery.value = '';
  }

  // Get preset by index
  function getPresetByIndex(index: number): Preset | undefined {
    return filteredPresets.value[index];
  }

  return {
    // State
    presets: readonly(presets),
    loading: readonly(loading),
    error: readonly(error),
    searchQuery: readonly(searchQuery),
    selectedPresetIndex: readonly(selectedPresetIndex),

    // Computed
    filteredPresets,
    showDropdown,
    showNoResults,

    // Methods
    fetchPresets,
    updateSearchQuery,
    handleKeyNavigation,
    clearSelection,
    getPresetByIndex
  };
}
