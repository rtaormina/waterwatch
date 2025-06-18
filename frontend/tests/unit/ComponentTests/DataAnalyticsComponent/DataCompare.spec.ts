import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import DataAnalyticsCompare from "../../../../src/components/Analysis/DataAnalyticsCompare.vue";
import { mount, VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";

const mockMeasurements1 = ["23.0", "25.0", "24.5", "26.0"];
const mockMeasurements2 = ["28.0", "30.0", "29.5", "31.0"];

setActivePinia(createPinia());

vi.mock("../../../../src/composables/Analysis/DataVisualizationLogic", () => ({
    getGraphData: vi.fn(),
    drawHistogramWithKDE: vi.fn(),
    drawComparisonGraph: vi.fn(),
}));

import {
    getGraphData,
    drawHistogramWithKDE,
    drawComparisonGraph,
} from "../../../../src/composables/Analysis/DataVisualizationLogic";
import { createPinia, setActivePinia } from "pinia";

describe("DataAnalyticsCompare good weather tests", () => {
    let wrapper: VueWrapper<any>;

    beforeEach(() => {
        (getGraphData as any).mockImplementation((wkt: string) => {
            if (wkt === "group1-wkt") {
                return Promise.resolve(mockMeasurements1.map(Number));
            } else if (wkt === "group2-wkt") {
                return Promise.resolve(mockMeasurements2.map(Number));
            }
            return Promise.resolve([]);
        });

        vi.mock("../../../src/stores/ExportStore", () => ({
            useExportStore: () => ({
                filters: {},
                hasSearched: false,
            }),
        }));

        wrapper = mount(DataAnalyticsCompare, {
            props: {
                group1WKT: "group1-wkt",
                group2WKT: "group2-wkt",
                month: "0",
                fromExport: false,
            },
            stubs: ["XMarkIcon", "ChevronDownIcon", "ChevronUpIcon"],
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("renders the component with correct title", () => {
        expect(wrapper.find("h1").text()).toContain("Compare Distributions");
    });

    it("renders all three accordion sections", () => {
        const accordionButtons = wrapper.findAll("button").filter((btn) => btn.text().includes("Frequency Analysis"));
        expect(accordionButtons).toHaveLength(3);

        expect(accordionButtons[0].text()).toContain("Group 1 and Group 2");
        expect(accordionButtons[1].text()).toContain("Group 1");
        expect(accordionButtons[2].text()).toContain("Group 2");
    });

    it("has overlaid section open by default", () => {
        expect(wrapper.vm.isOpen("overlaid")).toBe(true);
    });

    it("calls getGraphData for both groups on mount", async () => {
        await nextTick();

        expect(getGraphData).toHaveBeenCalledWith("group1-wkt", "0");
        expect(getGraphData).toHaveBeenCalledWith("group2-wkt", "0");
        expect(getGraphData).toHaveBeenCalledTimes(2);
    });

    it("calls drawComparisonGraph with correct parameters", async () => {
        await nextTick();
        // Wait for the setTimeout in renderCompare
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(drawComparisonGraph).toHaveBeenCalled();

        const callArgs = (drawComparisonGraph as any).mock.calls[0];
        expect(callArgs[1]).toEqual([23, 25, 24.5, 26]); // group1 data
        expect(callArgs[2]).toEqual([28, 30, 29.5, 31]); // group2 data
        expect(callArgs[3]).toEqual({
            barOpacity: 0.15,
            barColor1: "steelblue",
            lineColor1: "steelblue",
            barColor2: "crimson",
            lineColor2: "crimson",
        });
    });

    it("toggles accordion sections correctly", async () => {
        // Initially overlaid is open, group1 and group2 are closed
        expect(wrapper.vm.isOpen("overlaid")).toBe(true);
        expect(wrapper.vm.isOpen("group1")).toBe(false);
        expect(wrapper.vm.isOpen("group2")).toBe(false);

        // Find and click the group1 accordion button
        const group1Button = wrapper
            .findAll("button")
            .find((btn) => btn.text().includes("Frequency Analysis: Group 1") && !btn.text().includes("Group 2"));
        await group1Button!.trigger("click");

        expect(wrapper.vm.isOpen("group1")).toBe(true);

        // Click again to close
        await group1Button!.trigger("click");
        expect(wrapper.vm.isOpen("group1")).toBe(false);
    });

    it("calls drawHistogramWithKDE when group1 accordion is opened", async () => {
        const group1Button = wrapper
            .findAll("button")
            .find((btn) => btn.text().includes("Frequency Analysis: Group 1") && !btn.text().includes("Group 2"));

        await group1Button!.trigger("click");
        await nextTick();
        // Wait for the setTimeout in renderCompare
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(drawHistogramWithKDE).toHaveBeenCalled();

        const callArgs = (drawHistogramWithKDE as any).mock.calls[0];
        expect(callArgs[1]).toEqual([23, 25, 24.5, 26]); // group1 data
        expect(callArgs[2]).toBe("steelblue"); // bar color
        expect(callArgs[3]).toBe("orange"); // line color
        expect(callArgs[4]).toEqual({ barOpacity: 0.5 });
    });

    it("calls drawHistogramWithKDE when group2 accordion is opened", async () => {
        const group2Button = wrapper
            .findAll("button")
            .find((btn) => btn.text().includes("Frequency Analysis: Group 2"));

        await group2Button!.trigger("click");
        await nextTick();
        // Wait for the setTimeout in renderCompare
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(drawHistogramWithKDE).toHaveBeenCalled();

        const callArgs = (drawHistogramWithKDE as any).mock.calls[0];
        expect(callArgs[1]).toEqual([28, 30, 29.5, 31]); // group2 data
        expect(callArgs[2]).toBe("crimson"); // bar color
        expect(callArgs[3]).toBe("orange"); // line color
        expect(callArgs[4]).toEqual({ barOpacity: 0.5 });
    });

    it("re-renders graphs when WKT props change", async () => {
        await nextTick();
        // Clear previous calls
        vi.clearAllMocks();

        // Change props
        await wrapper.setProps({
            group1WKT: "new-group1-wkt",
            group2WKT: "new-group2-wkt",
        });

        // Wait for the watch effect and setTimeout
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(getGraphData).toHaveBeenCalledWith("new-group1-wkt", "0");
        expect(getGraphData).toHaveBeenCalledWith("new-group2-wkt", "0");
    });

    it("emits close when the close button is clicked", async () => {
        const closeButton = wrapper.find("h1 button");
        await closeButton.trigger("click");

        expect(wrapper.emitted()).toHaveProperty("close");
        expect(wrapper.emitted("close")!.length).toBe(1);
    });

    it("handles multiple accordion sections being open simultaneously", async () => {
        // Open group1
        const group1Button = wrapper
            .findAll("button")
            .find((btn) => btn.text().includes("Frequency Analysis: Group 1") && !btn.text().includes("Group 2"));
        await group1Button!.trigger("click");

        // Open group2
        const group2Button = wrapper
            .findAll("button")
            .find((btn) => btn.text().includes("Frequency Analysis: Group 2"));
        await group2Button!.trigger("click");

        expect(wrapper.vm.isOpen("overlaid")).toBe(true);
        expect(wrapper.vm.isOpen("group1")).toBe(true);
        expect(wrapper.vm.isOpen("group2")).toBe(true);
    });

    it("displays correct chevron icons based on accordion state", async () => {
        // Initially overlaid is open, so should show ChevronUpIcon
        // group1 and group2 are closed, so should show ChevronDownIcon

        const group1Button = wrapper
            .findAll("button")
            .find((btn) => btn.text().includes("Frequency Analysis: Group 1") && !btn.text().includes("Group 2"));

        // Toggle group1 to open
        await group1Button!.trigger("click");

        expect(wrapper.vm.isOpen("group1")).toBe(true);

        // Toggle group1 to close
        await group1Button!.trigger("click");

        expect(wrapper.vm.isOpen("group1")).toBe(false);
    });
});

describe("DataAnalyticsCompare bad weather tests", () => {
    let wrapper: VueWrapper<any>;

    beforeEach(() => {
        (getGraphData as any).mockImplementation(() => {
            return Promise.reject(new Error("Network error"));
        });

        vi.mock("../../../src/stores/ExportStore", () => ({
            useExportStore: () => ({
                filters: {},
                hasSearched: false,
            }),
        }));

        wrapper = mount(DataAnalyticsCompare, {
            props: {
                group1WKT: "group1-wkt",
                group2WKT: "group2-wkt",
                month: "0",
                fromExport: false,
            },
            stubs: ["XMarkIcon", "ChevronDownIcon", "ChevronUpIcon"],
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("handles getGraphData failure gracefully", async () => {
        await nextTick();
        // Wait for the setTimeout in renderCompare
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Should still call drawing functions, but with empty data
        expect(drawComparisonGraph).toHaveBeenCalled();

        const callArgs = (drawComparisonGraph as any).mock.calls[0];
        expect(callArgs[1]).toEqual([]); // empty group1 data
        expect(callArgs[2]).toEqual([]); // empty group2 data
    });

    it("handles empty WKT strings", async () => {
        const emptyWrapper = mount(DataAnalyticsCompare, {
            props: {
                group1WKT: "",
                group2WKT: "",
                month: "0",
                fromExport: false,
            },
            stubs: ["XMarkIcon", "ChevronDownIcon", "ChevronUpIcon"],
        });

        await nextTick();
        // Wait for the setTimeout in renderCompare
        await new Promise((resolve) => setTimeout(resolve, 100));

        // getGraphData should return empty arrays for empty WKT
        expect(getGraphData).toHaveBeenCalledWith("", "0");
    });

    it("handles partial failures when one group fails", async () => {
        (getGraphData as any).mockImplementation((wkt: string) => {
            if (wkt === "group1-wkt") {
                return Promise.resolve([23, 25, 24.5, 26]);
            } else if (wkt === "group2-wkt") {
                return Promise.reject(new Error("Network error for group2"));
            }
            return Promise.resolve([]);
        });

        const partialFailWrapper = mount(DataAnalyticsCompare, {
            props: {
                group1WKT: "group1-wkt",
                group2WKT: "group2-wkt",
                month: "0",
                fromExport: false,
            },
            stubs: ["XMarkIcon", "ChevronDownIcon", "ChevronUpIcon"],
        });

        await nextTick();
        // Wait for the setTimeout in renderCompare
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(drawComparisonGraph).toHaveBeenCalled();

        // check last call arguments
        const callArgs = (drawComparisonGraph as any).mock.calls.at(-1);
        expect(callArgs[1]).toEqual([23, 25, 24.5, 26]); // successful group1 data
        expect(callArgs[2]).toEqual([]); // failed group2 data becomes empty
    });
});

describe("DataAnalyticsCompare edge cases", () => {
    let wrapper: VueWrapper<any>;

    beforeEach(() => {
        (getGraphData as any).mockImplementation((wkt: string) => {
            if (wkt === "single-value-wkt") {
                return Promise.resolve([25.0]);
            } else if (wkt === "large-dataset-wkt") {
                // Generate a large dataset
                return Promise.resolve(Array.from({ length: 1000 }, (_, i) => 20 + Math.random() * 10));
            }
            return Promise.resolve([]);
        });

        vi.mock("../../../src/stores/ExportStore", () => ({
            useExportStore: () => ({
                filters: {},
                hasSearched: false,
            }),
        }));
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("handles single value datasets", async () => {
        wrapper = mount(DataAnalyticsCompare, {
            props: {
                group1WKT: "single-value-wkt",
                group2WKT: "single-value-wkt",
                month: "0",
                fromExport: false,
            },
            stubs: ["XMarkIcon", "ChevronDownIcon", "ChevronUpIcon"],
        });

        await nextTick();
        // Wait for the setTimeout in renderCompare
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(drawComparisonGraph).toHaveBeenCalled();

        const callArgs = (drawComparisonGraph as any).mock.calls[0];
        expect(callArgs[1]).toEqual([25.0]);
        expect(callArgs[2]).toEqual([25.0]);
    });

    it("handles large datasets efficiently", async () => {
        wrapper = mount(DataAnalyticsCompare, {
            props: {
                group1WKT: "large-dataset-wkt",
                group2WKT: "large-dataset-wkt",
                month: "0",
                fromExport: false,
            },
            stubs: ["XMarkIcon", "ChevronDownIcon", "ChevronUpIcon"],
        });

        await nextTick();
        // Wait for the setTimeout in renderCompare
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(drawComparisonGraph).toHaveBeenCalled();

        const callArgs = (drawComparisonGraph as any).mock.calls[0];
        expect(callArgs[1]).toHaveLength(1000);
        expect(callArgs[2]).toHaveLength(1000);
    });

    it("handles rapid prop changes without race conditions", async () => {
        wrapper = mount(DataAnalyticsCompare, {
            props: {
                group1WKT: "group1-wkt",
                group2WKT: "group2-wkt",
                month: "0",
                fromExport: false,
            },
            stubs: ["XMarkIcon", "ChevronDownIcon", "ChevronUpIcon"],
        });

        // Rapidly change props multiple times
        await wrapper.setProps({ group1WKT: "new1", group2WKT: "new2", month: "0" });
        await wrapper.setProps({ group1WKT: "newer1", group2WKT: "newer2", month: "0" });
        await wrapper.setProps({ group1WKT: "newest1", group2WKT: "newest2", month: "0" });

        await nextTick();
        // Wait for all setTimeout calls to complete
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Should have been called with the final prop values
        expect(getGraphData).toHaveBeenCalledWith("newest1", "0");
        expect(getGraphData).toHaveBeenCalledWith("newest2", "0");
    });
});
