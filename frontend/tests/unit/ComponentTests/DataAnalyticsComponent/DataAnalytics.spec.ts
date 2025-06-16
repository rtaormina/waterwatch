import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import DataAnalyticsComponent from "../../../../src/components/Analysis/DataAnalyticsComponent.vue";
import axios from "axios";
import { createPinia, setActivePinia } from "pinia";

setActivePinia(createPinia());

// Mock axios
vi.mock("axios");

// Mock the DataVisualizationLogic module
vi.mock("../../../../src/composables/Analysis/DataVisualizationLogic", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as object),
        getGraphData: vi.fn(),
        drawHistogramWithKDE: vi.fn(),
    };
});

// Import the mocked functions
import { getGraphData, drawHistogramWithKDE } from "../../../../src/composables/Analysis/DataVisualizationLogic";

describe("DataAnalyticsComponent", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        vi.mock("../../../src/stores/ExportStore", () => ({
            useExportStore: () => ({
                filters: {},
                hasSearched: false,
            }),
        }));

        // Setup default mock implementations
        (getGraphData as any).mockResolvedValue([1, 2, 3, 4, 5]);
        vi.spyOn(axios, "post").mockResolvedValue({
            data: [1, 2, 3, 4, 5],
        });
    });

    describe("good weather tests", () => {
        it("calls fetch and processes temperature values", async () => {
            const wrapper = mount(DataAnalyticsComponent, {
                props: {
                    month: "0",
                },
            });

            // Wait for component to mount and render
            await wrapper.vm.$nextTick();
            await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for async operations

            expect(getGraphData).toHaveBeenCalledWith(undefined, "0");
            expect(drawHistogramWithKDE).toHaveBeenCalled();
        });

        it("calls fetch again when location prop changes", async () => {
            const wrapper = mount(DataAnalyticsComponent, {
                props: {
                    month: "0",
                },
            });

            // Wait for initial mount
            await wrapper.vm.$nextTick();
            await new Promise((resolve) => setTimeout(resolve, 0));

            // Clear previous calls
            vi.clearAllMocks();
            (getGraphData as any).mockResolvedValue([6, 7, 8, 9, 10]);

            // Change the location prop
            await wrapper.setProps({ location: "new-location" });
            await wrapper.vm.$nextTick();
            await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for async operations

            expect(getGraphData).toHaveBeenCalledWith("new-location", "0");
            expect(drawHistogramWithKDE).toHaveBeenCalled();
        });
    });

    describe("bad weather tests", () => {
        it("getGraphData fails but it still shows data", async () => {
            // Mock getGraphData to return empty array (simulating failure case)
            (getGraphData as any).mockResolvedValue([]);

            const wrapper = mount(DataAnalyticsComponent, {
                props: {
                    month: "0",
                },
            });

            // Wait for component to mount and render
            await wrapper.vm.$nextTick();
            await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for async operations

            expect(drawHistogramWithKDE).toHaveBeenCalled();
            const callArgs = (drawHistogramWithKDE as any).mock.calls[0];
            expect(callArgs[1]).toEqual([]); // Second argument should be empty array
        });
    });
});
