import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Menu from '../../../../src/components/Menu/MapMenu.vue'


const UTooltipStub = {
  name: 'UTooltip',
  template: '<div><slot /></div>',
  props: ['text', 'delay-duration', 'class']
}

describe('MapMenu Tests', () => {
  let wrapper: any

  const defaultProps = {
    selectMult: false,
    menuItems: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    if (wrapper) {
      wrapper.unmount()
    }
  })

  const createWrapper = (props = {}) => {
    return mount(Menu, {
      props: { ...defaultProps, ...props },
      global: {
        stubs: {
          UTooltip: UTooltipStub
        }
      }
    })
  }

  describe('Component Mounting', () => {
    it('renders correctly with default props', () => {
      wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it('displays the main button', () => {
      wrapper = createWrapper()
      const toggleButton = wrapper.find('[data-testid="open-button"]')
      expect(toggleButton.exists()).toBe(true)
    })

    it('opens menu when button is clicked', async () => {
      wrapper = createWrapper()
      const toggleButton = wrapper.find('[data-testid="open-button"]')

      await toggleButton.trigger('click')
      await nextTick()

      expect(wrapper.vm.open).toBe(true)
    })

    it('closes menu when button is clicked twice', async () => {
      wrapper = createWrapper()
      const toggleButton = wrapper.find('[data-testid="open-button"]')
      await toggleButton.trigger('click')
      await nextTick()
      expect(wrapper.vm.open).toBe(true)

      await toggleButton.trigger('click')
      await nextTick()

      vi.advanceTimersByTime(200)
      await nextTick()

      expect(wrapper.vm.open).toBe(false)
    })

    it('emits open event when button is clicked', async () => {
      wrapper = createWrapper()
      const toggleButton = wrapper.find('[data-testid="open-button"]')

      await toggleButton.trigger('click')

      expect(wrapper.emitted('open')).toHaveLength(1)
    })
  })

  describe('Menu Buttons Animation tests', () => {
    it('shows buttons with delay after opening menu', async () => {
      wrapper = createWrapper()
      const toggleButton = wrapper.find('[data-testid="open-button"]')

      await toggleButton.trigger('click')
      await nextTick()

      expect(wrapper.vm.open).toBe(true)
      expect(wrapper.vm.showButtons).toBe(false)

      vi.advanceTimersByTime(50)
      await nextTick()

      expect(wrapper.vm.showButtons).toBe(true)
    })

    it('hides buttons immediately when closing menu', async () => {
      wrapper = createWrapper()
      const toggleButton = wrapper.find('[data-testid="open-button"]')

      await toggleButton.trigger('click')
      vi.advanceTimersByTime(50)
      await nextTick()

      expect(wrapper.vm.showButtons).toBe(true)

      await toggleButton.trigger('click')
      await nextTick()

      expect(wrapper.vm.showButtons).toBe(false)
    })
  })

  describe('test watchers', () => {
    it('sets showButtons to false when open becomes false', async () => {
      wrapper = createWrapper()

      wrapper.vm.open = true
      wrapper.vm.showButtons = true
      await nextTick()

      wrapper.vm.open = false
      await nextTick()

      expect(wrapper.vm.showButtons).toBe(false)
    })

    it('does not change showButtons when open becomes true', async () => {
      wrapper = createWrapper()

      wrapper.vm.open = false
      wrapper.vm.showButtons = false
      await nextTick()

      wrapper.vm.open = true
      await nextTick()

      expect(wrapper.vm.showButtons).toBe(false)
    })
  })

})
