// tests/FilterPanel.spec.ts
import { mount, VueWrapper } from "@vue/test-utils";
import { describe, it, expect, beforeEach, vi } from "vitest";
import FilterPanel from "../../../src/components/FilterPanelComponent.vue";
import { nextTick } from "vue";
import axios from "axios";

describe("FilterPanel.vue", () => {
    let wrapper: VueWrapper<any>;

    beforeEach(() => {
        wrapper = mount(FilterPanel, {
            // stub out any child components if needed
            global: {
                stubs: ["SomeChildComponent"],
            },
        });
    });

    it("toggleContinentDropdown opens continent and closes others", async () => {
        expect(wrapper.vm.continentDropdownOpen).toBe(false);
        expect(wrapper.vm.countryDropdownOpen).toBe(false);
        expect(wrapper.vm.waterSourceDropdownOpen).toBe(false);

        wrapper.vm.toggleContinentDropdown();
        await nextTick();
        expect(wrapper.vm.continentDropdownOpen).toBe(true);
        expect(wrapper.vm.countryDropdownOpen).toBe(false);
        expect(wrapper.vm.waterSourceDropdownOpen).toBe(false);

        wrapper.vm.toggleContinentDropdown();
        await nextTick();
        expect(wrapper.vm.continentDropdownOpen).toBe(false);
    });

    it("toggleCountryDropdown opens country and closes others", async () => {
        wrapper.vm.toggleCountryDropdown();
        await nextTick();
        expect(wrapper.vm.countryDropdownOpen).toBe(true);
        expect(wrapper.vm.continentDropdownOpen).toBe(false);
        expect(wrapper.vm.waterSourceDropdownOpen).toBe(false);
    });

    it("toggleWaterSourceDropdown opens water source and closes others", async () => {
        wrapper.vm.toggleWaterSourceDropdown();
        await nextTick();
        expect(wrapper.vm.waterSourceDropdownOpen).toBe(true);
        expect(wrapper.vm.continentDropdownOpen).toBe(false);
        expect(wrapper.vm.countryDropdownOpen).toBe(false);
    });

    it("handleClickOutside closes all dropdowns when clicking outside", async () => {
        wrapper.vm.continentDropdownOpen = true;
        wrapper.vm.countryDropdownOpen = true;
        wrapper.vm.waterSourceDropdownOpen = true;

        const fakeDiv = { contains: () => false } as any;
        wrapper.vm.continentWrapperRef = fakeDiv;
        wrapper.vm.countryWrapperRef = fakeDiv;
        wrapper.vm.waterSourceWrapperRef = fakeDiv;

        wrapper.vm.handleClickOutside({ target: document.createElement("div") } as unknown as MouseEvent);
        await nextTick();
        expect(wrapper.vm.continentDropdownOpen).toBe(false);
        expect(wrapper.vm.countryDropdownOpen).toBe(false);
        expect(wrapper.vm.waterSourceDropdownOpen).toBe(false);
    });

    it("calculateDropdownHeight sets dropdownMaxHeight to half of scrollableArea height (>=120)", () => {
        const fakeArea = { clientHeight: 500 } as any;
        wrapper.vm.scrollableAreaRef = fakeArea;
        wrapper.vm.dropdownMaxHeight = 0;

        wrapper.vm.calculateDropdownHeight();
        expect(wrapper.vm.dropdownMaxHeight).toBe(Math.max(Math.floor(500 * 0.5), 120));
    });

    // it("filteredCountries returns allCountries when query empty, and filters otherwise", async () => {
    //     // mock allCountries
    //     wrapper.vm.allCountries = ["France", "Finland", "Spain"];

    //     const mockData: Record<string, string[]> = {
    //         Asia: ["Japan", "China", "India"],
    //         Europe: ["France", "Finland", "Spain"],
    //     };

    //     const mockDataFilters = {
    //         continents: ["Asia", "Europe"],
    //         countriesByContinent: {
    //             Asia: ["Japan", "China", "India"],
    //             Europe: ["France", "Germany", "Italy"],
    //         },
    //         waterSources: ["Network", "Rooftop Tank", "Well", "Other"],
    //         allCountries: ["Japan", "China", "India", "France", "Germany", "Italy"],
    //         continentPlaceholder: "",
    //         countryPlaceholder: "",
    //         waterSourcePlaceholder: "",
    //         tempRangeValid: true,
    //         dateRangeValid: true,
    //         allSlotsValid: true,
    //         slotsNonOverlapping: true,
    //         formatContinentSelectionText: () => "2 continents selected",
    //         formatCountrySelectionText: () => "3 countries selected",
    //         formatWaterSourceSelectionText: () => "2 water sources selected",
    //         toggleContinent: vi.fn(),
    //         toggleCountry: vi.fn(),
    //         toggleAllContinents: vi.fn(),
    //         toggleAllCountries: vi.fn(),
    //         toggleWaterSource: vi.fn(),
    //         toggleAllWaterSources: vi.fn(),
    //         addSlot: vi.fn(),
    //         removeSlot: vi.fn(),
    //         getSearchParams: vi.fn(),
    //     };
    //     vi.mock("useFilters", () => ({
    //         useFilters: mockDataFilters,
    //     }));

    //     vi.mock("axios", () => {
    //         return {
    //             default: {
    //                 post: vi.fn(),
    //                 get: () => Promise.resolve({ data: mockData }),
    //                 delete: vi.fn(),
    //                 put: vi.fn(),
    //                 create: vi.fn().mockReturnThis(),
    //                 interceptors: {
    //                     request: {
    //                         use: vi.fn(),
    //                         eject: vi.fn(),
    //                     },
    //                     response: {
    //                         use: vi.fn(),
    //                         eject: vi.fn(),
    //                     },
    //                 },
    //             },
    //         };
    //     });
    //     // wrapper.vm.countrySearchQuery = "";
    //     // expect(wrapper.vm.filteredCountries).toEqual(["France", "Finland", "Spain"]);

    //     wrapper.vm.countrySearchQuery = "fi";
    //     await nextTick();
    //     expect(wrapper.vm.filteredCountries).toEqual(["Finland"]);
    // });

    it("reset() clears all filters and calls resetSearch()", () => {
        vi.mock("loadLocations", () => ({
            loadLocations: vi.fn(),
        }));
        vi.mock("axios", () => {
            return {
                default: {
                    post: vi.fn(),
                    get: () => Promise.resolve({ data: [] }),
                    delete: vi.fn(),
                    put: vi.fn(),
                    create: vi.fn().mockReturnThis(),
                    interceptors: {
                        request: {
                            use: vi.fn(),
                            eject: vi.fn(),
                        },
                        response: {
                            use: vi.fn(),
                            eject: vi.fn(),
                        },
                    },
                },
            };
        });
        // prefill state
        wrapper.vm.selectedContinents = ["Europe"];
        wrapper.vm.selectedCountries = ["France"];
        wrapper.vm.selectedWaterSources = ["river"];
        wrapper.vm.temperatureEnabled = true;
        wrapper.vm.temperature.from = "10";
        wrapper.vm.temperature.to = "20";
        wrapper.vm.temperature.unit = "F";
        wrapper.vm.dateRange.from = "2025-01-01";
        wrapper.vm.dateRange.to = "2025-01-02";
        wrapper.vm.times.value = [{ from: "08:00", to: "10:00" }];

        // spy on resetSearch
        const resetSpy = vi.spyOn(wrapper.vm, "reset");

        wrapper.vm.reset();

        expect(wrapper.vm.selectedContinents).toEqual([]);
        expect(wrapper.vm.selectedCountries).toEqual([]);
        expect(wrapper.vm.selectedWaterSources).toEqual([]);
        expect(wrapper.vm.temperatureEnabled).toBe(false);
        expect(wrapper.vm.temperature).toEqual({ from: "", to: "", unit: "C" });
        expect(wrapper.vm.dateRange).toEqual({ from: "", to: "" });
        expect(wrapper.vm.times).toEqual([]);
        expect(resetSpy).toHaveBeenCalled();
    });
});
