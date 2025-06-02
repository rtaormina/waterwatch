import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import DataAnalyticsComponent from "../../../../src/components/DataAnalyticsComponent.vue";
import { mount, VueWrapper } from "@vue/test-utils";

const mockMeasurements = ["23.0", "25.0",];

vi.mock("../../../../src/composables/DataVisualizationLogic", () => ({
    drawHistogram: vi.fn()
}));

import { drawHistogram } from "../../../../src/composables/DataVisualizationLogic";

describe("DataAnalyticsComponent good weather tests", () => {
    let wrapper: VueWrapper<any>;

    beforeEach(() => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve(mockMeasurements)
            })
        ) as any;

        wrapper = mount(DataAnalyticsComponent, {
            props: { location: "" },
            stubs: [ "XMarkIcon" ]
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("calls fetch and processes temperature values", async () => {
        expect(fetch).toHaveBeenCalledWith(
            "/api/measurements/"
        );

        expect(drawHistogram).toHaveBeenCalled();

        const callArgs = (drawHistogram as any).mock.calls[0];
        expect(callArgs[1]).toEqual([23, 25]);
    });

    it("calls fetch again when location prop changes", async () => {
        expect(fetch).toHaveBeenCalledWith(
            "/api/measurements/"
        );

        await wrapper.setProps({ location: "new-location" });

        expect(fetch).toHaveBeenCalledWith(
            "/api/measurements/?boundry_geometry=new-location"
        );
    });

    it("emits close when the close button is clicked", async () => {
        await wrapper.find("button").trigger("click");
        expect(wrapper.emitted()).toHaveProperty("close");
        expect(wrapper.emitted("close")!.length).toBe(1);
    });

});

describe("DataAnalyticsComponent bad weather tests", () => {
    beforeEach(() => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                json: () => Promise.reject(new Error("Network error"))
            })
        ) as any;

        mount(DataAnalyticsComponent, {
            props: { location: "" },
            stubs: [ "XMarkIcon" ]
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("getGraphData fails but it still shows data", async () => {
        expect(drawHistogram).toHaveBeenCalled();

        const callArgs = (drawHistogram as any).mock.calls[0];
        console.log(callArgs);
        expect(callArgs[1]).toEqual([]);
    });
});
