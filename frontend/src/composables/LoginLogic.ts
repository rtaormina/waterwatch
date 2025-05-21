import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import Cookies from 'universal-cookie'

export const loggedIn = ref(false)

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

    function login() {
        router.push({ name: 'Login' })
    }

    async function logout() {
        try {
        const res = await fetch('/api/logout/', {
            method:  'POST',
            credentials: 'same-origin',
            headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': cookies.get('csrftoken'),
            }
        })

        if (!res.ok) {
            // optionally read and show the error
            const data = await res.json().catch(() => ({}))
            console.error('Logout failed:', data.detail || res.statusText)
        }

        } catch (err: any) {
        console.error('Network error during logout:', err)
        } finally {
        // in all cases, clear our local state
        loggedIn.value = false
        router.push({ name: 'Map' })
        }
    }

    async function isLoggedIn() {
        try {
          const res  = await fetch('/api/whoami/', {
            method:  'GET',
            credentials: 'same-origin',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': cookies.get('csrftoken'),
            }
          })
          const data = await res.json()
          // your whoami_view returns either {isAuthenticated: false}
          // or {username: 'foo'}.  We treat presence of username as “true”.
          loggedIn.value = !!data.username || data.isAuthenticated === true
          return loggedIn.value
        } catch (err) {
          console.error('whoami failed', err)
          loggedIn.value = false
          return false
        }
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
                loggedIn.value = true
                const groups = data.groups || []

                if (groups.includes('researcher')) {
                    router.push({ name: 'Export' })
                } else {
                    router.push({ name: 'Map' })
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
        login,
        logout,
        loggedIn,
        isLoggedIn,
    }
}
