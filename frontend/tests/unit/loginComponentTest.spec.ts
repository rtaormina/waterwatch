import { useLogin } from '../../src/composables/LoginLogic'
import { nextTick } from 'vue'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useRouter } from 'vue-router'

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

    it('successfully logs in and navigates to Home', async () => {
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
        expect(push).toHaveBeenCalledWith({ name: 'Home' })
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
