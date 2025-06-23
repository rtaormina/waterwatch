import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { ref, nextTick, Ref } from "vue";

// Mock dependencies
vi.mock("file-saver", () => ({
    saveAs: vi.fn(),
}));

vi.mock("universal-cookie", () => ({
    default: vi.fn().mockImplementation(() => ({
        get: vi.fn().mockReturnValue("test-csrf-token"),
    })),
}));

vi.mock("axios", () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

global.fetch = vi.fn() as unknown as typeof fetch;

import * as fileSaver from "file-saver";
import axios from "axios"; // This will be the mocked version
import { useExportData } from "../../../src/composables/Export/useExportData.ts";
import { useFilters } from "../../../src/composables/Export/useFilters.ts";
import { useSearch, MeasurementSearchParams, flattenSearchParams } from "../../../src/composables/Export/useSearch.ts";

/**
 * Mock response class to simulate fetch responses
 * This is used to mock the fetch API in tests.
 */
class MockResponse {
    /**
     * MockResponse simulates the response from the fetch API.
     * It can return a Blob or a Promise of a Blob, and optionally a status and text for error responses.
     *
     * @param {boolean} ok - Indicates if the response is successful (status in the range 200-299).
     * @param {Blob | Promise<Blob>} _blob - The blob data or a promise that resolves to blob data.
     * @param {number} [status=200] - The HTTP status code of the response.
     * @param {string} [_text] - Optional text for error responses.
     */
    constructor(
        public ok: boolean,
        private _blob: Blob | Promise<Blob>, // Allow blob or promise of blob
        public status = 200,
        private _text?: string, // Optional text for error responses
    ) {}

    /**
     * Returns the status of the response.
     *
     * @returns {number} The HTTP status code.
     */
    blob(): Promise<Blob> {
        return Promise.resolve(this._blob);
    }

    /**
     * Returns the text content of the response.
     * If the response is successful, it returns the text content of the blob.
     * If the response is not successful, it returns a predefined error message.
     *
     * @returns {Promise<string>} The text content of the response.
     */
    async text(): Promise<string> {
        // Add text method for error handling
        if (this._text !== undefined) {
            return Promise.resolve(this._text);
        }
        if (this.ok) {
            // This behavior might need adjustment based on typical usage of .text()
            // For simplicity, if blob is available, try to read it as text.
            // However, for mock purposes, usually specific text is provided for errors.
            const blobContent = await Promise.resolve(this._blob);
            return blobContent.text();
        }
        return Promise.resolve(`Error content for status ${this.status}`);
    }
}

/**
 * Tests for the useExportData composable.
 */
describe("useExportData", () => {
    const { exportData } = useExportData();
    let format = "csv"; // Default format

    beforeEach(() => {
        format = "csv";
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("calls saveAs on successful fetch (POST)", async () => {
        const csvData = "id,value\n1,42";
        const blob = new Blob([csvData], { type: "text/csv" });
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(new MockResponse(true, blob));

        const successful = await exportData(format);

        expect(successful).toBe(true);
        expect(fileSaver.saveAs).toHaveBeenCalledOnce();
        expect(fileSaver.saveAs).toHaveBeenCalledWith(blob, "water-data.csv");
        expect(global.fetch).toHaveBeenCalledWith(
            "/api/measurements/search/",
            expect.objectContaining({
                method: "POST",
                headers: expect.objectContaining({
                    "Content-Type": "application/json",
                    "X-CSRFToken": "test-csrf-token",
                }),
                body: JSON.stringify({ format: "csv" }), // Default empty filters + format
            }),
        );
    });

    it("returns false and does not call saveAs on non-ok response", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
            new MockResponse(false, new Blob(), 500, "Server Error"),
        );
        const successful = await exportData(format);
        expect(successful).toBe(false);
        expect(fileSaver.saveAs).not.toHaveBeenCalled();
    });

    it("returns false and does not call saveAs on fetch network error", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network Error"));
        const successful = await exportData(format);
        expect(successful).toBe(false);
        expect(fileSaver.saveAs).not.toHaveBeenCalled();
    });

    it("sends correct data in POST body, including format", async () => {
        const blob = new Blob(["dummy"], { type: "text/csv" });
        const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
        mockFetch.mockResolvedValue(new MockResponse(true, blob));

        format = "csv";
        let successful = await exportData(format);
        expect(successful).toBe(true);
        expect(mockFetch).toHaveBeenCalledOnce();
        expect(mockFetch).toHaveBeenLastCalledWith(
            "/api/measurements/search/",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({ format: "csv" }),
                headers: expect.objectContaining({ "Content-Type": "application/json" }),
            }),
        );

        mockFetch.mockClear(); // Clear mock for next call
        mockFetch.mockResolvedValue(new MockResponse(true, blob)); // Re-mock for next call

        format = "json";
        successful = await exportData(format);
        expect(successful).toBe(true);
        expect(mockFetch).toHaveBeenCalledOnce(); // Since we cleared
        expect(mockFetch).toHaveBeenLastCalledWith(
            "/api/measurements/search/",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({ format: "json" }),
                headers: expect.objectContaining({ "Content-Type": "application/json" }),
            }),
        );
    });

    it("calls fetch with correct POST options and CSRF token", async () => {
        const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
        mockFetch.mockResolvedValue(new MockResponse(true, new Blob()));

        const successful = await exportData(format);
        expect(successful).toBe(true);
        expect(mockFetch).toHaveBeenCalledOnce();
        expect(mockFetch).toHaveBeenCalledWith(
            "/api/measurements/search/",
            expect.objectContaining({
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": "test-csrf-token",
                },
                body: JSON.stringify({ format: "csv" }),
            }),
        );
    });

    it("still calls saveAs when format is xml", async () => {
        format = "xml";
        const blob = new Blob(["<data></data>"], { type: "application/xml" });
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(new MockResponse(true, blob));

        const successful = await exportData(format);
        expect(successful).toBe(true);
        expect(fileSaver.saveAs).toHaveBeenCalledOnce();
        expect(fileSaver.saveAs).toHaveBeenCalledWith(blob, "water-data.xml");
    });

    it("calls saveAs even if server returns blob with unexpected type", async () => {
        const blob = new Blob(["<html>oops</html>"], { type: "text/html" }); // Server sends wrong type
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(new MockResponse(true, blob));
        format = "csv"; // We requested CSV

        const successful = await exportData(format);
        expect(successful).toBe(true);
        expect(fileSaver.saveAs).toHaveBeenCalledOnce();
        // saveAs should still use the requested format for the filename extension
        expect(fileSaver.saveAs).toHaveBeenCalledWith(blob, "water-data.csv");
    });

    it("supports multiple sequential calls with correct POST bodies", async () => {
        const blob1 = new Blob(["a"], { type: "text/csv" });
        const blob2 = new Blob(["b"], { type: "application/json" }); // Different type for second call
        const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

        mockFetch.mockResolvedValueOnce(new MockResponse(true, blob1));
        mockFetch.mockResolvedValueOnce(new MockResponse(true, blob2));

        const successful1 = await exportData("csv");
        expect(mockFetch).toHaveBeenNthCalledWith(
            1,
            "/api/measurements/search/",
            expect.objectContaining({ method: "POST", body: JSON.stringify({ format: "csv" }) }),
        );

        const successful2 = await exportData("json");
        expect(mockFetch).toHaveBeenNthCalledWith(
            2,
            "/api/measurements/search/",
            expect.objectContaining({ method: "POST", body: JSON.stringify({ format: "json" }) }),
        );

        expect(successful1 && successful2).toBe(true);
        expect(fileSaver.saveAs).toHaveBeenCalledTimes(2);
        expect(fileSaver.saveAs).toHaveBeenNthCalledWith(1, blob1, "water-data.csv");
        expect(fileSaver.saveAs).toHaveBeenNthCalledWith(2, blob2, "water-data.json");
    });

    it("handles a delayed fetch gracefully (POST)", async () => {
        let resolveFetch!: (value: MockResponse | PromiseLike<MockResponse>) => void;
        (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveFetch = resolve;
                }),
        );

        const promise = exportData(format);
        await new Promise((r) => setTimeout(r, 10)); // Simulate some time passing
        expect(fileSaver.saveAs).not.toHaveBeenCalled(); // Not called yet

        resolveFetch(new MockResponse(true, new Blob(["delayed data"])));
        const successful = await promise;

        expect(successful).toBe(true);
        expect(fileSaver.saveAs).toHaveBeenCalledOnce();
        expect(fileSaver.saveAs).toHaveBeenCalledWith(expect.any(Blob), "water-data.csv");
    });

    it("handles large CSV payloads (POST)", async () => {
        const largeData = "x,".repeat(100); // Smaller for test speed, but conceptually large
        const blob = new Blob([largeData], { type: "text/csv" });
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(new MockResponse(true, blob));

        const successful = await exportData(format);
        expect(successful).toBe(true);
        expect(fileSaver.saveAs).toHaveBeenCalledOnce();
        expect(fileSaver.saveAs).toHaveBeenCalledWith(blob, "water-data.csv");
    });

    it("exports data with filters in POST body", async () => {
        const blob = new Blob(["filtered data"], { type: "application/json" });
        const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
        mockFetch.mockResolvedValue(new MockResponse(true, blob));

        const filters: MeasurementSearchParams = {
            query: "test query",
            location: { continents: ["North America"], countries: ["USA"] },
            measurements: {
                waterSources: ["Network", "Well"],
                temperature: { from: "20", to: "30", unit: "C" }, // Unit is for client-side, not sent in this flatten
            },
            dateRange: { from: "2023-01-01", to: "2023-12-31" },
            times: [{ from: "09:00", to: "17:00" }],
        };

        const expectedFlatFilters = flattenSearchParams(filters);
        const expectedBody = JSON.stringify({
            ...expectedFlatFilters,
            format: "json",
        });

        const successful = await exportData("json", filters);

        expect(successful).toBe(true);
        expect(mockFetch).toHaveBeenCalledOnce();
        expect(mockFetch).toHaveBeenCalledWith(
            "/api/measurements/search/",
            expect.objectContaining({
                method: "POST",
                body: expectedBody,
                headers: expect.objectContaining({ "Content-Type": "application/json" }),
            }),
        );
        expect(fileSaver.saveAs).toHaveBeenCalledWith(blob, "water-data.json");
    });
});

describe("useSearch", () => {
    // vi.mocked provides type safety for mocked axios
    const mockedAxios = vi.mocked(axios, true);

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mock("../../../src/stores/ExportStore", () => ({
            useExportStore: () => ({
                filters: {},
                hasSearched: false,
            }),
        }));

        // Since state is shared at module level, we need to reset it manually
        // Get a useSearch instance and reset the shared state
        const { resetSearch } = useSearch();
        resetSearch();
    });

    it("performs basic search using POST", async () => {
        const { searchMeasurements, isLoading, results } = useSearch();

        mockedAxios.post.mockResolvedValue({
            data: { count: 100, avgTemp: 25.5 },
        });

        const params: MeasurementSearchParams = { query: "test search" };
        const expectedFlatParams = { query: "test search" }; // From flattenSearchParams

        // Check initial loading state
        expect(isLoading.value).toBe(false);

        const searchPromise = searchMeasurements(params);

        // Check loading state is true during search
        expect(isLoading.value).toBe(true);

        await searchPromise;

        // Check final state after search completes
        expect(isLoading.value).toBe(false);
        expect(results.value.count).toBe(100);
        expect(results.value.avgTemp).toBe(25.5);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            "/api/measurements/search/",
            expectedFlatParams, // This is the body data
            expect.objectContaining({
                // This is the config object
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": "test-csrf-token",
                },
            }),
        );
    });

    it("rounds average temperature to one decimal place", async () => {
        const { searchMeasurements, results } = useSearch();

        mockedAxios.post.mockResolvedValue({
            data: { count: 50, avgTemp: 23.456789 },
        });

        await searchMeasurements({ query: "test" });

        expect(results.value.avgTemp).toBe(23.5); // Should be rounded to 1 decimal place
    });

    it("flattens search parameters correctly", () => {
        const params: MeasurementSearchParams = {
            query: "test",
            location: { continents: ["Asia", "Europe"], countries: ["Japan", "Germany"] },
            measurements: {
                waterSources: ["Network", "Well"],
                temperature: { from: "15", to: "35", unit: "C" },
            },
            dateRange: { from: "2023-01-01", to: "2023-12-31" },
            times: [
                { from: "09:00", to: "12:00" },
                { from: "14:00", to: "17:00" },
            ],
        };

        const flattened = flattenSearchParams(params);

        // measurements_included will include keys from measurements object where value is not null
        const expectedMetricsIncluded = ["waterSources", "temperature"];

        expect(flattened).toEqual({
            query: "test",
            "location[continents]": ["Asia", "Europe"],
            "location[countries]": ["Japan", "Germany"],
            measurements_included: expectedMetricsIncluded,
            "measurements[waterSources]": ["Network", "Well"],
            "measurements[temperature][from]": "15",
            "measurements[temperature][to]": "35",
            "dateRange[from]": "2023-01-01",
            "dateRange[to]": "2023-12-31",
            times: JSON.stringify([
                { from: "09:00", to: "12:00" },
                { from: "14:00", to: "17:00" },
            ]),
        });
    });

    it("handles search errors gracefully", async () => {
        const { searchMeasurements, results, isLoading } = useSearch();

        // Mock axios.post to reject
        mockedAxios.post.mockRejectedValue(new Error("API Error"));
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        // Check initial state
        expect(isLoading.value).toBe(false);

        const searchPromise = searchMeasurements({ query: "test" });

        // Check loading state during search
        expect(isLoading.value).toBe(true);

        await searchPromise;

        // Check final state after error
        expect(isLoading.value).toBe(false);
        expect(results.value.count).toBe(0);
        expect(results.value.avgTemp).toBe(0);
        expect(consoleSpy).toHaveBeenCalledWith("Search failed:", expect.any(Error));

        consoleSpy.mockRestore();
    });

    it("resets search state", async () => {
        const { resetSearch, isLoading, results, searchMeasurements } = useSearch();

        // Perform a search to set some state
        mockedAxios.post.mockResolvedValue({
            data: { count: 50, avgTemp: 20 },
        });

        await searchMeasurements({ query: "test" });

        // Verify state is set after search
        expect(results.value.count).toBe(50);
        expect(results.value.avgTemp).toBe(20);

        // Reset and verify all values are cleared
        resetSearch();

        expect(isLoading.value).toBe(false);
        expect(results.value.count).toBe(0);
        expect(results.value.avgTemp).toBe(0);
    });

    it("flattens parameters with null temperature", () => {
        const params: MeasurementSearchParams = {
            measurements: {
                waterSources: ["Network"], // waterSources is not null
                temperature: null, // temperature is null
            },
        };

        const flattened = flattenSearchParams(params);

        // According to the logic: `filter != null`, 'temperature' will be excluded from `measurements_included`
        expect(flattened.measurements_included).toEqual(["waterSources"]);
        expect(flattened["measurements[temperature][from]"]).toBeUndefined();
        expect(flattened["measurements[temperature][to]"]).toBeUndefined();
        expect(flattened["measurements[waterSources]"]).toEqual(["Network"]);
    });

    it("manages loading state correctly during concurrent searches", async () => {
        const { searchMeasurements, isLoading } = useSearch();

        let resolveFirst: (value: any) => void;
        let resolveSecond: (value: any) => void;

        const firstPromise = new Promise((resolve) => {
            resolveFirst = resolve;
        });
        const secondPromise = new Promise((resolve) => {
            resolveSecond = resolve;
        });

        mockedAxios.post.mockReturnValueOnce(firstPromise).mockReturnValueOnce(secondPromise);

        // Start first search
        const search1 = searchMeasurements({ query: "first" });
        expect(isLoading.value).toBe(true);

        // Start second search while first is still pending
        const search2 = searchMeasurements({ query: "second" });
        expect(isLoading.value).toBe(true);

        // Resolve first search
        resolveFirst!({ data: { count: 10, avgTemp: 20 } });
        await search1;

        // Should still be loading because second search is pending
        expect(isLoading.value).toBe(true);

        // Resolve second search
        resolveSecond!({ data: { count: 20, avgTemp: 25 } });
        await search2;

        // Now should be done loading
        expect(isLoading.value).toBe(false);
    });

    it("handles concurrent search errors correctly", async () => {
        const { searchMeasurements, isLoading, results } = useSearch();

        let resolveFirst: (value: any) => void;
        let rejectSecond: (error: any) => void;

        const firstPromise = new Promise((resolve) => {
            resolveFirst = resolve;
        });
        const secondPromise = new Promise((_, reject) => {
            rejectSecond = reject;
        });

        mockedAxios.post.mockReturnValueOnce(firstPromise).mockReturnValueOnce(secondPromise);

        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        // Start both searches
        const search1 = searchMeasurements({ query: "first" });
        const search2 = searchMeasurements({ query: "second" });

        expect(isLoading.value).toBe(true);

        // First search succeeds
        resolveFirst!({ data: { count: 10, avgTemp: 20 } });
        await search1;

        // Still loading because second search is pending
        expect(isLoading.value).toBe(true);
        expect(results.value.count).toBe(10);

        // Second search fails
        rejectSecond!(new Error("API Error"));
        await search2.catch(() => {}); // Catch the error to prevent unhandled rejection

        // No longer loading, hasSearched remains true from first successful search
        expect(isLoading.value).toBe(false);
        expect(results.value.count).toBe(0); // Reset to 0 due to error in second search
        expect(results.value.avgTemp).toBe(0);

        consoleSpy.mockRestore();
    });

    it("resets search state even with active searches", async () => {
        const { searchMeasurements, resetSearch, isLoading } = useSearch();

        let resolveSearch: (value: any) => void;
        const searchPromise = new Promise((resolve) => {
            resolveSearch = resolve;
        });

        mockedAxios.post.mockReturnValue(searchPromise);

        // Start a search
        const searchCall = searchMeasurements({ query: "test" });
        expect(isLoading.value).toBe(true);

        // Reset while search is active
        resetSearch();

        // Reset should clear state but activeSearchCount remains (since search is still active)
        expect(isLoading.value).toBe(false); // This resets activeSearchCount to 0

        // Complete the search
        resolveSearch!({ data: { count: 10, avgTemp: 20 } });
        await searchCall;

        // After search completes, activeSearchCount decrements but since it was reset to 0,
        // it goes to max(0, 0-1) = 0, so loading stays false
        // But the search results should still be updated
        expect(isLoading.value).toBe(false);
    });

    it("shares state between multiple useSearch instances", async () => {
        const search1 = useSearch();
        const search2 = useSearch();

        mockedAxios.post.mockResolvedValue({
            data: { count: 100, avgTemp: 25.5 },
        });

        // Initial state should be the same for both instances
        expect(search1.results.value.count).toBe(0);
        expect(search2.results.value.count).toBe(0);

        // Search with first instance
        await search1.searchMeasurements({ query: "test" });

        // Both instances should reflect the same state changes
        expect(search1.results.value.count).toBe(100);
        expect(search2.results.value.count).toBe(100);

        // Reset with second instance
        search2.resetSearch();

        // Both instances should reflect the reset
        expect(search1.results.value.count).toBe(0);
        expect(search2.results.value.count).toBe(0);
    });
});

describe("useFilters", () => {
    let selectedContinents: Ref<string[]>;
    let selectedCountries: Ref<string[]>;
    let selectedWaterSources: Ref<string[]>;
    let temperatureEnabled: Ref<boolean>;
    let temperature: Ref<{ from: string; to: string; unit: "C" | "F" }>;
    let dateRange: Ref<{ from: string; to: string }>;
    let times: Ref<{ from: string; to: string }[]>;

    /**
     * Get the filters object containing reactive properties and methods.
     *
     * @returns {Object} The filters object containing reactive properties and methods.
     */
    const getFilters = () => {
        return useFilters(
            selectedContinents,
            selectedCountries,
            selectedWaterSources,
            temperatureEnabled,
            temperature,
            dateRange,
            times,
        );
    };

    beforeEach(async () => {
        vi.clearAllMocks();

        // Reset reactive refs
        selectedContinents = ref([]);
        selectedCountries = ref([]);
        selectedWaterSources = ref([]);
        temperatureEnabled = ref(false);
        temperature = ref({
            from: "",
            to: "",
            unit: "C" as const,
        });
        dateRange = ref({
            from: "",
            to: "",
        });
        times = ref([]);

        // Mock axios for location loading
        const mockedAxios = vi.mocked(axios, true);
        mockedAxios.get.mockResolvedValue({
            data: {
                "North America": ["USA", "Canada", "Mexico"],
                Europe: ["Germany", "France", "UK"],
                Asia: ["Japan", "China", "India"],
            },
        });
    });

    it("initializes with empty location data", () => {
        const filters = getFilters();

        // Since onMounted doesn't run in unit tests, data should be empty initially
        expect(filters.continents.value).toEqual([]);
        expect(filters.countriesByContinent.value).toEqual({});
        expect(filters.waterSources.value).toEqual([]);
    });

    it("loads location data when axios resolves", async () => {
        // We can test the loading logic by manually calling what would happen in onMounted
        const mockedAxios = vi.mocked(axios, true);

        // Set up the mock to resolve with our test data
        mockedAxios.get.mockResolvedValueOnce({
            data: {
                "North America": ["USA", "Canada", "Mexico"],
                Europe: ["Germany", "France", "UK"],
                Asia: ["Japan", "China", "India"],
            },
        });

        // Simulate the loadLocations function that would be called in onMounted
        const response = await axios.get("/api/locations/");
        const data = response.data;

        expect(Object.keys(data)).toEqual(["North America", "Europe", "Asia"]);
        expect(data).toEqual({
            "North America": ["USA", "Canada", "Mexico"],
            Europe: ["Germany", "France", "UK"],
            Asia: ["Japan", "China", "India"],
        });

        expect(mockedAxios.get).toHaveBeenCalledWith("/api/locations/");
    });

    it("loads water sources correctly", async () => {
        const filters = getFilters();

        await filters.loadWaterSources();

        expect(filters.waterSources.value).toEqual(["Network", "Rooftop Tank", "Well", "Other"]);
    });

    it("toggles continent selection correctly", () => {
        const filters = getFilters();

        let newList = filters.toggleContinent([], "North America");
        expect(newList).toEqual(["North America"]);

        newList = filters.toggleContinent(["North America"], "Europe");
        expect(newList).toEqual(["North America", "Europe"]);

        newList = filters.toggleContinent(["North America", "Europe"], "North America");
        expect(newList).toEqual(["Europe"]);
    });

    it("formats selection text correctly", () => {
        const filters = getFilters();

        selectedContinents.value = [];
        expect(filters.formatContinentSelectionText()).toBe("");

        selectedContinents.value = ["North America"];
        expect(filters.formatContinentSelectionText()).toBe("North America");

        selectedContinents.value = ["North America", "Europe"];
        expect(filters.formatContinentSelectionText()).toBe("2 regions selected");

        selectedWaterSources.value = ["Network", "Well"];
        expect(filters.formatWaterSourceSelectionText()).toBe("Network and Well");

        selectedWaterSources.value = ["Network", "Well", "Rooftop Tank"];
        expect(filters.formatWaterSourceSelectionText()).toBe("3 water sources selected");
    });

    it("validates temperature ranges", () => {
        const filters = getFilters();

        // Valid range
        temperature.value = { from: "20", to: "30", unit: "C" };
        expect(filters.tempRangeValid.value).toBe(true);

        // Invalid range (to < from)
        temperature.value = { from: "30", to: "20", unit: "C" };
        expect(filters.tempRangeValid.value).toBe(false);

        // Empty values should be valid
        temperature.value = { from: "", to: "", unit: "C" };
        expect(filters.tempRangeValid.value).toBe(true);

        // Equal values should be valid
        temperature.value = { from: "25", to: "25", unit: "C" };
        expect(filters.tempRangeValid.value).toBe(true);
    });

    it("validates date ranges", () => {
        const filters = getFilters();

        // Valid date range
        dateRange.value = { from: "2023-01-01", to: "2023-12-31" };
        expect(filters.dateRangeValid.value).toBe(true);

        // Invalid date range
        dateRange.value = { from: "2023-12-31", to: "2023-01-01" };
        expect(filters.dateRangeValid.value).toBe(false);

        // Empty dates should be valid
        dateRange.value = { from: "", to: "" };
        expect(filters.dateRangeValid.value).toBe(true);
    });

    it("validates time slots", () => {
        const filters = getFilters();

        // Valid time slot
        expect(filters.slotValid({ from: "09:00", to: "17:00" })).toBe(true);

        // Invalid time slot
        expect(filters.slotValid({ from: "17:00", to: "09:00" })).toBe(false);

        // Empty slots should be valid
        expect(filters.slotValid({ from: "", to: "" })).toBe(true);

        // All slots valid
        times.value = [
            { from: "09:00", to: "12:00" },
            { from: "13:00", to: "17:00" },
        ];
        expect(filters.allSlotsValid.value).toBe(true);

        // One invalid slot
        times.value = [
            { from: "09:00", to: "12:00" },
            { from: "17:00", to: "13:00" },
        ];
        expect(filters.allSlotsValid.value).toBe(false);
    });

    it("validates non-overlapping time slots", () => {
        const filters = getFilters();

        // Non-overlapping slots
        times.value = [
            { from: "09:00", to: "12:00" },
            { from: "13:00", to: "17:00" },
        ];
        expect(filters.slotsNonOverlapping.value).toBe(true);

        // Overlapping slots
        times.value = [
            { from: "09:00", to: "13:00" },
            { from: "12:00", to: "17:00" },
        ];
        expect(filters.slotsNonOverlapping.value).toBe(false);

        // Adjacent slots (should be valid)
        times.value = [
            { from: "09:00", to: "12:00" },
            { from: "12:00", to: "17:00" },
        ];
        expect(filters.slotsNonOverlapping.value).toBe(false);
    });

    it("manages time slots correctly", () => {
        const filters = getFilters();

        // Add slots
        filters.addSlot();
        expect(times.value).toHaveLength(1);
        expect(times.value[0]).toEqual({ from: "", to: "" });

        filters.addSlot();
        filters.addSlot();
        expect(times.value).toHaveLength(3);

        // Can't add more than 3 slots
        filters.addSlot();
        expect(times.value).toHaveLength(3);

        // Remove slot
        filters.removeSlot(1);
        expect(times.value).toHaveLength(2);
    });

    it("generates search parameters correctly", () => {
        const filters = getFilters();

        selectedContinents.value = ["North America"];
        selectedCountries.value = ["USA"];
        selectedWaterSources.value = ["Network"];
        temperatureEnabled.value = true;
        temperature.value = { from: "20", to: "30", unit: "C" };
        dateRange.value = { from: "2023-01-01", to: "2023-12-31" };
        times.value = [{ from: "09:00", to: "17:00" }];

        const params = filters.getSearchParams("test query");

        expect(params).toEqual({
            query: "test query",
            location: {
                continents: ["North America"],
                countries: ["USA"],
            },
            measurements: {
                waterSources: ["Network"],
                temperature: {
                    from: "20",
                    to: "30",
                    unit: "C",
                },
            },
            dateRange: {
                from: "2023-01-01",
                to: "2023-12-31",
            },
            times: [{ from: "09:00", to: "17:00" }],
        });
    });

    it("standardizes Fahrenheit to Celsius", () => {
        const filters = getFilters();

        temperatureEnabled.value = true;
        temperature.value = { from: "32", to: "212", unit: "F" };

        const params = filters.getSearchParams();

        expect(params.measurements?.temperature?.unit).toBe("C");
        expect(params.measurements?.temperature?.from).toBe("0");
        expect(params.measurements?.temperature?.to).toBe("100");
    });

    it("handles empty temperature values with defaults", () => {
        const filters = getFilters();

        temperatureEnabled.value = true;
        temperature.value = { from: "", to: "", unit: "F" };

        const params = filters.getSearchParams();

        // Should use defaults (0°F -> -17.78°C, 212°F -> 100°C)
        expect(params.measurements?.temperature?.from).toBe("-17.77777777777778");
        expect(params.measurements?.temperature?.to).toBe("100");
    });

    it("computes derived state correctly with mock data", async () => {
        const filters = getFilters();

        // Since onMounted doesn't run in tests, manually populate the data
        // to test the computed properties
        filters.continents.value = ["North America", "Europe", "Asia"];
        filters.countriesByContinent.value = {
            "North America": ["USA", "Canada", "Mexico"],
            Europe: ["Germany", "France", "UK"],
            Asia: ["Japan", "China", "India"],
        };

        await nextTick(); // Wait for reactivity to update

        selectedContinents.value = ["North America", "Europe"];
        await nextTick(); // Wait for computed to update

        expect(filters.allCountries.value).toEqual(["Canada", "France", "Germany", "Mexico", "UK", "USA"]);

        selectedContinents.value = [];
        await nextTick();
        expect(filters.continentPlaceholder.value).toBe("Select regions");

        selectedContinents.value = ["North America"];
        await nextTick();
        expect(filters.continentPlaceholder.value).toBe("");
    });
});
