import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import Cookies from 'universal-cookie'

export function useLogin() {
    const router = useRouter()
    const cookies = new Cookies()

    const formData = reactive({
        username: '',
        password: ''
    })

    const errorMessage = ref('')
    const showError = ref(false)

    const showErrorMessage = (message: string) => {
        errorMessage.value = message
        showError.value = true
    }

    const handleSubmit = async () => {
        try {
            const response = await fetch("api/login/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": cookies.get("csrftoken"),
                },
                credentials: "same-origin",
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (!response.ok) {
                showErrorMessage(data.detail || 'Login failed.')
                throw new Error(data.detail)
            }

            if (data.detail === 'Successfully logged in.') {
                const groups = data.groups || []

                if (groups.includes('researcher')) {
                    router.push({ name: 'Export' }) // Replace with your route name
                } else {
                    router.push({ name: 'Map' }) // Default or non-researcher route
                }
            }

        } catch (err: any) {
            console.error(err)
            if (err.message === 'Failed to fetch') {
                showErrorMessage('Network error. Please try again later.')
            } else {
                showErrorMessage('Invalid username or password.')
            }
        }
    }

    return {
        formData,
        errorMessage,
        showError,
        handleSubmit,
    }
}
