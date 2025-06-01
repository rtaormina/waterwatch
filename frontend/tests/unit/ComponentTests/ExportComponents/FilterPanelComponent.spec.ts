import { flushPromises, mount, VueWrapper } from "@vue/test-utils";
import { describe, it, expect, beforeEach, vi } from "vitest";
import FilterPanel from "../../../../src/components/FilterPanelComponent.vue";
import { nextTick } from "vue";
import { afterEach } from "node:test";
import { Filters } from "../../../../src/composables/usePresets";
import FilterPanelComponent from "../../../../src/components/FilterPanelComponent.vue";

const mockUseFilters = {
    continents: ["Asia", "Europe"],
    countriesByContinent: {
        Asia: ["Japan", "China", "India"],
        Europe: ["France", "Germany", "Italy"],
    },
    loadLocations: vi.fn(),
    allCountries: ["Japan", "China", "India", "France", "Germany", "Italy"],
    continentPlaceholder: "Select continents",
    countryPlaceholder: "Select countries",
    toggleContinent: vi.fn(),
    toggleCountry: vi.fn(),
    toggleAllContinents: vi.fn(),
    toggleAllCountries: vi.fn(),
    toggleWaterSource: vi.fn(),
    toggleAllWaterSources: vi.fn(),
    formatContinentSelectionText: () => "2 continents selected",
    formatCountrySelectionText: () => "3 countries selected",
    waterSources: ["Network", "Rooftop Tank", "Well", "Other"],
    loadWaterSources: vi.fn(),
    formatWaterSourceSelectionText: () => "2 water sources selected",
    waterSourcePlaceholder: "Select water sources",
    tempRangeValid: true,
    dateRangeValid: true,
    slotValid: vi.fn(),
    allSlotsValid: true,
    slotsNonOverlapping: true,
    addSlot: vi.fn(),
    removeSlot: vi.fn(),
    getSearchParams: vi.fn(),
};

const mockUseSearch = {
    resetSearch: vi.fn(),
};

vi.mock("useFilters", () => ({
    useFilters: mockUseFilters,
}));

vi.mock("../../../../src/composables/useSearch", () => ({
    useSearch: () => mockUseSearch,
}));

const StubArrow = { template: "<span/>" };
const StubCheck = { template: "<span/>" };
const StubLocationFallback = { template: '<div data-testid="stub-map"/>' };

vi.mock("vue", async () => {
    const actual = await vi.importActual("vue");
    return {
        ...actual,
        nextTick: vi.fn().mockImplementation((fn) => Promise.resolve().then(fn)),
    };
});

describe("FilterPanelComponent.vue - country filtering UI", () => {
    let wrapper: VueWrapper<any>;

    beforeEach(() => {
        wrapper = mount(FilterPanel, {
            global: {
                stubs: {
                    LocationFallback: StubLocationFallback,
                    ChevronDownIcon: StubArrow,
                    CheckIcon: StubCheck,
                },
            },
        });

        const mockData: Record<string, string[]> = {
            Asia: ["Japan", "China", "India"],
            Europe: ["France", "Finland", "Spain"],
        };

        vi.mock("axios", () => {
            return {
                default: {
                    post: vi.fn(),
                    get: () => Promise.resolve({ data: mockData }),
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
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("opens continents dropdown, allows for selection and deselection", async () => {
        wrapper.vm.selectedContinents = [];
        wrapper.vm.allCountries = ["Japan", "China", "India", "France", "Germany", "Italy"];
        wrapper.vm.countrySearchQuery = "";
        wrapper.vm.toggleCountryDropdown();
        expect((wrapper.vm as any).countryDropdownOpen).toBe(true);
        const searchInput = wrapper.findAll('[data-testid="continent-placeholder"]')[0];
        expect(searchInput.exists()).toBe(true);
        expect(searchInput.text()).toBe("Select continents");
        await nextTick();

        const filteredOptions = wrapper.findAll('[data-testid="continent-options"] .multiselect-option');
        expect(filteredOptions.length).toBe(2);
        expect(filteredOptions[0].text()).toContain("Asia");

        const allOptions = wrapper.findAll('[data-testid="continent-options"] .multiselect-option');
        expect(allOptions.length).toBe(2);

        const secondOption = allOptions[0];
        const thirdOption = allOptions[1];
        expect(secondOption.text()).toContain("Asia");
        expect(thirdOption.text()).toContain("Europe");
        await secondOption.trigger("click");
        await wrapper.vm.$nextTick();

        await thirdOption.trigger("click");
        await wrapper.vm.$nextTick();

        const displayText = wrapper.find('[data-testid="continent-text"]');

        expect(wrapper.vm.selectedContinents).toContain("Asia");
        expect(wrapper.vm.selectedContinents).toContain("Europe");
        expect(displayText.text()).toBe("2 continents selected");

        await thirdOption.trigger("click");
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.selectedContinents).not.toContain("Europe");
        expect(displayText.text()).toBe("Asia");
    });

    it("opens countries dropdown, allows for selection and deselection", async () => {
        wrapper.vm.selectedContinents = ["Asia", "Europe"];
        wrapper.vm.allCountries = ["Japan", "China", "India", "France", "Germany", "Italy"];
        wrapper.vm.selectedCountries = [];
        wrapper.vm.countrySearchQuery = "";
        wrapper.vm.toggleCountryDropdown();
        expect((wrapper.vm as any).countryDropdownOpen).toBe(true);
        const searchInput = wrapper.findAll('[data-testid="country-placeholder"]')[0];
        expect(searchInput.exists()).toBe(true);
        expect(searchInput.text()).toBe("Select countries");
        await nextTick();
        const searchbar = wrapper.find('input[placeholder="Search countries..."]');
        expect(searchInput.exists()).toBe(true);
        await searchbar.setValue("J");
        const filteredOptions = wrapper.findAll('[data-testid="country-options"] .multiselect-option');
        expect(filteredOptions.length).toBe(1);
        expect(filteredOptions[0].text()).toContain("Japan");
        await searchbar.setValue("");
        await nextTick();

        const allOptions = wrapper.findAll('[data-testid="country-options"] .multiselect-option');
        expect(allOptions.length).toBe(6);

        const secondOption = allOptions[0];
        const thirdOption = allOptions[1];
        expect(secondOption.text()).toContain("China");
        expect(thirdOption.text()).toContain("Finland");
        await secondOption.trigger("click");
        await wrapper.vm.$nextTick();

        await thirdOption.trigger("click");
        await wrapper.vm.$nextTick();

        const displayText = wrapper.find('[data-testid="country-text"]');

        expect(wrapper.vm.selectedCountries).not.toContain("China");
        expect(wrapper.vm.selectedCountries).not.toContain("Finland");
        expect(displayText.text()).toBe("4 countries selected");

        await thirdOption.trigger("click");
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.selectedCountries).not.toContain("China");
        expect(displayText.text()).toBe("5 countries selected");
    });

    it("opens the water sources dropdown, allows for selection and deselection", async () => {
        wrapper.vm.selectedWaterSources = [];
        wrapper.vm.toggleWaterSourceDropdown();
        expect((wrapper.vm as any).waterSourceDropdownOpen).toBe(true);

        const searchInput = wrapper.findAll('[data-testid="measurement-type-placeholder"]')[0];
        expect(searchInput.exists()).toBe(true);
        expect(searchInput.text()).toBe("Select water sources");
        await nextTick();
        const allOptions = wrapper.findAll('[data-testid="dropdown-options"] .multiselect-option');

        expect(allOptions.length).toBe(4);

        const secondOption = allOptions[1];
        expect(secondOption.text()).toContain("Rooftop Tank");

        await secondOption.trigger("click");
        await wrapper.vm.$nextTick();

        const displayText = wrapper.find('[data-testid="formated-water-sources"]');

        expect(wrapper.vm.selectedWaterSources).toContain("Rooftop Tank");
        expect(displayText.text()).toBe("Rooftop Tank");
        const thirdOption = allOptions[2];
        expect(thirdOption.text()).toContain("Well");

        await thirdOption.trigger("click");
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.selectedWaterSources).toContain("Well");

        const optionLabels = wrapper
            .findAll('[data-testid="dropdown-options"] .multiselect-option span:last-child')
            .map((w) => w.text());

        expect(optionLabels).toEqual(["Network", "Rooftop Tank", "Well", "Other"]);
        expect(displayText.text()).toBe("Rooftop Tank and Well");
        await secondOption.trigger("click");
        await wrapper.vm.$nextTick();

        expect(displayText.text()).toBe("Well");
    });
});

describe("FilterPanelComponent.vue", () => {
    let wrapper: VueWrapper<any>;

    beforeEach(() => {
        wrapper = mount(FilterPanel, {
            global: {
                stubs: {
                    UCheckbox: {
                        template: '<input type="checkbox" />',
                    },
                },
            },
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
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

    it("toggleContinentDropdown opens one and closes others", async () => {
        expect(wrapper.vm.continentDropdownOpen).toBe(false);
        expect(wrapper.vm.countryDropdownOpen).toBe(false);
        expect(wrapper.vm.waterSourceDropdownOpen).toBe(false);

        wrapper.vm.toggleContinentDropdown();
        await nextTick();
        expect(wrapper.vm.continentDropdownOpen).toBe(true);
        expect(wrapper.vm.countryDropdownOpen).toBe(false);
        expect(wrapper.vm.waterSourceDropdownOpen).toBe(false);

        wrapper.vm.toggleCountryDropdown();
        await nextTick();
        expect(wrapper.vm.continentDropdownOpen).toBe(false);
        expect(wrapper.vm.countryDropdownOpen).toBe(true);
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
        const fakeArea = { clientHeight: 400 } as any;
        wrapper.vm.scrollableAreaRef = fakeArea;
        wrapper.vm.dropdownMaxHeight = 0;

        wrapper.vm.calculateDropdownHeight();
        expect(wrapper.vm.dropdownMaxHeight).toBe(200);
    });

    it("clearSearchOnClose resets search queries when closing dropdowns", async () => {
        wrapper.vm.countrySearchQuery = "test";
        wrapper.vm.clearSearchOnClose();
        await nextTick();
        expect(wrapper.vm.countrySearchQuery).toBe("");
    });

    it("reset() clears all filters and calls resetSearch()", () => {
        vi.mock("axios", () => {
            return {
                default: {
                    post: vi.fn(),
                    get: () =>
                        Promise.resolve({
                            data: {
                                Asia: ["Japan", "China", "India"],
                                Europe: ["France", "Finland", "Spain"],
                            },
                        }),
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

        wrapper.vm.reset();

        expect(mockUseSearch.resetSearch).toHaveBeenCalled();
        assertResetHappened(wrapper);
    });
});

describe("FilterPanelComponent - Preset Application", () => {
    let wrapper: VueWrapper<any>;

    const sampleFilters: Filters = {
        location: {
            continents: ["Europe", "Asia"],
            countries: ["Netherlands", "Germany", "Japan"],
        },
        measurements: {
            waterSources: ["Ocean", "River"],
            temperature: {
                from: 15,
                to: 30,
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

    const minimalFilters: Filters = {};

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    describe("Component Mounting", () => {
        it("mounts without errors", () => {
            expect(() => {
                wrapper = mount(FilterPanelComponent, {
                    global: {
                        stubs: ["Icon"],
                    },
                });
            }).not.toThrow();
        });

        it("exposes required methods and properties", () => {
            wrapper = mount(FilterPanelComponent, {
                global: {
                    stubs: ["Icon"],
                },
            });

            // Check that exposed methods exist
            expect(typeof wrapper.vm.applyFilters).toBe("function");

            // Check that validation properties exist
            expect(wrapper.vm).toHaveProperty("tempRangeValid");
            expect(wrapper.vm).toHaveProperty("dateRangeValid");
            expect(wrapper.vm).toHaveProperty("allSlotsValid");
            expect(wrapper.vm).toHaveProperty("slotsNonOverlapping");
        });
    });

    describe("applyFilters Method", () => {
        beforeEach(() => {
            wrapper = mount(FilterPanelComponent, {
                global: {
                    stubs: ["Icon"],
                },
            });
        });

        it("applies location filters correctly", async () => {
            wrapper.vm.applyFilters(sampleFilters);

            expect(mockUseSearch.resetSearch).toHaveBeenCalled();

            // Test the actual component state
            expect(wrapper.vm.selectedContinents).toEqual(["Europe", "Asia"]);
        });

        it("applies countries after nextTick", async () => {
            wrapper.vm.applyFilters(sampleFilters);

            // Wait for nextTick to process
            await flushPromises();

            expect(mockUseSearch.resetSearch).toHaveBeenCalled();

            expect(wrapper.vm.selectedCountries).toEqual(["Netherlands", "Germany", "Japan"]);
        });

        it("applies water sources correctly", () => {
            wrapper.vm.applyFilters(sampleFilters);

            expect(mockUseSearch.resetSearch).toHaveBeenCalled();

            expect(wrapper.vm.selectedWaterSources).toEqual(["Ocean", "River"]);
        });

        it("applies temperature filters correctly", () => {
            wrapper.vm.applyFilters(sampleFilters);

            expect(mockUseSearch.resetSearch).toHaveBeenCalled();

            expect(wrapper.vm.temperatureEnabled).toBe(true);
            expect(wrapper.vm.temperature.from).toBe("15");
            expect(wrapper.vm.temperature.to).toBe("30");
            expect(wrapper.vm.temperature.unit).toBe("C");
        });

        it("applies temperature filters with Fahrenheit unit", () => {
            const fahrenheitFilters = {
                ...sampleFilters,
                measurements: {
                    ...sampleFilters.measurements,
                    temperature: {
                        from: 60,
                        to: 85,
                        unit: "F" as const,
                    },
                },
            };

            wrapper.vm.applyFilters(fahrenheitFilters);

            expect(mockUseSearch.resetSearch).toHaveBeenCalled();

            expect(wrapper.vm.temperatureEnabled).toBe(true);
            expect(wrapper.vm.temperature.from).toBe("60");
            expect(wrapper.vm.temperature.to).toBe("85");
            expect(wrapper.vm.temperature.unit).toBe("F");
        });

        it("applies date range filters correctly", () => {
            wrapper.vm.applyFilters(sampleFilters);

            expect(mockUseSearch.resetSearch).toHaveBeenCalled();

            expect(wrapper.vm.dateRange.from).toBe("2023-01-01");
            expect(wrapper.vm.dateRange.to).toBe("2023-12-31");
        });

        it("applies time slot filters correctly", () => {
            wrapper.vm.applyFilters(sampleFilters);

            expect(mockUseSearch.resetSearch).toHaveBeenCalled();

            expect(wrapper.vm.times).toEqual([
                { from: "09:00", to: "12:00" },
                { from: "14:00", to: "17:00" },
            ]);
        });

        it("handles filters with missing location data", () => {
            const filtersWithoutLocation = {
                measurements: sampleFilters.measurements,
            };

            wrapper.vm.applyFilters(filtersWithoutLocation);

            expect(mockUseSearch.resetSearch).toHaveBeenCalled();

            expect(wrapper.vm.selectedContinents).toEqual([]);
            expect(wrapper.vm.selectedCountries).toEqual([]);
        });

        it("handles filters with missing measurements data", () => {
            const filtersWithoutMeasurements = {
                location: sampleFilters.location,
            };

            wrapper.vm.applyFilters(filtersWithoutMeasurements);

            // These should remain at their reset values
            expect(wrapper.vm.selectedWaterSources).toEqual([]);
            expect(wrapper.vm.temperatureEnabled).toBe(false);
        });

        it("handles filters with missing temperature data", () => {
            const filtersWithoutTemp = {
                measurements: {
                    waterSources: ["Ocean"],
                },
            };

            wrapper.vm.applyFilters(filtersWithoutTemp);

            expect(mockUseSearch.resetSearch).toHaveBeenCalled();

            expect(wrapper.vm.selectedWaterSources).toEqual(["Ocean"]);
            expect(wrapper.vm.temperatureEnabled).toBe(false);
        });

        it("handles filters with missing date range", () => {
            const filtersWithoutDateRange = {
                location: sampleFilters.location,
            };

            wrapper.vm.applyFilters(filtersWithoutDateRange);

            expect(mockUseSearch.resetSearch).toHaveBeenCalled();

            // These should remain at their reset values
            expect(wrapper.vm.dateRange.from).toBe("");
            expect(wrapper.vm.dateRange.to).toBe("");
        });

        it("handles filters with missing times", () => {
            const filtersWithoutTimes = {
                location: sampleFilters.location,
            };

            wrapper.vm.applyFilters(filtersWithoutTimes);

            expect(mockUseSearch.resetSearch).toHaveBeenCalled();

            expect(wrapper.vm.times).toEqual([]);
        });

        it("handles completely empty filters object", () => {
            wrapper.vm.applyFilters(minimalFilters);

            expect(mockUseSearch.resetSearch).toHaveBeenCalled();
            assertResetHappened(wrapper);
        });

        it("handles null temperature values", () => {
            const filtersWithNullTemp = {
                measurements: {
                    temperature: {
                        from: null,
                        to: null,
                        unit: "C" as const,
                    },
                },
            };

            wrapper.vm.applyFilters(filtersWithNullTemp);

            expect(mockUseSearch.resetSearch).toHaveBeenCalled();

            expect(wrapper.vm.temperatureEnabled).toBe(true);
            expect(wrapper.vm.temperature.from).toBe("");
            expect(wrapper.vm.temperature.to).toBe("");
            expect(wrapper.vm.temperature.unit).toBe("C");
        });

        it("handles null date range values", () => {
            const filtersWithNullDates = {
                dateRange: {
                    from: null,
                    to: null,
                },
            };

            wrapper.vm.applyFilters(filtersWithNullDates);

            expect(mockUseSearch.resetSearch).toHaveBeenCalled();

            expect(wrapper.vm.dateRange.from).toBe("");
            expect(wrapper.vm.dateRange.to).toBe("");
        });

        it("handles non-array continents gracefully", () => {
            const filtersWithBadContinents = {
                location: {
                    continents: "Europe" as any, // Wrong type
                    countries: ["Netherlands"],
                },
            };

            wrapper.vm.applyFilters(filtersWithBadContinents);

            expect(mockUseSearch.resetSearch).toHaveBeenCalled();

            // Should remain empty due to invalid data
            expect(wrapper.vm.selectedContinents).toEqual([]);
        });

        it("handles non-array water sources gracefully", () => {
            const filtersWithBadWaterSources = {
                measurements: {
                    waterSources: "Ocean" as any, // Wrong type
                },
            };

            wrapper.vm.applyFilters(filtersWithBadWaterSources);

            expect(mockUseSearch.resetSearch).toHaveBeenCalled();

            expect(wrapper.vm.selectedWaterSources).toEqual([]);
        });

        it("handles non-array times gracefully", () => {
            const filtersWithBadTimes = {
                times: "09:00-12:00" as any, // Wrong type
            };

            wrapper.vm.applyFilters(filtersWithBadTimes);

            expect(mockUseSearch.resetSearch).toHaveBeenCalled();

            expect(wrapper.vm.times).toEqual([]);
        });

        it("preserves existing time slot structure", () => {
            const filtersWithIncompleteTimeSlots = {
                times: [
                    { from: "09:00" }, // Missing 'to'
                    { to: "17:00" }, // Missing 'from'
                    { from: "14:00", to: "16:00" }, // Complete
                ],
            };

            wrapper.vm.applyFilters(filtersWithIncompleteTimeSlots);

            expect(mockUseSearch.resetSearch).toHaveBeenCalled();

            expect(wrapper.vm.times).toEqual([
                { from: "09:00", to: "" },
                { from: "", to: "17:00" },
                { from: "14:00", to: "16:00" },
            ]);
        });

        it("handles temperature with missing unit", () => {
            const filtersWithNoTempUnit = {
                measurements: {
                    temperature: {
                        from: 20,
                        to: 25,
                        // unit missing
                    },
                },
            };

            wrapper.vm.applyFilters(filtersWithNoTempUnit);

            expect(mockUseSearch.resetSearch).toHaveBeenCalled();

            expect(wrapper.vm.temperatureEnabled).toBe(true);
            expect(wrapper.vm.temperature.unit).toBe("C"); // Default fallback
        });

        it("applies complex nested filters correctly", async () => {
            const complexFilters = {
                location: {
                    continents: ["Europe", "North America", "Asia"],
                    countries: ["Netherlands", "Germany", "USA", "Canada", "Japan", "China"],
                },
                measurements: {
                    waterSources: ["Ocean", "River", "Lake", "Well"],
                    temperature: {
                        from: 0,
                        to: 40,
                        unit: "C" as const,
                    },
                },
                dateRange: {
                    from: "2020-01-01",
                    to: "2024-12-31",
                },
                times: [
                    { from: "00:00", to: "06:00" },
                    { from: "06:00", to: "12:00" },
                    { from: "12:00", to: "18:00" },
                    { from: "18:00", to: "23:59" },
                ],
            };

            wrapper.vm.applyFilters(complexFilters);
            await flushPromises();

            expect(mockUseSearch.resetSearch).toHaveBeenCalled();

            expect(wrapper.vm.selectedContinents).toEqual(["Europe", "North America", "Asia"]);
            expect(wrapper.vm.selectedCountries).toEqual(["Netherlands", "Germany", "USA", "Canada", "Japan", "China"]);
            expect(wrapper.vm.selectedWaterSources).toEqual(["Ocean", "River", "Lake", "Well"]);
            expect(wrapper.vm.temperatureEnabled).toBe(true);
            expect(wrapper.vm.temperature.from).toBe("0");
            expect(wrapper.vm.temperature.to).toBe("40");
            expect(wrapper.vm.temperature.unit).toBe("C");
            expect(wrapper.vm.dateRange.from).toBe("2020-01-01");
            expect(wrapper.vm.dateRange.to).toBe("2024-12-31");
            expect(wrapper.vm.times).toHaveLength(4);
        });
    });

    describe("Error Handling", () => {
        beforeEach(() => {
            wrapper = mount(FilterPanelComponent, {
                global: {
                    stubs: ["Icon"],
                },
            });
        });

        it("handles null filters parameter", () => {
            expect(() => {
                wrapper.vm.applyFilters(null as any);
            }).not.toThrow();

            expect(mockUseSearch.resetSearch).toHaveBeenCalled();
            assertResetHappened(wrapper);
        });

        it("handles undefined filters parameter", () => {
            expect(() => {
                wrapper.vm.applyFilters(undefined as any);
            }).not.toThrow();

            expect(mockUseSearch.resetSearch).toHaveBeenCalled();
            assertResetHappened(wrapper);
        });

        it("continues processing after encountering invalid data", () => {
            const mixedValidInvalidFilters = {
                location: {
                    continents: "invalid" as any, // Invalid
                    countries: ["Valid Country"], // Valid
                },
                measurements: {
                    waterSources: ["Valid Source"], // Valid
                    temperature: "invalid" as any, // Invalid
                },
                dateRange: {
                    from: "2023-01-01", // Valid
                    to: "2023-12-31", // Valid
                },
            };

            wrapper.vm.applyFilters(mixedValidInvalidFilters);

            expect(mockUseSearch.resetSearch).toHaveBeenCalled();

            // Should still process valid parts
            expect(wrapper.vm.dateRange.from).toBe("2023-01-01");
            expect(wrapper.vm.dateRange.to).toBe("2023-12-31");
            expect(wrapper.vm.selectedWaterSources).toEqual(["Valid Source"]);
        });
    });

    describe("Integration with Component State", () => {
        it("maintains proper component state after applying filters", async () => {
            wrapper = mount(FilterPanelComponent, {
                global: {
                    stubs: ["Icon"],
                },
            });

            // Apply filters and verify the component state is correctly updated
            wrapper.vm.applyFilters(sampleFilters);
            await flushPromises();

            expect(mockUseSearch.resetSearch).toHaveBeenCalled();

            // Verify that all the component's reactive state has been updated correctly
            expect(wrapper.vm.selectedContinents).toEqual(["Europe", "Asia"]);
            expect(wrapper.vm.selectedCountries).toEqual(["Netherlands", "Germany", "Japan"]);
            expect(wrapper.vm.selectedWaterSources).toEqual(["Ocean", "River"]);
            expect(wrapper.vm.temperatureEnabled).toBe(true);
            expect(wrapper.vm.temperature.from).toBe("15");
            expect(wrapper.vm.temperature.to).toBe("30");
            expect(wrapper.vm.temperature.unit).toBe("C");
            expect(wrapper.vm.dateRange.from).toBe("2023-01-01");
            expect(wrapper.vm.dateRange.to).toBe("2023-12-31");
            expect(wrapper.vm.times).toHaveLength(2);
        });

        it("resets state properly before applying new filters", async () => {
            wrapper = mount(FilterPanelComponent, {
                global: {
                    stubs: ["Icon"],
                },
            });

            // First apply some filters
            wrapper.vm.applyFilters(sampleFilters);
            await flushPromises();

            // Then apply minimal filters (should reset everything)
            wrapper.vm.applyFilters(minimalFilters);
            await flushPromises();

            expect(mockUseSearch.resetSearch).toHaveBeenCalledTimes(2);

            // Verify everything is reset to defaults
            expect(wrapper.vm.selectedContinents).toEqual([]);
            expect(wrapper.vm.selectedCountries).toEqual([]);
            expect(wrapper.vm.selectedWaterSources).toEqual([]);
            expect(wrapper.vm.temperatureEnabled).toBe(false);
            expect(wrapper.vm.dateRange.from).toBe("");
            expect(wrapper.vm.dateRange.to).toBe("");
            expect(wrapper.vm.times).toEqual([]);
        });
    });
});

function assertResetHappened(wrapper: VueWrapper<any>) {
    expect(wrapper.vm.selectedContinents).toEqual([]);
    expect(wrapper.vm.selectedCountries).toEqual([]);
    expect(wrapper.vm.selectedWaterSources).toEqual([]);
    expect(wrapper.vm.temperatureEnabled).toBe(false);
    expect(wrapper.vm.temperature.from).toBe("");
    expect(wrapper.vm.temperature.to).toBe("");
    expect(wrapper.vm.temperature.unit).toBe("C");
    expect(wrapper.vm.dateRange.from).toBe("");
    expect(wrapper.vm.dateRange.to).toBe("");
    expect(wrapper.vm.times).toEqual([]);
}
