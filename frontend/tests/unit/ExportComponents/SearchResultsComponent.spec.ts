import { flushPromises, mount, VueWrapper } from "@vue/test-utils";
import { describe, it, expect, beforeEach, vi } from "vitest";
vi.stubGlobal(
    "fetch",
    vi.fn(() =>
        Promise.resolve(
            new Response(JSON.stringify({ permissions: [] }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }),
        ),
    ),
);

vi.mock("@/composables/permissionsLogic", () => {
    return {
        permissionsLogic: () => ({
            fetchPermissions: vi.fn(async () => {
                return Promise.resolve();
            }),
            hasPermission: (perm: string) => {
                return perm === "measurement_export.can_export";
            },
            allPermissions: () => {
                return ["measurement_export.can_export"];
            },
        }),
    };
});

import SearchResults from "../../../src/components/SearchResultsComponent.vue";
import { nextTick } from "vue";
import { afterEach } from "vitest";

describe("SearchResultsComponent tests", () => {
    let wrapper: VueWrapper<any>;
    let container: HTMLDivElement;
    beforeEach(async () => {
        container = document.createElement("div");
        container.style.width = "200px";
        // manually set scrollWidth
        Object.defineProperty(container, "scrollWidth", { value: 300 });
        await flushPromises();
    });
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("measures on mount and sets totalWidth = scrollWidth + 100", async () => {
        wrapper = mount(SearchResults, {
            attachTo: document.body,
            props: {
                results: { count: 4, avgTemp: 4.4 },
                searched: true,
                showModal: false,
                filtersOutOfSync: false,
                temperatureUnit: "F",
                format: "csv",
            },
            global: {
                stubs: ["XMarkIcon", "MagnifyingGlassIcon"],
            },
        });
        wrapper.vm.wrapperRef = container;
        await nextTick();
        expect(wrapper.vm.totalWidth).toBe(300 + 100);
    });

    it("computes fahrenheit correctly", async () => {
        wrapper = mount(SearchResults, {
            attachTo: document.body,
            props: {
                results: { count: 4, avgTemp: 4.4 },
                searched: true,
                showModal: false,
                filtersOutOfSync: false,
                temperatureUnit: "F",
                format: "csv",
            },
            global: {
                stubs: ["XMarkIcon", "MagnifyingGlassIcon"],
            },
        });
        wrapper.vm.wrapperRef = container;
        await nextTick();
        const tempVal = wrapper.find('[data-testid="avg-temp"]');
        expect(tempVal.text()).toBe("39.9°F");

        const numRes = wrapper.find('[data-testid="num-results"]');
        expect(numRes.text()).toBe("4");
    });

    it("computes celsius correctly", async () => {
        wrapper = mount(SearchResults, {
            attachTo: document.body,
            props: {
                results: { count: 2, avgTemp: 4.4 },
                searched: true,
                showModal: false,
                filtersOutOfSync: false,
                temperatureUnit: "C",
                format: "csv",
            },
            global: {
                stubs: ["XMarkIcon", "MagnifyingGlassIcon"],
            },
        });
        wrapper.vm.wrapperRef = container;
        await nextTick();
        const tempVal = wrapper.find('[data-testid="avg-temp"]');
        expect(tempVal.text()).toBe("4.4°C");

        const numRes = wrapper.find('[data-testid="num-results"]');
        expect(numRes.text()).toBe("2");
    });

    it("measures correctly", async () => {
        wrapper = mount(SearchResults, {
            attachTo: document.body,
            props: {
                results: { count: 2, avgTemp: 4.4 },
                searched: true,
                showModal: false,
                filtersOutOfSync: false,
                temperatureUnit: "C",
                format: "csv",
            },
            global: {
                stubs: ["XMarkIcon", "MagnifyingGlassIcon"],
            },
        });
        wrapper.vm.wrapperRef = container;
        await nextTick();
        const tempVal = wrapper.find('[data-testid="avg-temp"]');
        expect(tempVal.text()).toBe("4.4°C");

        const numRes = wrapper.find('[data-testid="num-results"]');
        expect(numRes.text()).toBe("2");
    });
});
