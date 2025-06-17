/**
 * Session management singleton
 * This ensures all parts of the app use the same session instance
 */
let sessionInstance: ReturnType<typeof createSession> | null = null;

/**
 * Creates the session management object
 */
const createSession = () => {
    /**
     * A promise that resolves to the session information.
     * This is used to avoid multiple fetch requests for the same session data.
     */
    let sessionPromise: Promise<{ isAuthenticated: boolean; groups: string[] }> | null = null;

    /**
     * Fetches the session information from the server.
     * This is used to avoid multiple fetch requests for the same session data.
     *
     * @returns A promise that resolves to the session information.
     */
    const fetchSession = (force = false): Promise<{ isAuthenticated: boolean; groups: string[] }> => {
        if (!sessionPromise || force) {
            sessionPromise = fetch("/api/session/", {
                credentials: "same-origin",
                method: "GET",
            })
                .then((res) => {
                    if (!res.ok) {
                        throw new Error(`Failed to fetch session: ${res.status} ${res.statusText}`);
                    }
                    return res.json();
                })
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .then((data: any) => {
                    return {
                        isAuthenticated: data.isAuthenticated || false,
                        groups: data.groups || [],
                    };
                })
                .catch((err) => {
                    console.error("Session fetch failed:", err);
                    // Return default values on error
                    return { isAuthenticated: false, groups: [] };
                });
        }
        return sessionPromise;
    };

    /**
     * Ensures session is loaded and returns the session data
     * This is the main method that should be used by consumers
     */
    const getSession = async (): Promise<{ isAuthenticated: boolean; groups: string[] }> => {
        return await fetchSession();
    };

    /**
     * Checks if the user is authenticated.
     */
    const isAuthenticated = async (): Promise<boolean> => {
        const session = await getSession();
        return session.isAuthenticated;
    };

    /**
     * Gets the groups the user belongs to.
     */
    const getUserGroups = async (): Promise<string[]> => {
        const session = await getSession();
        return session.groups;
    };

    /**
     * Invalidates the current session, forcing a new fetch on the next call.
     * This is useful for logout or session expiration scenarios.
     */
    const invalidateSession = () => {
        sessionPromise = null;
    };

    /**
     * Refreshes the session by invalidating the current session and fetching a new one.
     */
    const refreshSession = async (): Promise<{ isAuthenticated: boolean; groups: string[] }> => {
        invalidateSession();
        return await getSession();
    };

    /**
     * Initialize session (fetch CSRF token) - call this early in app lifecycle
     * This ensures the CSRF token is set before any authentication attempts
     */
    const initializeSession = async (): Promise<{ isAuthenticated: boolean; groups: string[] }> => {
        return await fetchSession();
    };

    return {
        getSession,
        isAuthenticated,
        getUserGroups,
        invalidateSession,
        refreshSession,
        initializeSession,
        // Keep fetchSession for backward compatibility
        fetchSession,
    };
};

/**
 * Function to handle session information (singleton)
 */
export const useSession = () => {
    if (!sessionInstance) {
        sessionInstance = createSession();
    }
    return sessionInstance;
};
