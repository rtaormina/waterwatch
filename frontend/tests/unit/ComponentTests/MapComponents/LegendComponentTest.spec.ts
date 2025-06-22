import { mount, VueWrapper } from "@vue/test-utils";
import { vi, describe, it, expect, beforeEach } from "vitest";
import Legend from "../../../../src/components/MenuItems/Legend.vue";
import { setActivePinia, createPinia } from "pinia";
import { useLegendStore } from "../../../../src/stores/LegendStore";

import { shallowMount } from "@vue/test-utils";

type UpdateEvent = string | string[];

describe("Legend.vue filtering tests", () => {
    let wrapper: VueWrapper<any>;
    let select: VueWrapper<any>;

    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
        vi.mock("../../../src/stores/LegendStore", () => ({
            useLegendStore: () => ({
                scale: [10, 50],
                colorByTemp: true,
            }),
        }));
    });

    const factory = () => {
        wrapper = shallowMount(Legend, {
            props: {
                colors: ["#111", "#eee"],
                fromExport: false,
            },
            global: {
                stubs: { USelect: true },
            },
        });
        select = wrapper.findComponent({ name: "USelect" });
    };

    it("defaults to single-select mode (Past 30 Days)", () => {
        factory();
        expect(wrapper.vm.internalValue).toBe("Past 30 Days");
    });

    it("when you pick a single month, emits that string and turns on multi", async () => {
        factory();
        await select.vm.$emit("update:model-value", "April");

        expect(wrapper.vm.internalValue).toEqual(["April"]);
        const ev = wrapper.emitted<UpdateEvent[]>("update")!;
        expect(ev[0][0]).toEqual([4]);
    });

    it("when you pick multiple months, emits array of those months", async () => {
        factory();
        await select.vm.$emit("update:model-value", ["March", "May"]);
        expect(wrapper.vm.internalValue).toEqual(["March", "May"]);
        const ev = wrapper.emitted<UpdateEvent[]>("update")!;
        expect(ev[0]).toEqual([[3, 5]]);
        await select.vm.$emit("update:model-value", "Past 30 Days");
        expect(wrapper.vm.internalValue).toEqual(["Past 30 Days"]);
    });

    it("defaults to past 30 days when selected", async () => {
        factory();
        await select.vm.$emit("update:model-value", ["Past 30 Days", "June"]);
        expect(wrapper.vm.internalValue).toEqual(["June"]);
        const ev = wrapper.emitted<UpdateEvent[]>("update")!;
        expect(ev[0]).toEqual([[6]]);
    });

    it('goes back to single-select if you explicitly pick "Past 30 Days"', async () => {
        factory();
        await select.vm.$emit("update:model-value", "Past 30 Days");
        await select.vm.$emit("update:model-value", "February");
        expect(wrapper.vm.internalValue).toEqual(["February"]);
        const ev = wrapper.emitted<UpdateEvent[]>("update")!;
        expect(ev[1]).toEqual([[2]]);
    });

    it("displays time info when selected", async () => {
        factory();
        const info = wrapper.find('[data-testid="info-button"]');
        await info.trigger("click");
        expect(wrapper.vm.showInfoTextTime).toBe(true);
    });

    it("displays coloring info when selected", async () => {
        factory();
        const info = wrapper.find('[data-testid="info-button-hex"]');
        await info.trigger("click");
        const text = wrapper.find('[data-testid="info-text-hex"]');
        expect(wrapper.vm.showInfoTextColoring).toBe(true);
    });
});

describe("Legend.vue gradient tests", () => {
    const colors = ["#0000ff", "#ff0000"];
    const fromExport = false;
    let legendStore;

    beforeEach(() => {
        setActivePinia(createPinia());
        legendStore = useLegendStore();
    });

    it("renders gradient style correctly", () => {
        const wrapper = mount(Legend, {
            props: { colors, fromExport },
        });

        const gradientDiv = wrapper.find(".relative > div");
        const style = (gradientDiv.element as HTMLDivElement).style.background;
        expect(style).toContain(`linear-gradient(to right, ${colors[0]}, ${colors[1]})`);
    });

    it("computes step and renders five labels", () => {
        const wrapper = mount(Legend, {
            props: { colors, fromExport },
        });

        // Order is messed up because how the wrapper returns the spans from the DOM
        const expected = [`0`, `≤`, `°C`, `8`, `°C`, `16`, `°C`, `24`, `°C`, `32`, `°C`, `≥40`, `°C`];

        const labelSpans = wrapper.findAll(".mt-1 span");
        expect(labelSpans).toHaveLength(13); // 5 labels: 1 with 3, 4 with 2 labels
        labelSpans.forEach((span, i) => {
            expect(span.text()).toContain(expected[i]);
        });
    });

    it("has the correct root class", () => {
        const wrapper = mount(Legend, { props: { colors, fromExport } });
        expect(wrapper.classes()).toContain("legend-popup");
    });

    it("updates scale when button is clicked", async () => {
        const wrapper = mount(Legend, {
            props: { colors, fromExport },
        });

        // Simulate changing the mode in the legendStore
        legendStore.colorByTemp = false;

        await wrapper.find('[data-testid="count"]').trigger("click");
        await wrapper.vm.$nextTick();

        expect(legendStore.scale).toEqual([0, 40]);

        const expected = [`0`, `8`, `16`, `24`, `32`, `≥40`];

        const labelSpans = wrapper.findAll(".mt-1 span");
        expect(labelSpans).toHaveLength(6);
        labelSpans.forEach((span, i) => {
            expect(span.text()).toContain(expected[i]);
        });
    });
});
