import { mount, VueWrapper } from "@vue/test-utils";
import { describe, it, expect, beforeEach, vi } from "vitest";

const mockDataFilters = {
    continents: ["Asia", "Europe"],
    countriesByContinent: {
        Asia: ["Japan", "China", "India"],
        Europe: ["France", "Germany", "Italy"],
    },
    waterSources: ["Network", "Rooftop Tank", "Well", "Other"],
    allCountries: ["Japan", "China", "India", "France", "Germany", "Italy"],
    continentPlaceholder: "",
    countryPlaceholder: "",
    waterSourcePlaceholder: "",
    tempRangeValid: true,
    dateRangeValid: true,
    allSlotsValid: true,
    slotsNonOverlapping: true,
    formatContinentSelectionText: () => "2 continents selected",
    formatCountrySelectionText: () => "3 countries selected",
    formatWaterSourceSelectionText: () => "2 water sources selected",
    toggleContinent: vi.fn(),
    toggleCountry: vi.fn(),
    toggleAllContinents: vi.fn(),
    toggleAllCountries: vi.fn(),
    toggleWaterSource: vi.fn(),
    toggleAllWaterSources: vi.fn(),
    addSlot: vi.fn(),
    removeSlot: vi.fn(),
    getSearchParams: vi.fn(),
};
vi.mock("useFilters", () => ({
    useFilters: mockDataFilters,
}));

import FilterPanel from "../../../src/components/FilterPanelComponent.vue";
import { nextTick } from "vue";
import { afterEach } from "node:test";

const StubArrow = { template: "<span/>" };
const StubCheck = { template: "<span/>" };
const StubLocationFallback = { template: '<div data-testid="stub-map"/>' };

describe("FilterPanelComponent - country filtering UI", () => {
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
        wrapper.vm.selectedContinents=[]
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
        expect(filteredOptions[0].text()).toContain("Asia")


        const allOptions = wrapper.findAll('[data-testid="continent-options"] .multiselect-option');
        expect(allOptions.length).toBe(2);

        const secondOption = allOptions[0];
        const thirdOption = allOptions[1];
        expect(secondOption.text()).toContain("Asia");
        expect(thirdOption.text()).toContain("Europe")
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
        wrapper.vm.selectedContinents=["Asia","Europe"]
        wrapper.vm.allCountries = ["Japan", "China", "India", "France", "Germany", "Italy"];
        wrapper.vm.selectedCountries = [];
        wrapper.vm.countrySearchQuery = "";
        wrapper.vm.toggleCountryDropdown();
        expect((wrapper.vm as any).countryDropdownOpen).toBe(true);
        const searchInput = wrapper.findAll('[data-testid="country-placeholder"]')[0];
        expect(searchInput.exists()).toBe(true);
        expect(searchInput.text()).toBe("Select countries");
        await nextTick();
        const searchbar = wrapper.find('input[placeholder="Search countries..."]')
        expect(searchInput.exists()).toBe(true)
        await searchbar.setValue("J");
        const filteredOptions = wrapper.findAll('[data-testid="country-options"] .multiselect-option');
        expect(filteredOptions.length).toBe(1);
        expect(filteredOptions[0].text()).toContain("Japan")
        await searchbar.setValue("");
        await nextTick();

        const allOptions = wrapper.findAll('[data-testid="country-options"] .multiselect-option');
        expect(allOptions.length).toBe(6);

        const secondOption = allOptions[0];
        const thirdOption = allOptions[1];
        expect(secondOption.text()).toContain("China");
        expect(thirdOption.text()).toContain("Finland")
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

describe("FilterPanel.vue", () => {
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
        vi.mock("loadLocations", () => ({
            loadLocations: vi.fn(),
        }));
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
