import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { usePresets, type Preset } from "../../../src/composables/usePresets";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("usePresets", () => {
    const mockPresets: Preset[] = [
        {
            id: 1,
            name: "Ocean Temperature Study",
            description: "Focus on ocean temperature measurements",
            filters: {
                location: {
                    continents: ["Europe"],
                    countries: ["Netherlands", "Germany"],
                },
                measurements: {
                    waterSources: ["Ocean"],
                    temperature: {
                        from: 10,
                        to: 25,
                        unit: "C",
                    },
                },
                dateRange: {
                    from: "2023-01-01",
                    to: "2023-12-31",
                },
                times: [{ from: "09:00", to: "17:00" }],
            },
            created_by: 1,
            created_at: "2023-01-01T00:00:00Z",
            updated_at: "2023-01-01T00:00:00Z",
            is_public: true,
        },
        {
            id: 2,
            name: "River Analysis",
            description: "River water quality analysis preset",
            filters: {
                location: {
                    continents: ["Asia"],
                    countries: ["Japan"],
                },
                measurements: {
                    waterSources: ["River", "Stream"],
                },
                dateRange: {
                    from: "2022-06-01",
                    to: "2022-08-31",
                },
            },
            created_by: 2,
            created_at: "2022-06-01T00:00:00Z",
            updated_at: "2022-06-01T00:00:00Z",
            is_public: false,
        },
        {
            id: 3,
            name: "Lake Temperature",
            description: "Lake temperature monitoring",
            filters: {
                measurements: {
                    waterSources: ["Lake"],
                    temperature: {
                        from: 5,
                        to: 30,
                        unit: "C",
                    },
                },
            },
            created_by: 1,
            created_at: "2023-03-15T00:00:00Z",
            updated_at: "2023-03-15T00:00:00Z",
            is_public: true,
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockClear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("initializes with empty state", () => {
        const { presets, loading, error } = usePresets();

        expect(presets.value).toEqual([]);
        expect(loading.value).toBe(false);
        expect(error.value).toBeNull();
    });

    it("loads presets successfully", async () => {
        const { presets, loading, error, loadPresets } = usePresets();

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: vi.fn().mockResolvedValue(mockPresets),
        });

        await loadPresets();

        expect(mockFetch).toHaveBeenCalledWith("/api/presets");
        expect(presets.value).toEqual(mockPresets);
        expect(loading.value).toBe(false);
        expect(error.value).toBeNull();
    });

    it("loads presets from nested data structure", async () => {
        const { presets, loading, error, loadPresets } = usePresets();

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: vi.fn().mockResolvedValue({ presets: mockPresets }),
        });

        await loadPresets();

        expect(presets.value).toEqual(mockPresets);
        expect(loading.value).toBe(false);
        expect(error.value).toBeNull();
    });

    it("handles non-array response gracefully", async () => {
        const { presets, loading, error, loadPresets } = usePresets();

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: vi.fn().mockResolvedValue({ someOtherData: "test" }),
        });

        await loadPresets();

        expect(presets.value).toEqual([]);
        expect(loading.value).toBe(false);
        expect(error.value).toBeNull();
    });

    it("handles HTTP error responses", async () => {
        const { presets, loading, error, loadPresets } = usePresets();
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
        });

        await loadPresets();

        expect(presets.value).toEqual([]);
        expect(loading.value).toBe(false);
        expect(error.value).toBe("Failed to load presets: 404");
        expect(consoleSpy).toHaveBeenCalledWith("Error loading presets:", expect.any(Error));

        consoleSpy.mockRestore();
    });

    it("handles network errors", async () => {
        const { presets, loading, error, loadPresets } = usePresets();
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        await loadPresets();

        expect(presets.value).toEqual([]);
        expect(loading.value).toBe(false);
        expect(error.value).toBe("Network error");
        expect(consoleSpy).toHaveBeenCalledWith("Error loading presets:", expect.any(Error));

        consoleSpy.mockRestore();
    });

    it("handles non-Error thrown values", async () => {
        const { presets, loading, error, loadPresets } = usePresets();
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        mockFetch.mockRejectedValueOnce("String error");

        await loadPresets();

        expect(presets.value).toEqual([]);
        expect(loading.value).toBe(false);
        expect(error.value).toBe("Failed to load presets");
        expect(consoleSpy).toHaveBeenCalledWith("Error loading presets:", "String error");

        consoleSpy.mockRestore();
    });

    it("doesn't load presets if already loading", async () => {
        const { loading, loadPresets } = usePresets();

        // Simulate loading state
        loading.value = true;

        await loadPresets();

        expect(mockFetch).not.toHaveBeenCalled();
    });

    it("doesn't load presets if already loaded", async () => {
        const { presets, loadPresets } = usePresets();

        // First load
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: vi.fn().mockResolvedValue(mockPresets),
        });

        await loadPresets();
        expect(mockFetch).toHaveBeenCalledTimes(1);

        // Second load attempt
        await loadPresets();
        expect(mockFetch).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it("sets loading state correctly during fetch", async () => {
        const { loading, loadPresets } = usePresets();

        let resolvePromise: (value: any) => void;
        const fetchPromise = new Promise((resolve) => {
            resolvePromise = resolve;
        });

        mockFetch.mockReturnValueOnce(fetchPromise);

        const loadPromise = loadPresets();

        expect(loading.value).toBe(true);

        resolvePromise!({
            ok: true,
            json: vi.fn().mockResolvedValue(mockPresets),
        });

        await loadPromise;
        expect(loading.value).toBe(false);
    });

    describe("filterPresets", () => {
        it("returns all presets for empty query", () => {
            const { presets, filterPresets } = usePresets();
            presets.value = mockPresets;

            const result = filterPresets("");
            expect(result).toEqual(mockPresets);
        });

        it("returns all presets for whitespace-only query", () => {
            const { presets, filterPresets } = usePresets();
            presets.value = mockPresets;

            const result = filterPresets("   ");
            expect(result).toEqual(mockPresets);
        });

        it("filters presets by name (case insensitive)", () => {
            const { presets, filterPresets } = usePresets();
            presets.value = mockPresets;

            const result = filterPresets("ocean");
            expect(result).toEqual([mockPresets[0]]);
        });

        it("filters presets by name (exact case)", () => {
            const { presets, filterPresets } = usePresets();
            presets.value = mockPresets;

            const result = filterPresets("Ocean");
            expect(result).toEqual([mockPresets[0]]);
        });

        it("filters presets by description", () => {
            const { presets, filterPresets } = usePresets();
            presets.value = mockPresets;

            const result = filterPresets("quality");
            expect(result).toEqual([mockPresets[1]]);
        });

        it("filters presets by partial matches", () => {
            const { presets, filterPresets } = usePresets();
            presets.value = mockPresets;

            const result = filterPresets("temp");
            expect(result).toEqual([mockPresets[0], mockPresets[2]]);
        });

        it("returns empty array when no matches found", () => {
            const { presets, filterPresets } = usePresets();
            presets.value = mockPresets;

            const result = filterPresets("nonexistent");
            expect(result).toEqual([]);
        });

        it("handles presets without descriptions", () => {
            const { presets, filterPresets } = usePresets();
            const presetsWithoutDesc = [
                {
                    ...mockPresets[0],
                    description: undefined,
                },
            ];
            presets.value = presetsWithoutDesc;

            const result = filterPresets("ocean");
            expect(result).toEqual(presetsWithoutDesc);
        });

        it("handles empty presets array", () => {
            const { presets, filterPresets } = usePresets();
            presets.value = [];

            const result = filterPresets("anything");
            expect(result).toEqual([]);
        });

        it("trims search query", () => {
            const { presets, filterPresets } = usePresets();
            presets.value = mockPresets;

            const result = filterPresets("  ocean  ");
            expect(result).toEqual([mockPresets[0]]);
        });
    });

    it("provides correct return interface", () => {
        const composable = usePresets();

        expect(composable).toHaveProperty("presets");
        expect(composable).toHaveProperty("loading");
        expect(composable).toHaveProperty("error");
        expect(composable).toHaveProperty("loadPresets");
        expect(composable).toHaveProperty("filterPresets");

        expect(typeof composable.loadPresets).toBe("function");
        expect(typeof composable.filterPresets).toBe("function");
    });
});
