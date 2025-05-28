import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

vi.mock("file-saver", () => ({
    saveAs: vi.fn(),
}));

vi.mock("universal-cookie", () => ({
    default: vi.fn().mockImplementation(() => ({
        get: vi.fn().mockReturnValue("test-csrf-token"),
    })),
}));

vi.mock("vue-router", () => ({ useRouter: vi.fn() }));

global.fetch = vi.fn() as unknown as typeof fetch;

import { useLogin, loggedIn } from "../../src/composables/LoginLogic.ts";
import { useRouter } from "vue-router";

/**
 * Mock response class to simulate fetch responses
 * This is used to mock the fetch API in tests.
 */
class MockResponse {
    /**
     * MockResponse simulates the response from the fetch API.
     * It can return a Blob or a Promise of a Blob, and optionally a status and text for error responses.
     *
     * @param {boolean} ok - Indicates if the response is successful (status in the range 200-299).
     * @param {Blob | Promise<Blob>} _blob - The blob data or a promise that resolves to blob data.
     * @param {number} [status=200] - The HTTP status code of the response.
     * @param {string} [_text] - Optional text for error responses.
     */
    constructor(
        public ok: boolean,
        private _blob: Blob | Promise<Blob>, // Allow blob or promise of blob
        public status = 200,
        private _text?: string, // Optional text for error responses
    ) {}

    /**
     * Returns the status of the response.
     *
     * @returns {number} The HTTP status code.
     */
    blob(): Promise<Blob> {
        return Promise.resolve(this._blob);
    }

    /**
     * Returns the text content of the response.
     * If the response is successful, it returns the text content of the blob.
     * If the response is not successful, it returns a predefined error message.
     *
     * @returns {Promise<string>} The text content of the response.
     */
    async text(): Promise<string> {
        // Add text method for error handling
        if (this._text !== undefined) {
            return Promise.resolve(this._text);
        }
        if (this.ok) {
            // This behavior might need adjustment based on typical usage of .text()
            // For simplicity, if blob is available, try to read it as text.
            // However, for mock purposes, usually specific text is provided for errors.
            const blobContent = await Promise.resolve(this._blob);
            return blobContent.text();
        }
        return Promise.resolve(`Error content for status ${this.status}`);
    }
}

describe("useLogin composable", () => {
    let push: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        push = vi.fn();
        (useRouter as unknown as any).mockReturnValue({ push });
        vi.clearAllMocks();
        loggedIn.value = false;
    });

    describe("handleSubmit()", () => {
        it("redirects to Map for non-researcher users", async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: async () => ({ detail: "Successfully logged in.", groups: [] }),
            });

            const { formData, handleSubmit, showError, errorMessage } = useLogin();
            formData.username = "user";
            formData.password = "pass";

            await handleSubmit();
            expect(global.fetch).toHaveBeenCalledOnce();
            expect(push).toHaveBeenCalledWith({ name: "Map" });
            expect(showError.value).toBe(false);
            expect(errorMessage.value).toBe("");
        });

        it("redirects to Export for researcher users", async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: async () => ({ detail: "Successfully logged in.", groups: ["researcher"] }),
            });

            const { formData, handleSubmit, showError } = useLogin();
            formData.username = "res";
            formData.password = "pass";

            await handleSubmit();
            expect(global.fetch).toHaveBeenCalledOnce();
            expect(showError.value).toBe(false);
            expect(push).toHaveBeenCalledWith({ name: "Export" });
        });

        //     it("shows error on invalid credentials", async () => {
        //         fetchMock.mockResolvedValue({
        //             ok: false,
        //             json: async () => ({ detail: "Invalid username or password." }),
        //         });

        //         const { formData, handleSubmit, showError, errorMessage } = useLogin();
        //         formData.username = "x";
        //         formData.password = "y";

        //         await handleSubmit();
        //         expect(showError.value).toBe(true);
        //         expect(errorMessage.value).toBe("Invalid username or password.");
        //     });

        //     it("shows network error message on fetch failure", async () => {
        //         fetchMock.mockRejectedValue(new Error("Failed to fetch"));

        //         const { formData, handleSubmit, showError, errorMessage } = useLogin();
        //         formData.username = "a";
        //         formData.password = "b";

        //         await handleSubmit();
        //         expect(showError.value).toBe(true);
        //         expect(errorMessage.value).toBe("Network error. Please try again later.");
        //     });
    });

    // describe("login()", () => {
    //     it("navigates to Login route", () => {
    //         const { login } = useLogin();
    //         login();
    //         expect(push).toHaveBeenCalledWith({ name: "Login" });
    //     });
    // });

    // describe("logout()", () => {
    //     afterEach(() => {
    //         vi.resetAllMocks();
    //     });

    //     it("on successful logout clears state and routes to Map", async () => {
    //         fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    //         const { logout } = useLogin();
    //         loggedIn.value = true;

    //         await logout();
    //         expect(loggedIn.value).toBe(false);
    //         expect(push).toHaveBeenCalledWith({ name: "Map" });
    //     });

    //     it("on failed logout (network) still clears state and routes to Map", async () => {
    //         fetchMock.mockRejectedValue(new Error("Network down"));

    //         const { logout } = useLogin();
    //         loggedIn.value = true;

    //         await logout();
    //         expect(loggedIn.value).toBe(false);
    //         expect(push).toHaveBeenCalledWith({ name: "Map" });
    //     });
    // });

    // describe("isLoggedIn()", () => {
    //     afterEach(() => {
    //         vi.resetAllMocks();
    //     });

    //     it("returns true and sets loggedIn when username present", async () => {
    //         fetchMock.mockResolvedValue({
    //             json: async () => ({ isAuthenticated: true }),
    //         });

    //         const { isLoggedIn } = useLogin();
    //         const result = await isLoggedIn();
    //         expect(result).toBe(true);
    //         expect(loggedIn.value).toBe(true);
    //     });

    //     it("returns false and sets loggedIn=false when isAuthenticated=false", async () => {
    //         fetchMock.mockResolvedValue({
    //             json: async () => ({ isAuthenticated: false }),
    //         });

    //         const { isLoggedIn } = useLogin();
    //         const result = await isLoggedIn();
    //         expect(result).toBe(false);
    //         expect(loggedIn.value).toBe(false);
    //     });

    //     it("on network error returns false and sets loggedIn=false", async () => {
    //         fetchMock.mockRejectedValue(new Error("fail"));

    //         const { isLoggedIn } = useLogin();
    //         const result = await isLoggedIn();
    //         expect(result).toBe(false);
    //         expect(loggedIn.value).toBe(false);
    //     });
    // });
});
