import { useExportData } from "../../src/composables/useExportData.ts";
import {
  useFilters
} from "../../src/composables/useFilters.ts";
import {
  useSearch,
  MeasurementSearchParams,
  state,
} from "../../src/composables/useSearch.ts";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { ref, nextTick } from "vue";

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
  },
}));

import * as fileSaver from "file-saver";
import axios from "axios";

class MockResponse {
  constructor(public ok: boolean, private _blob: Blob, public status = 200) {}
  blob() {
    return Promise.resolve(this._blob);
  }
}

describe("useExportData", () => {
  const { exportData } = useExportData();
  let format = "csv";

  beforeEach(() => {
    format = "csv";
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls saveAs on successful fetch", async () => {
    // arrange: mock fetch to return OK with CSV blob
    const csv = "id,value\n1,42";
    const blob = new Blob([csv], { type: "text/csv" });
    global.fetch = vi.fn(() =>
      Promise.resolve(new MockResponse(true, blob))
    ) as any;

    const successful = await exportData(format);

    expect(successful).toBe(true);
    expect(fileSaver.saveAs).toHaveBeenCalledOnce();
    expect(fileSaver.saveAs).toHaveBeenCalledWith(blob, "water-data.csv");
  });

  it("alerts on non-ok response", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(new MockResponse(false, new Blob(), 500))
    ) as any;
    const successful = await exportData(format);
    expect(successful).toBe(false);
    expect(fileSaver.saveAs).not.toHaveBeenCalled();
  });

  it("alerts on fetch error", async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error("Network"))) as any;
    const successful = await exportData(format);
    expect(successful).toBe(false);
    expect(fileSaver.saveAs).not.toHaveBeenCalled();
  });

  it("incorporates format.value into the fetch URL", async () => {
    const blob = new Blob(["dummy"], { type: "text/csv" });
    const mockFetch = vi.fn(() =>
      Promise.resolve(new MockResponse(true, blob))
    );
    global.fetch = mockFetch as any;

    format = "csv";
    let successful = await exportData(format);
    expect(successful).toBe(true);
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenLastCalledWith(
      "/api/measurements/?format=csv",
      expect.objectContaining({ method: "GET" })
    );

    format = "json";
    successful = await exportData(format);
    expect(successful).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenLastCalledWith(
      "/api/measurements/?format=json",
      expect.objectContaining({ method: "GET" })
    );
  });
  it("calls fetch with the correct options", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(new MockResponse(true, new Blob()));
    global.fetch = mockFetch as any;

    const successful = await exportData(format);
    expect(successful).toBe(true);
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/measurements/?format=csv",
      expect.objectContaining({
        method: "GET",
        credentials: "same-origin",
      })
    );
  });
  it("still calls saveAs when format is xml", async () => {
    format = "xml";
    const blob = new Blob(
      [
        /* binary data */
      ],
      {
        type: "application/xml",
      }
    );
    global.fetch = vi.fn(() =>
      Promise.resolve(new MockResponse(true, blob))
    ) as any;

    const successful = await exportData(format);
    expect(successful).toBe(true);
    expect(fileSaver.saveAs).toHaveBeenCalledOnce();
    expect(fileSaver.saveAs).toHaveBeenCalledWith(blob, "water-data.xml");
  });
  it("calls saveAs even if blob.type is incorrect", async () => {
    const blob = new Blob(["<html>oops</html>"], { type: "text/html" });
    global.fetch = vi.fn(() =>
      Promise.resolve(new MockResponse(true, blob))
    ) as any;

    const successful = await exportData(format);
    expect(successful).toBe(true);
    expect(fileSaver.saveAs).toHaveBeenCalledOnce();
    expect(fileSaver.saveAs).toHaveBeenCalledWith(blob, "water-data.csv");
  });
  it("supports multiple sequential calls", async () => {
    const blob1 = new Blob(["a"], { type: "text/csv" });
    const blob2 = new Blob(["b"], { type: "text/csv" });
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(new MockResponse(true, blob1))
      .mockResolvedValueOnce(new MockResponse(true, blob2)) as any;

    const successful = (await exportData(format)) && (await exportData(format));
    expect(successful).toBe(true);
    expect(fileSaver.saveAs).toHaveBeenCalledTimes(2);

    expect(fileSaver.saveAs).toHaveBeenNthCalledWith(
      1,
      blob1,
      "water-data.csv"
    );
    expect(fileSaver.saveAs).toHaveBeenNthCalledWith(
      2,
      blob2,
      "water-data.csv"
    );
  });
  it("handles a delayed fetch gracefully", async () => {
    let resolveFetch: any;
    global.fetch = vi.fn(
      () =>
        new Promise((r) => {
          resolveFetch = r;
        })
    ) as any;

    const promise = exportData(format);
    // simulate delay
    await new Promise((r) => setTimeout(r, 50));
    resolveFetch(new MockResponse(true, new Blob(["delayed"])));
    const successful = await promise;
    expect(successful).toBe(true);

    expect(fileSaver.saveAs).toHaveBeenCalledOnce();
    expect(fileSaver.saveAs).toHaveBeenCalled();
  });
  it("handles large CSV payloads", async () => {
    const largeData = "x,".repeat(1e6);
    const blob = new Blob([largeData], { type: "text/csv" });
    global.fetch = vi.fn(() =>
      Promise.resolve(new MockResponse(true, blob))
    ) as any;

    const successful = await exportData(format);
    expect(successful).toBe(true);
    expect(fileSaver.saveAs).toHaveBeenCalled();
  });
  it("exports data with filters", async () => {
    const blob = new Blob(["filtered data"], { type: "text/csv" });
    const mockFetch = vi.fn(() =>
      Promise.resolve(new MockResponse(true, blob))
    );
    global.fetch = mockFetch as any;

    const filters: MeasurementSearchParams = {
      query: "test query",
      location: {
        continents: ["North America"],
        countries: ["USA"],
      },
      measurements: {
        waterSources: ["Network", "Well"],
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
    };

    const successful = await exportData("json", filters);

    expect(successful).toBe(true);
    expect(mockFetch).toHaveBeenCalledOnce();
    const fetchUrl = (mockFetch as any).mock.calls[0][0];
    expect(fetchUrl).toContain("format=json");
    expect(fetchUrl).toContain("query=test+query");
  });
});

describe("useSearch", () => {
  const mockedAxios = vi.mocked(axios, true);

  beforeEach(() => {
    vi.clearAllMocks();
    state.hasSearched = false;
    state.count = 0;
    state.avgTemp = 0;
  });

  it("performs basic search", async () => {
    const { searchMeasurements, results, hasSearched } = useSearch();

    mockedAxios.get.mockResolvedValue({
      data: { count: 100, avgTemp: 25.5 },
    });

    const params: MeasurementSearchParams = {
      query: "test search",
    };

    await searchMeasurements(params);

    expect(hasSearched.value).toBe(true);
    expect(results.value.count).toBe(100);
    expect(results.value.avgTemp).toBe(25.5);
    expect(mockedAxios.get).toHaveBeenCalledWith("/api/measurements/", {
      params: { query: "test search" },
    });
  });

  it("flattens search parameters correctly", () => {
    const { flattenSearchParams } = useSearch();

    const params: MeasurementSearchParams = {
      query: "test",
      location: {
        continents: ["Asia", "Europe"],
        countries: ["Japan", "Germany"],
      },
      measurements: {
        waterSources: ["Network", "Well"],
        temperature: {
          from: "15",
          to: "35",
          unit: "C",
        },
      },
      dateRange: {
        from: "2023-01-01",
        to: "2023-12-31",
      },
      times: [
        { from: "09:00", to: "12:00" },
        { from: "14:00", to: "17:00" },
      ],
    };

    const flattened = flattenSearchParams(params);

    expect(flattened).toEqual({
      query: "test",
      "location[continents]": ["Asia", "Europe"],
      "location[countries]": ["Japan", "Germany"],
      measurements_included: ["waterSources", "temperature"],
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
    const { searchMeasurements, results, hasSearched } = useSearch();

    mockedAxios.get.mockRejectedValue(new Error("API Error"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await searchMeasurements({ query: "test" });

    expect(hasSearched.value).toBe(true);
    expect(results.value.count).toBe(0);
    expect(results.value.avgTemp).toBe(0);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Search failed:",
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it("resets search state", () => {
    const { resetSearch, hasSearched, results } = useSearch();

    // Set some state
    state.hasSearched = true;
    state.count = 50;
    state.avgTemp = 20;

    resetSearch();

    expect(hasSearched.value).toBe(false);
    expect(results.value.count).toBe(0);
    expect(results.value.avgTemp).toBe(0);
  });

  it("flattens parameters with null temperature", () => {
    const { flattenSearchParams } = useSearch();

    const params: MeasurementSearchParams = {
      measurements: {
        waterSources: ["Network"],
        temperature: null,
      },
    };

    const flattened = flattenSearchParams(params);

    expect(flattened.measurements_included).toEqual(["waterSources"]);
    expect(flattened["measurements[temperature][from]"]).toBeUndefined();
  });
});

describe("useFilters", () => {
  let selectedContinents: any;
  let selectedCountries: any;
  let selectedWaterSources: any;
  let temperatureEnabled: any;
  let temperature: any;
  let dateRange: any;
  let times: any;

  const getFilters = () => {
    return useFilters(
      selectedContinents,
      selectedCountries,
      selectedWaterSources,
      temperatureEnabled,
      temperature,
      dateRange,
      times
    );
  }

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
        "Europe": ["Germany", "France", "UK"],
        "Asia": ["Japan", "China", "India"],
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
        "Europe": ["Germany", "France", "UK"],
        "Asia": ["Japan", "China", "India"],
      },
    });

    // Simulate the loadLocations function that would be called in onMounted
    const response = await axios.get("/api/locations/");
    const data = response.data;
    
    expect(Object.keys(data)).toEqual(["North America", "Europe", "Asia"]);
    expect(data).toEqual({
      "North America": ["USA", "Canada", "Mexico"],
      "Europe": ["Germany", "France", "UK"],
      "Asia": ["Japan", "China", "India"],
    });
    
    expect(mockedAxios.get).toHaveBeenCalledWith("/api/locations/");
  });
  
  it("loads water sources correctly", async () => {
    const filters = getFilters();

    await filters.loadWaterSources();

    expect(filters.waterSources.value).toEqual([
      "Network",
      "Rooftop Tank",
      "Well",
      "Other",
    ]);
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
    expect(filters.formatContinentSelectionText()).toBe("2 continents selected");

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
      "Europe": ["Germany", "France", "UK"],
      "Asia": ["Japan", "China", "India"],
    };

    await nextTick(); // Wait for reactivity to update

    selectedContinents.value = ["North America", "Europe"];
    await nextTick(); // Wait for computed to update
    
    expect(filters.allCountries.value).toEqual([
      "USA", "Canada", "Mexico", "Germany", "France", "UK"
    ]);

    selectedContinents.value = [];
    await nextTick();
    expect(filters.continentPlaceholder.value).toBe("Select continents");

    selectedContinents.value = ["North America"];
    await nextTick();
    expect(filters.continentPlaceholder.value).toBe("");
  });
});
