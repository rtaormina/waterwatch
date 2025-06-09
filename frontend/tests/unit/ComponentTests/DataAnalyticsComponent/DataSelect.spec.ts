// __tests__/SelectHexagonsCard.spec.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import SelectHexagonsCard from '../../../../src/components/Analysis/SelectBar.vue'

describe('SelectHexagonsCard', () => {
  const factory = (count: number) =>
    mount(SelectHexagonsCard, {
      props: { count },
      global: {
        stubs: {
          UCard: {
            template: '<div><slot /></div>',
          },
          UButton: {
            props: ['color', 'disabled'],
            emits: ['click'],
            template: `<button 
                :class="['u-button', color ? 'u-button--'+color : '', disabled? 'is-disabled':'' ]" 
                :disabled="disabled" 
                @click="$emit('click')"
              ><slot/></button>`,
          },
        },
      },
    })

  it('disables the Select button and sets color="neutral" when count is 0', () => {
    const wrapper = factory(0)

    const buttons = wrapper.findAll('button.u-button')
    const selectBtn = buttons[1]
    expect(selectBtn.attributes('disabled')).toBeDefined()
    expect(selectBtn.classes()).toContain('u-button--neutral')
  })

  it('enables the Select button and sets color="primary" when count > 0', () => {
    const wrapper = factory(3)

    const buttons = wrapper.findAll('button.u-button')
    const selectBtn = buttons[1]

    expect(selectBtn.attributes('disabled')).toBeUndefined()
    expect(selectBtn.classes()).toContain('u-button--primary')
  })

  it('always emits "cancel-select" when Cancel is clicked', async () => {
    const wrapper = factory(5)
    const cancelBtn = wrapper.findAll('button.u-button')[0]

    await cancelBtn.trigger('click')
    expect(wrapper.emitted()).toHaveProperty('cancel-select')
    expect(wrapper.emitted('cancel-select')![0]).toEqual([])
  })

  it('emits "select" when Select is clicked and enabled', async () => {
    const wrapper = factory(2)
    const selectBtn = wrapper.findAll('button.u-button')[1]

    await selectBtn.trigger('click')
    expect(wrapper.emitted()).toHaveProperty('select')
    expect(wrapper.emitted('select')![0]).toEqual([])
  })

  it('does NOT emit "select" when Select is clicked but disabled', async () => {
    const wrapper = factory(0)
    const selectBtn = wrapper.findAll('button.u-button')[1]

    await selectBtn.trigger('click')
    expect(wrapper.emitted('select')).toBeUndefined()
  })
})
