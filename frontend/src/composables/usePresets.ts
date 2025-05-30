import { ref } from "vue";

export interface Preset {
    id: number;
    name: string;
    description?: string;
    filters: Filters;
    created_by?: number;
    created_at: string;
    updated_at: string;
    is_public: boolean;
}

export interface Filters {
    location?: {
        continents: string[];
        countries: string[];
    };
    measurements?: {
        waterSources: string[];
        temperature?: {
            from: number | null;
            to: number | null;
            unit: "C" | "F";
        };
    };
    dateRange?: {
        from: string | null;
        to: string | null;
    };
    times?: Array<{
        from: string;
        to: string;
    }>;
}

/**
 * Composable to manage presets in the application.
 * This composable provides functionality to load presets from the server,
 * filter them based on a search query, and handle loading and error states.
 *
 * @returns {Object} The presets state and actions.
 */
export function usePresets() {
    const presets = ref<Preset[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    /**
     * Loads presets from the server.
     * This function fetches presets from the API and populates the `presets` reactive variable.
     * It handles loading state and errors appropriately.
     *
     * @returns {Promise<void>} A promise that resolves when presets are loaded.
     * @throws {Error} If the fetch operation fails or if the response is not ok.
     */
    async function loadPresets(): Promise<void> {
        // Don't load if already loading or if presets are already loaded
        if (loading.value || presets.value.length > 0) {
            return;
        }

        loading.value = true;
        error.value = null;

        try {
            const response = await fetch("/api/presets");
            if (!response.ok) {
                throw new Error(`Failed to load presets: ${response.status}`);
            }

            const data = await response.json();
            presets.value = Array.isArray(data) ? data : data.presets || [];
        } catch (err) {
            console.error("Error loading presets:", err);
            error.value = err instanceof Error ? err.message : "Failed to load presets";
            presets.value = []; // Reset presets on error
        } finally {
            loading.value = false;
        }
    }

    /**
     * Filters the presets based on a search query.
     *
     * @param query - The search query to filter presets.
     * @returns An array of filtered presets.
     */
    function filterPresets(query: string): Preset[] {
        if (!query.trim()) return presets.value;

        const searchTerm = query.toLowerCase();
        return presets.value.filter(
            (preset) =>
                preset.name.toLowerCase().includes(searchTerm) ||
                (preset.description && preset.description.toLowerCase().includes(searchTerm)),
        );
    }

    return {
        presets,
        loading,
        error,
        loadPresets,
        filterPresets,
    };
}
