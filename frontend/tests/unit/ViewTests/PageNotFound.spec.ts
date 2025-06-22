import { mount } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PageNotFound from "../../../src/views/ErrorPages/PageNotFound.vue";
import { createRouter, createWebHistory } from "vue-router";

let router;

beforeEach(async () => {
    router = createRouter({
        history: createWebHistory(),
        routes: [
            { path: "/", name: "home", component: { template: "<div>Home</div>" } },
            { path: "/:pathMatch(.*)*", name: "not-found", component: PageNotFound },
        ],
    });

    router.push("/nonexisting-page");
    await router.isReady();
});

describe("Page not Found allows navigating back", () => {
    it("allows going back to home page", async () => {
        const wrapper = mount(PageNotFound, {
            global: {
                plugins: [router],
            },
        });

        expect(wrapper.text()).toContain("404");
        expect(wrapper.text()).toContain("Page Not Found");

        const push = vi.spyOn(router, "push");
        await wrapper.find("[data-testid='go-home-button']").trigger("click");

        expect(push).toHaveBeenCalledTimes(1);
        expect(push).toHaveBeenCalledWith("/");
    });
    it("allows going back to previous page", async () => {
        const wrapper = mount(PageNotFound, {
            global: {
                plugins: [router],
            },
        });

        expect(wrapper.text()).toContain("404");
        expect(wrapper.text()).toContain("Page Not Found");

        const back = vi.spyOn(router, "back");
        await wrapper.find("[data-testid='go-back-button']").trigger("click");

        expect(back).toHaveBeenCalledTimes(1);
    });
});
