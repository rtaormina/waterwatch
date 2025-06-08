import { mount, VueWrapper } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import Legend from "../../../../src/components/Legend.vue";


describe('Legend.vue', () => {
  const colors = ['#0000ff', '#ff0000']
  const scale: [number, number] = [10, 50]

  it('renders gradient style correctly', () => {
    const wrapper = mount(Legend, {
      props: { colors, scale }
    })

    const gradientDiv = wrapper.find('.relative > div')
    const style = (gradientDiv.element as HTMLDivElement).style.background
    expect(style).toContain(`linear-gradient(to right, ${colors[0]}, ${colors[1]})`)
  })

  it('computes step and renders five labels', () => {
    const wrapper = mount(Legend, {
      props: { colors, scale }
    })

    const expected = [10, 20, 30, 40, 50].map(n => `${n}°C`)

    const labelSpans = wrapper.findAll('.mt-1 span')
    expect(labelSpans).toHaveLength(5)
    labelSpans.forEach((span, i) => {
      expect(span.text()).toContain(expected[i])
    })
  })

  it('has the correct root class', () => {
    const wrapper = mount(Legend, { props: { colors, scale } })
    expect(wrapper.classes()).toContain('legend-popup')
  })
})
