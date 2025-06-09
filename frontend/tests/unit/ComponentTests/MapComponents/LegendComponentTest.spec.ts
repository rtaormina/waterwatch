import { mount, VueWrapper } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import Legend from "../../../../src/components/Legend.vue";

import { shallowMount } from "@vue/test-utils";

type UpdateEvent = string | string[];

describe("Legend.vue", () => {
    let wrapper: VueWrapper<any>;
    let select: VueWrapper<any>;

    const factory = () => {
        wrapper = shallowMount(Legend, {
            props: {
                colors: ["#111", "#eee"],
                scale: [0, 40] as [number, number],
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

        expect(wrapper.vm.internalValue).toBe("April");
        const ev = wrapper.emitted<UpdateEvent[]>("update")!;
        expect(ev[0]).toEqual(["April"]);
    });

    it("when you pick multiple months, emits array of those months", async () => {
        factory();
        await select.vm.$emit("update:model-value", ["March", "May"]);
        expect(wrapper.vm.internalValue).toEqual(["March", "May"]);
        const ev = wrapper.emitted<UpdateEvent[]>("update")!;
        expect(ev[0]).toEqual([["March", "May"]]);
        await select.vm.$emit("update:model-value", "Past 30 Days");
        expect(wrapper.vm.internalValue).toEqual("Past 30 Days");
    });

    it('filters out "Past 30 Days" if combined in multi-select', async () => {
        factory();
        await select.vm.$emit("update:model-value", ["Past 30 Days", "June"]);
        expect(wrapper.vm.internalValue).toEqual(["June"]);
        const ev = wrapper.emitted<UpdateEvent[]>("update")!;
        expect(ev[0]).toEqual([["June"]]);
    });

    it('goes back to single-select if you explicitly pick "Past 30 Days"', async () => {
        factory();
        await select.vm.$emit("update:model-value", "February");
        await select.vm.$emit("update:model-value", "Past 30 Days");
        expect(wrapper.vm.internalValue).toBe("Past 30 Days");
        const ev = wrapper.emitted<UpdateEvent[]>("update")!;
        expect(ev[1]).toEqual(["Past 30 Days"]);
    });
});

describe("Legend.vue", () => {
    const colors = ["#0000ff", "#ff0000"];
    const scale: [number, number] = [10, 50];

    it("renders gradient style correctly", () => {
        const wrapper = mount(Legend, {
            props: { colors, scale },
        });

        const gradientDiv = wrapper.find(".relative > div");
        const style = (gradientDiv.element as HTMLDivElement).style.background;
        expect(style).toContain(`linear-gradient(to right, ${colors[0]}, ${colors[1]})`);
    });

    it("computes step and renders five labels", () => {
        const wrapper = mount(Legend, {
            props: { colors, scale },
        });

        const expected = [10, 20, 30, 40, 50].map((n) => `${n}°C`);

        const labelSpans = wrapper.findAll(".mt-1 span");
        expect(labelSpans).toHaveLength(5);
        labelSpans.forEach((span, i) => {
            expect(span.text()).toContain(expected[i]);
        });
    });

    it("has the correct root class", () => {
        const wrapper = mount(Legend, { props: { colors, scale } });
        expect(wrapper.classes()).toContain("legend-popup");
    });
});
