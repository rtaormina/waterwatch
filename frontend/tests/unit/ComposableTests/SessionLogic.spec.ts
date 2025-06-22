import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useSession, resetSessionInstance } from "../../../src/composables/useSession";

type SessionData = { isAuthenticated: boolean; groups: string[] };

// Helper to mock fetch response
const mockFetchResponse = (status: number, body: Partial<SessionData> | null, shouldReject = false) => {
    if (shouldReject) {
        vi.spyOn(global, "fetch").mockImplementationOnce(() => Promise.reject(new Error("network error")) as any);
    } else {
        const json = body ? Promise.resolve(body) : Promise.resolve({});
        const response = {
            ok: status >= 200 && status < 300,
            status,
            statusText: status === 200 ? "OK" : status === 500 ? "Internal Server Error" : "Unknown",
            json: () => json,
        };
        vi.spyOn(global, "fetch").mockImplementationOnce(() => Promise.resolve(response as any));
    }
};

// Helper to mock multiple fetch responses in sequence
const mockMultipleFetchResponses = (
    responses: Array<{ status: number; body: Partial<SessionData> | null; shouldReject?: boolean }>,
) => {
    let callCount = 0;

    vi.spyOn(global, "fetch").mockImplementation(() => {
        const response = responses[callCount];
        callCount++;

        if (!response) {
            throw new Error(`Unexpected fetch call number ${callCount}`);
        }

        const { status, body, shouldReject = false } = response;

        if (shouldReject) {
            return Promise.reject(new Error("network error"));
        }

        const json = body ? Promise.resolve(body) : Promise.resolve({});
        const mockResponse = {
            ok: status >= 200 && status < 300,
            status,
            statusText: status === 200 ? "OK" : status === 500 ? "Internal Server Error" : "Unknown",
            json: () => json,
        };

        return Promise.resolve(mockResponse as any);
    });
};

describe("useSession", () => {
    let session: ReturnType<typeof useSession>;
    let consoleSpy: any;

    beforeEach(() => {
        // Reset the singleton instance before each test
        resetSessionInstance();

        // Mock console.error to avoid noise in test output
        consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        session = useSession();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        consoleSpy.mockRestore();
        // Also reset after each test to ensure clean state
        resetSessionInstance();
    });

    describe("singleton behavior", () => {
        it("should return the same instance when called multiple times", () => {
            const session1 = useSession();
            const session2 = useSession();

            expect(session1).toBe(session2);
        });
    });

    describe("getSession", () => {
        it("should fetch session data successfully", async () => {
            const data = { isAuthenticated: true, groups: ["admin", "researcher"] };
            mockFetchResponse(200, data);

            const result = await session.getSession();

            expect(result).toEqual(data);
            expect(global.fetch).toHaveBeenCalledWith("/api/session/", {
                credentials: "same-origin",
                method: "GET",
            });
        });

        it("should handle partial session data with defaults", async () => {
            mockFetchResponse(200, { isAuthenticated: true });

            const result = await session.getSession();

            expect(result).toEqual({ isAuthenticated: true, groups: [] });
        });

        it("should handle empty response with defaults", async () => {
            mockFetchResponse(200, {});

            const result = await session.getSession();

            expect(result).toEqual({ isAuthenticated: false, groups: [] });
        });
    });

    describe("isAuthenticated", () => {
        it("should return true when user is authenticated", async () => {
            const data = { isAuthenticated: true, groups: ["admin"] };
            mockFetchResponse(200, data);

            const result = await session.isAuthenticated();

            expect(result).toBe(true);
        });

        it("should return false when user is not authenticated", async () => {
            const data = { isAuthenticated: false, groups: [] };
            mockFetchResponse(200, data);

            const result = await session.isAuthenticated();

            expect(result).toBe(false);
        });

        it("should return false when authentication field is missing", async () => {
            mockFetchResponse(200, { groups: ["user"] });

            const result = await session.isAuthenticated();

            expect(result).toBe(false);
        });
    });

    describe("getUserGroups", () => {
        it("should return user groups when available", async () => {
            const data = { isAuthenticated: true, groups: ["admin", "researcher", "user"] };
            mockFetchResponse(200, data);

            const result = await session.getUserGroups();

            expect(result).toEqual(["admin", "researcher", "user"]);
        });

        it("should return empty array when no groups are provided", async () => {
            const data = { isAuthenticated: true };
            mockFetchResponse(200, data);

            const result = await session.getUserGroups();

            expect(result).toEqual([]);
        });

        it("should return empty array when groups field is null", async () => {
            const data = { isAuthenticated: true, groups: null as any };
            mockFetchResponse(200, data);

            const result = await session.getUserGroups();

            expect(result).toEqual([]);
        });
    });

    describe("caching behavior", () => {
        it("should cache session promise and make only one request for multiple calls", async () => {
            const data = { isAuthenticated: true, groups: ["admin"] };
            mockFetchResponse(200, data);

            // Make multiple concurrent calls
            const [auth1, auth2, groups1, groups2, session1, session2] = await Promise.all([
                session.isAuthenticated(),
                session.isAuthenticated(),
                session.getUserGroups(),
                session.getUserGroups(),
                session.getSession(),
                session.getSession(),
            ]);

            expect(auth1).toBe(true);
            expect(auth2).toBe(true);
            expect(groups1).toEqual(["admin"]);
            expect(groups2).toEqual(["admin"]);
            expect(session1).toEqual(data);
            expect(session2).toEqual(data);

            // Should only make one fetch call due to caching
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it("should cache session promise for sequential calls", async () => {
            const data = { isAuthenticated: false, groups: ["user"] };
            mockFetchResponse(200, data);

            // Make sequential calls
            const auth = await session.isAuthenticated();
            const groups = await session.getUserGroups();
            const sessionData = await session.getSession();

            expect(auth).toBe(false);
            expect(groups).toEqual(["user"]);
            expect(sessionData).toEqual(data);

            // Should only make one fetch call due to caching
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });
    });

    describe("invalidateSession", () => {
        it("should invalidate cached session and force new fetch", async () => {
            const data1 = { isAuthenticated: true, groups: ["admin"] };
            const data2 = { isAuthenticated: false, groups: ["user"] };

            mockMultipleFetchResponses([
                { status: 200, body: data1 },
                { status: 200, body: data2 },
            ]);

            // First call
            const result1 = await session.getSession();
            expect(result1).toEqual(data1);

            // Invalidate session
            session.invalidateSession();

            // Second call should fetch new data
            const result2 = await session.getSession();
            expect(result2).toEqual(data2);

            // Should have made two separate fetch calls
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        it("should allow multiple invalidations without error", () => {
            expect(() => {
                session.invalidateSession();
                session.invalidateSession();
                session.invalidateSession();
            }).not.toThrow();
        });
    });

    describe("refreshSession", () => {
        it("should invalidate and fetch fresh session data", async () => {
            const data1 = { isAuthenticated: true, groups: ["admin"] };
            const data2 = { isAuthenticated: false, groups: ["user"] };

            mockMultipleFetchResponses([
                { status: 200, body: data1 },
                { status: 200, body: data2 },
            ]);

            // Initial session
            const initial = await session.getSession();
            expect(initial).toEqual(data1);

            // Refresh should get new data
            const refreshed = await session.refreshSession();
            expect(refreshed).toEqual(data2);

            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        it("should handle refresh errors gracefully", async () => {
            const data1 = { isAuthenticated: true, groups: ["admin"] };

            mockMultipleFetchResponses([
                { status: 200, body: data1 },
                { status: 500, body: null, shouldReject: true },
            ]);

            // Initial successful session
            await session.getSession();

            // Refresh with error should return defaults
            const result = await session.refreshSession();
            expect(result).toEqual({ isAuthenticated: false, groups: [] });

            expect(consoleSpy).toHaveBeenCalledWith("Session fetch failed:", expect.any(Error));
        });
    });

    describe("initializeSession", () => {
        it("should initialize session and return data", async () => {
            const data = { isAuthenticated: true, groups: ["admin"] };
            mockFetchResponse(200, data);

            const result = await session.initializeSession();

            expect(result).toEqual(data);
            expect(global.fetch).toHaveBeenCalledWith("/api/session/", {
                credentials: "same-origin",
                method: "GET",
            });
        });

        it("should use cached data if session already initialized", async () => {
            const data = { isAuthenticated: true, groups: ["admin"] };
            mockFetchResponse(200, data);

            // First initialization
            const result1 = await session.initializeSession();

            // Second initialization should use cache
            const result2 = await session.initializeSession();

            expect(result1).toEqual(data);
            expect(result2).toEqual(data);
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });
    });

    describe("fetchSession with force parameter", () => {
        it("should respect force parameter and bypass cache", async () => {
            const data1 = { isAuthenticated: true, groups: ["admin"] };
            const data2 = { isAuthenticated: false, groups: ["user"] };

            mockMultipleFetchResponses([
                { status: 200, body: data1 },
                { status: 200, body: data2 },
            ]);

            // Initial fetch
            const result1 = await session.fetchSession();
            expect(result1).toEqual(data1);

            // Force fetch should bypass cache
            const result2 = await session.fetchSession(true);
            expect(result2).toEqual(data2);

            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        it("should use cache when force is false", async () => {
            const data = { isAuthenticated: true, groups: ["admin"] };
            mockFetchResponse(200, data);

            // Multiple calls with force=false
            const result1 = await session.fetchSession(false);
            const result2 = await session.fetchSession(false);

            expect(result1).toEqual(data);
            expect(result2).toEqual(data);
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });
    });

    describe("error handling", () => {
        it("should handle HTTP error responses gracefully", async () => {
            mockFetchResponse(401, null);

            const result = await session.getSession();

            expect(result).toEqual({ isAuthenticated: false, groups: [] });
            expect(consoleSpy).toHaveBeenCalledWith("Session fetch failed:", expect.any(Error));
        });

        it("should handle network errors gracefully", async () => {
            mockFetchResponse(0, null, true);

            const result = await session.getSession();

            expect(result).toEqual({ isAuthenticated: false, groups: [] });
            expect(consoleSpy).toHaveBeenCalledWith("Session fetch failed:", expect.any(Error));
        });

        it("should handle malformed JSON responses", async () => {
            const response = {
                ok: true,
                status: 200,
                statusText: "OK",
                json: () => Promise.reject(new Error("Invalid JSON")),
            };
            vi.spyOn(global, "fetch").mockImplementationOnce(() => Promise.resolve(response as any));

            const result = await session.getSession();

            expect(result).toEqual({ isAuthenticated: false, groups: [] });
            expect(consoleSpy).toHaveBeenCalledWith("Session fetch failed:", expect.any(Error));
        });

        it("should handle various HTTP error status codes", async () => {
            const statusCodes = [400, 401, 403, 404, 500, 502, 503];

            for (const status of statusCodes) {
                vi.clearAllMocks();
                resetSessionInstance(); // Reset session for each status code test
                session = useSession(); // Get fresh session instance
                mockFetchResponse(status, null);

                const result = await session.getSession();

                expect(result).toEqual({ isAuthenticated: false, groups: [] });
                expect(consoleSpy).toHaveBeenCalledWith(
                    "Session fetch failed:",
                    expect.objectContaining({
                        message: expect.stringContaining(`Failed to fetch session: ${status}`),
                    }),
                );
            }
        });
    });

    describe("API contract", () => {
        it("should make requests with correct parameters", async () => {
            const data = { isAuthenticated: true, groups: ["admin"] };
            mockFetchResponse(200, data);

            await session.getSession();

            expect(global.fetch).toHaveBeenCalledWith("/api/session/", {
                credentials: "same-origin",
                method: "GET",
            });
        });

        it("should include all expected methods in the returned object", () => {
            const methods = [
                "getSession",
                "isAuthenticated",
                "getUserGroups",
                "invalidateSession",
                "refreshSession",
                "initializeSession",
                "fetchSession",
            ];

            methods.forEach((method) => {
                expect(session).toHaveProperty(method);
                expect(typeof session[method as keyof typeof session]).toBe("function");
            });
        });
    });

    describe("edge cases", () => {
        it("should handle undefined response data", async () => {
            const response = {
                ok: true,
                status: 200,
                statusText: "OK",
                json: () => Promise.resolve(undefined),
            };
            vi.spyOn(global, "fetch").mockImplementationOnce(() => Promise.resolve(response as any));

            const result = await session.getSession();

            expect(result).toEqual({ isAuthenticated: false, groups: [] });
        });

        it("should handle null response data", async () => {
            const response = {
                ok: true,
                status: 200,
                statusText: "OK",
                json: () => Promise.resolve(null),
            };
            vi.spyOn(global, "fetch").mockImplementationOnce(() => Promise.resolve(response as any));

            const result = await session.getSession();

            expect(result).toEqual({ isAuthenticated: false, groups: [] });
        });

        it("should handle response with extra fields", async () => {
            const data = {
                isAuthenticated: true,
                groups: ["admin"],
                extraField: "should be ignored",
                anotherField: 123,
            };
            mockFetchResponse(200, data);

            const result = await session.getSession();

            expect(result).toEqual({ isAuthenticated: true, groups: ["admin"] });
        });
    });
});
