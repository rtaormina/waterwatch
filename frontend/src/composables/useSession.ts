/**
 * Function to handle session information
 */
export const useSession = () => {
    /**
     * Function to check if the user is authenticated
     *
     * @returns {Promise<boolean>} - true if the user is authenticated, false otherwise
     */
    const isAuthenticated = async () => {
        const data = await fetch("api/session/", {
            credentials: "same-origin",
        });
        if (!data.ok) {
            throw new Error("Failed to fetch session data");
        }
        const session = await data.json();
        return session.isAuthenticated;
    };
    return { isAuthenticated };
};
