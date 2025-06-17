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

import { useLogin, loggedIn } from "../../../src/composables/LoginLogic.ts";
import { useRouter } from "vue-router";

describe("useLogin composable", () => {
    let push: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        push = vi.fn();
        (useRouter as unknown as any).mockReturnValue({ push });
        vi.clearAllMocks();
        loggedIn.value = false;

        globalThis.useToast = () => ({
            add: vi.fn(),
        });
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

        it("shows error on invalid credentials", async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: false,
                json: async () => ({ detail: "Invalid credentials." }),
            });

            const { formData, handleSubmit, showError, errorMessage } = useLogin();
            formData.username = "x";
            formData.password = "y";

            await handleSubmit();
            expect(showError.value).toBe(true);
            expect(errorMessage.value).toBe("Invalid username or password.");
        });

        it("shows error on network error", async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: false,
                json: async () => ({ detail: "Network error." }),
            });

            const { formData, handleSubmit, showError, errorMessage } = useLogin();
            formData.username = "x";
            formData.password = "y";

            await handleSubmit();
            expect(showError.value).toBe(true);
            expect(errorMessage.value).toBe("An error occurred while logging in.");
        });

        it("returns true and sets loggedIn when username present", async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: async () => ({ username: "foo" }),
            });

            const { isLoggedIn } = useLogin();
            const result = await isLoggedIn();
            expect(result).toBe(true);
            expect(loggedIn.value).toBe(true);
        });

        it("on successful logout clears state and routes to Map", async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => ({}) });

            const { logout } = useLogin();
            loggedIn.value = true;

            await logout();
            expect(loggedIn.value).toBe(false);
            expect(push).toHaveBeenCalledWith({ name: "Map" });
        });

        it("on failed logout (network) still clears state and routes to Map", async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(new Error("Network down"));

            const { logout } = useLogin();
            loggedIn.value = true;

            await logout();
            expect(loggedIn.value).toBe(false);
            expect(push).toHaveBeenCalledWith({ name: "Map" });
        });

        it("returns false and sets loggedIn=false when isAuthenticated=false", async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                json: async () => ({ isAuthenticated: false }),
            });

            const { isLoggedIn } = useLogin();
            const result = await isLoggedIn();
            expect(result).toBe(false);
            expect(loggedIn.value).toBe(false);
        });

        it("on network error returns false and sets loggedIn=false", async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(new Error("fail"));

            const { isLoggedIn } = useLogin();
            const result = await isLoggedIn();
            expect(result).toBe(false);
            expect(loggedIn.value).toBe(false);
        });
    });
});
