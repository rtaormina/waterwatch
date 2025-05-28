import { useLogin } from '../../src/composables/LoginLogic'
import { nextTick } from 'vue'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useRouter } from 'vue-router'
import { mount, VueWrapper } from "@vue/test-utils";
import LoginView from "../../src/components/LoginComponent.vue";

vi.mock('vue-router', () => ({
    useRouter: vi.fn()
}))

vi.mock('universal-cookie', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            get: () => 'mocked-csrf-token',
        }))
    }
})

describe('useLogin composable', () => {
    const push = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
            ; (useRouter as unknown as any).mockReturnValue({ push })
    })

    it('successfully logs in and navigates to Map', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ detail: 'Successfully logged in.' }),
        }) as any

        const { formData, handleSubmit, errorMessage, showError } = useLogin()

        formData.username = 'testuser'
        formData.password = 'password'

        await handleSubmit()
        await nextTick()

        expect(fetch).toHaveBeenCalledOnce()
        expect(push).toHaveBeenCalledWith({ name: 'Map' })
        expect(showError.value).toBe(false)
        expect(errorMessage.value).toBe('')
    })

    it('shows error on failed login (invalid credentials)', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            json: async () => ({ detail: 'Invalid username or password.' }),
        }) as any

        const { formData, handleSubmit, errorMessage, showError } = useLogin()

        formData.username = 'wronguser'
        formData.password = 'wrongpass'

        await handleSubmit()
        await nextTick()

        expect(fetch).toHaveBeenCalledOnce()
        expect(showError.value).toBe(true)
        expect(errorMessage.value).toBe('Invalid username or password.')
    })

    it('shows error on network failure', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'))

        const { formData, handleSubmit, errorMessage, showError } = useLogin()

        formData.username = 'any'
        formData.password = 'any'

        await handleSubmit()
        await nextTick()

        expect(showError.value).toBe(true)
        expect(errorMessage.value).toBe('Network error. Please try again later.')
    })
})

const mockFormData = { username: "", password: "" };
const mockErrorMessage = { value: "" };
const mockShowError = { value: false };
const mockHandleSubmit = vi.fn().mockResolvedValue(undefined);

vi.mock("@/composables/LoginLogic.ts", () => ({
    useLogin: () => ({
        formData: mockFormData,
        errorMessage: mockErrorMessage,
        showError: mockShowError,
        handleSubmit: mockHandleSubmit,
    }),
}));

describe('LoginView.vue (UI)', () => {
    let wrapper: VueWrapper<any>

    beforeEach(() => {
      // reset mocks
      vi.clearAllMocks()
      mockFormData.username = ''
      mockFormData.password = ''
      mockErrorMessage.value = ''
      mockShowError.value = false

      wrapper = mount(LoginView, {
        // you can stub out router-link, etc.
        global: {
          stubs: {
            RouterLink: true,
          }
        }
      })
    })

    it('renders username and password inputs', () => {
      const inputs = wrapper.findAll('input')
      expect(inputs[0].attributes('placeholder')).toBe('Your Username')
      expect(inputs[1].attributes('placeholder')).toBe('Your Password')
    })

    it('binds v-model correctly', async () => {
      const usernameInput = wrapper.find('input[type="text"]')
      await usernameInput.setValue('alice')
      expect(mockFormData.username).toBe('alice')

      const passwordInput = wrapper.find('input[type="password"]')
      await passwordInput.setValue('hunter2')
      expect(mockFormData.password).toBe('hunter2')
    })})
