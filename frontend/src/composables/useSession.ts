/**
 * Function to handle session information
 */
export const useSession = () => {
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
    const fetchSession = () => {
        if (!sessionPromise) {
            sessionPromise = fetch("/api/session/", { credentials: "same-origin" })
                .then((res) => {
                    if (!res.ok) throw new Error("Failed to fetch session");
                    return res.json();
                })
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .then((data: any) => ({
                    isAuthenticated: data.isAuthenticated,
                    groups: data.groups || [],
                }))
                .catch((err) => {
                    console.error("Session fetch failed:", err);
                    // in failure cases, treat as unauthenticated with no groups
                    return { isAuthenticated: false, groups: [] };
                });
        }
        return sessionPromise;
    };

    /**
     * Checks if the user is authenticated.
     *
     *  @returns A promise that resolves to a boolean indicating if the user is authenticated.
     *           If the session fetch fails, it returns false.
     */
    const isAuthenticated = async (): Promise<boolean> => {
        const session = await fetchSession();
        return session.isAuthenticated;
    };

    /**
     * Gets the groups the user belongs to.
     *
     * @returns A promise that resolves to an array of group names.
     *          If the session fetch fails, it returns an empty array.
     */
    const getUserGroups = async (): Promise<string[]> => {
        const session = await fetchSession();
        return session.groups;
    };

    return {
        isAuthenticated,
        getUserGroups,
    };
};
