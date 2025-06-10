import { mount, VueWrapper } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import Legend from "../../../../src/components/Legend.vue";

import { shallowMount } from "@vue/test-utils";

type UpdateEvent = string | string[];

describe("Legend.vue filtering tests", () => {
    let wrapper: VueWrapper<any>;
    let select: VueWrapper<any>;

    const factory = () => {
        wrapper = shallowMount(Legend, {
            props: {
                colors: ["#111", "#eee"],
                scale: [0, 40] as [number, number],
                colorByTemp: true,
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
        expect(ev[0][0]).toEqual(["April"]);
    });

    it("when you pick multiple months, emits array of those months", async () => {
        factory();
        await select.vm.$emit("update:model-value", ["March", "May"]);
        expect(wrapper.vm.internalValue).toEqual(["March", "May"]);
        const ev = wrapper.emitted<UpdateEvent[]>("update")!;
        expect(ev[0]).toEqual([["March", "May"]]);
        await select.vm.$emit("update:model-value", "Past 30 Days");
        expect(wrapper.vm.internalValue).toEqual(["Past 30 Days"]);
    });

    it('defaults to past 30 days when selected', async () => {
        factory();
        await select.vm.$emit("update:model-value", ["Past 30 Days", "June"]);
        expect(wrapper.vm.internalValue).toEqual(["Past 30 Days"]);
        const ev = wrapper.emitted<UpdateEvent[]>("update")!;
        expect(ev[0]).toEqual(["Past 30 Days"]);
    });

    it('goes back to single-select if you explicitly pick "Past 30 Days"', async () => {
        factory();
        await select.vm.$emit("update:model-value", "February");
        await select.vm.$emit("update:model-value", "Past 30 Days");
        expect(wrapper.vm.internalValue).toEqual(["Past 30 Days"]);
        const ev = wrapper.emitted<UpdateEvent[]>("update")!;
        expect(ev[1]).toEqual(["Past 30 Days"]);
    });
});

describe("Legend.vue gradient tests", () => {
    const colors = ["#0000ff", "#ff0000"];
    const scale: [number, number] = [10, 50];
    const colorByTemp = true;

    it("renders gradient style correctly", () => {
        const wrapper = mount(Legend, {
            props: { colors, scale, colorByTemp },
        });

        const gradientDiv = wrapper.find(".relative > div");
        const style = (gradientDiv.element as HTMLDivElement).style.background;
        expect(style).toContain(`linear-gradient(to right, ${colors[0]}, ${colors[1]})`);
    });

    it('computes step and renders five labels', () => {
    const wrapper = mount(Legend, {
      props: { colors, scale, colorByTemp }
    })

    const expected = [`≤10`, `°C`, `20`, `°C`, `30`, `°C`, `40`, `°C`, `≥50`, `°C`]

    const labelSpans = wrapper.findAll('.mt-1 span')
    expect(labelSpans).toHaveLength(10) // 5 labels with 2 spans each
    labelSpans.forEach((span, i) => {
      expect(span.text()).toContain(expected[i])
    })
  })

  it('has the correct root class', () => {
    const wrapper = mount(Legend, { props: { colors, scale, colorByTemp } })
    expect(wrapper.classes()).toContain('legend-popup')
  })

  it('updates scale when button is clicked', async () => {
    const wrapper = mount(Legend, {
      props: { colors, scale: scale, colorByTemp: true }
    });

    wrapper.vm.$.emit = (event: string) => {
      if (event === "switch") {
        wrapper.setProps({ scale: scale, colorByTemp: false });
      }
    };

    await wrapper.findAll("button")[1].trigger("click");
    await wrapper.vm.$nextTick();

    expect(wrapper.props("scale")).toEqual(scale);

    const expected = [`≤10`, `20`, `30`, `40`, `≥50`]

    const labelSpans = wrapper.findAll('.mt-1 span')
    expect(labelSpans).toHaveLength(5)
    labelSpans.forEach((span, i) => {
      expect(span.text()).toContain(expected[i])
    })
  });
});
