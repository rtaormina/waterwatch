import { mount } from "@vue/test-utils";
import SideBar from "../../../../src/components/MenuItems/SideBar.vue";
import { describe, expect, it, vi } from "vitest";

describe("SideBarComponent", () => {
    it("should render", async () => {
        const wrapper = mount(SideBar, {
            props: {
                title: "Test Sidebar",
            },
        });
        expect(wrapper.exists()).toBe(true);
    });

    it("should render default slot when provided", () => {
        const wrapper = mount(SideBar, {
            props: {
                title: "Test Sidebar",
            },
            slots: {
                default: "<div>Default slot content</div>",
            },
        });

        expect(wrapper.html()).toContain("Default slot content");
    });
});
