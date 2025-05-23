import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import Cookies from "universal-cookie";

export const loggedIn = ref(false);

/**
 * Function to handle login/logout logic
 */
export function useLogin() {
    const router = useRouter();
    const cookies = new Cookies();

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
            // in all cases, clear our local state
            loggedIn.value = false;
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
            const res = await fetch("/api/whoami/", {
                method: "GET",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": cookies.get("csrftoken"),
                },
            });
            const data = await res.json();
            // your whoami_view returns either {isAuthenticated: false}
            // or {username: 'foo'}.  We treat presence of username as “true”.
            loggedIn.value = !!data.username || data.isAuthenticated === true;
            return loggedIn.value;
        } catch (err) {
            console.error("whoami failed", err);
            loggedIn.value = false;
            return false;
        }
    }

    /**
     * Function to handle a user trying to log in
     */
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
            });

            const data = await response.json();

            if (!response.ok) {
                showErrorMessage(data.detail || "Login failed.");
                throw new Error(data.detail);
            }

            if (data.detail === "Successfully logged in.") {
                loggedIn.value = true;
                const groups = data.groups || [];

                if (groups.includes("researcher")) {
                    router.push({ name: "Export" });
                } else {
                    router.push({ name: "Map" });
                }
            }
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof Error && err.message === "Failed to fetch") {
                showErrorMessage("Network error. Please try again later.");
            } else {
                showErrorMessage("Invalid username or password.");
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
