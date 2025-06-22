import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import Cookies from "universal-cookie";
import { useSession } from "./useSession";

export const loggedIn = ref(false);

/**
 * Function to handle login/logout logic
 */
export function useLogin() {
    const router = useRouter();
    const cookies = new Cookies();
    const session = useSession();

    const formData = reactive({
        username: "",
        password: "",
    });

    const errorMessage = ref("");
    const showError = ref(false);

    /**
     * Shows the error message
     *
     * @param {string} message - The error message to show
     */
    const showErrorMessage = (message: string) => {
        errorMessage.value = message;
        showError.value = true;
    };

    /**
     * Function to handle login redirection
     */
    function login() {
        router.push({ name: "Login" });
    }

    /**
     * Function to handle logout
     */
    async function logout() {
        try {
            const res = await fetch("/api/logout/", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": cookies.get("csrftoken"),
                },
            });

            if (!res.ok) {
                // optionally read and show the error
                const data = await res.json().catch(() => ({}));
                console.error("Logout failed:", data.detail || res.statusText);
            }
        } catch (err: unknown) {
            console.error("Network error during logout:", err);
        } finally {
            // Clear local state and invalidate session
            loggedIn.value = false;
            session.invalidateSession();

            // Force a fresh session fetch to clear any cached data
            await session.refreshSession();
            router.push({ name: "Map" });
        }
    }

    /**
     * Function to check if the user is logged in
     *
     * @return {Promise<boolean>} - Returns true if the user is logged in, false otherwise
     */
    async function isLoggedIn() {
        try {
            const isAuth = await session.isAuthenticated();
            loggedIn.value = isAuth;
            return isAuth;
        } catch (err) {
            console.error("isLoggedIn check failed", err);
            loggedIn.value = false;
            return false;
        }
    }

    /**
     * Function to handle a user trying to log in
     */
    const handleSubmit = async () => {
        showError.value = false;
        try {
            // Ensure session is initialized (CSRF token is set) before attempting login
            await session.initializeSession();

            const response = await fetch("/api/login/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": cookies.get("csrftoken"),
                },
                credentials: "same-origin",
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail);
            }

            if (data.detail === "Successfully logged in.") {
                loggedIn.value = true;

                // Refresh session data to get updated user information
                const updatedSession = await session.refreshSession();

                // Use the session data for routing decisions
                const groups = updatedSession.groups || [];
                if (groups.includes("researcher")) {
                    router.push({ name: "Export" });
                } else {
                    router.push({ name: "Map" });
                }
            }
        } catch (err: unknown) {
            const error = err as Error;
            console.error(error.message);
            if (error.message === "Invalid credentials.") {
                showErrorMessage("Invalid username or password.");
            } else {
                showErrorMessage("An error occurred while logging in.");
            }
        }
    };

    return {
        formData,
        errorMessage,
        showError,
        handleSubmit,
        login,
        logout,
        loggedIn,
        isLoggedIn,
    };
}
