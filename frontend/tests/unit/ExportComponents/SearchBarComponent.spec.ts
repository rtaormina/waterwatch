import { mount, VueWrapper } from "@vue/test-utils";
import { describe, it, expect, beforeEach, vi } from "vitest";
import SearchBar from "../../../src/components/SearchBarComponent.vue";
import { nextTick } from "vue";
import { afterEach } from "node:test";


describe("SearchBarComponent tests", () => {
    let wrapper: VueWrapper<any>;

    beforeEach(() => {
        wrapper = mount(SearchBar, {
            props: { query: "" },
            global: {
                stubs: ["XMarkIcon", "MagnifyingGlassIcon"],
            },
        });

    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("checks loading works", async () => {
        wrapper.vm.showDropdown = true;
        wrapper.vm.loading = true;
        await nextTick()
        const loading = wrapper.findAll('[data-testid="loading-presets"]')[0];
        expect(loading.exists()).toBe(true);
        expect(loading.text()).toBe("Loading presets...");
    });

    it("checks no results works", async () => {
        wrapper.vm.showDropdown = true;
        wrapper.vm.loading = false;
        wrapper.vm.showNoResults= true;
        await nextTick()
        const results = wrapper.findAll('[data-testid="results"]')[0];
        expect(results.exists()).toBe(true);
        expect(results.text()).toBe("No presets found");
    });

    it("checks errors works", async () => {
        wrapper.vm.showDropdown = true;
        wrapper.vm.loading = false;
        wrapper.vm.showNoResults= true;
        wrapper.vm.error = "Presets failed to load"
        await nextTick()
        const results = wrapper.findAll('[data-testid="preset-error"]')[0];
        expect(results.exists()).toBe(true);
        expect(results.text()).toBe("Presets failed to load");
    });
});
