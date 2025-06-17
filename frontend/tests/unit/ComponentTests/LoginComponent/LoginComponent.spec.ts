import { describe, it, expect, beforeEach, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import LoginPage from "../../../../src/components/LoginComponent.vue";

const pushMock = vi.fn();
vi.mock("vue-router", () => ({
    useRouter: () => ({ push: pushMock }),
}));

vi.mock("universal-cookie", () => {
    return {
        default: class {
            get() {
                return "dummy";
            }
        },
    };
});

global.fetch = vi.fn() as unknown as typeof fetch;

describe("LoginPage.vue", () => {
    beforeEach(() => {});

    it("renders username and password inputs and submit button", () => {
        const wrapper = mount(LoginPage);

        // find inputs by placeholder
        const usernameInput = wrapper.find('input[placeholder="Your Username"]');
        const passwordInput = wrapper.find('input[placeholder="Your Password"]');
        const submitBtn = wrapper.find('[data-testid="login-button"]');

        expect(usernameInput.exists()).toBe(true);
        expect(passwordInput.exists()).toBe(true);
        expect(submitBtn.exists()).toBe(true);
    });

    it("calls handleSubmit when the form is submitted", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => ({ detail: "Successfully logged in.", groups: [] }),
        });

        const wrapper = mount(LoginPage);

        // simulate user typing
        await wrapper.find('input[placeholder="Your Username"]').setValue("alice");
        await wrapper.find('input[placeholder="Your Password"]').setValue("secret");

        // submit via button click
        await wrapper.find("form").trigger("submit.prevent");
        // (optionally) wait for any async work to finish
        await flushPromises();

        expect(fetch).toHaveBeenCalledWith("/api/login/", {
            body: '{"username":"alice","password":"secret"}',
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": "dummy",
            },
            method: "POST",
        });
    });
});
