import { mount, VueWrapper } from "@vue/test-utils";
import { describe, it, expect, beforeEach, vi } from "vitest";
import Legend from "../../../../src/components/Legend.vue";


describe('Legend.vue', () => {
  const colors = ['#0000ff', '#ff0000']
  const scale: [number, number] = [10, 50]
  const colorByTemp: boolean = true

  it('renders gradient style correctly', () => {
    const wrapper = mount(Legend, {
      props: { colors, scale, colorByTemp }
    })

    const gradientDiv = wrapper.find('.relative > div')
    const style = (gradientDiv.element as HTMLDivElement).style.background
    expect(style).toContain(`linear-gradient(to right, ${colors[0]}, ${colors[1]})`)
  })

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
})
