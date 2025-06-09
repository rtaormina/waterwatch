import { mount, VueWrapper, flushPromises } from "@vue/test-utils";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { nextTick, ref } from "vue";
import SearchBarComponent from "../../../../src/components/Export/SearchBarComponent.vue";

const mockPresets = ref<Array<{ id: string; name: string }>>([
  { id: "1", name: "Preset One" },
  { id: "2", name: "Preset Two" },
  { id: "3", name: "Another Preset" },
]);
const mockLoading = ref(false);
const mockError = ref<null | string>(null);
const mockLoadPresets = vi.fn();
const mockFilterPresets = vi.fn((query: string) =>
  mockPresets.value.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  )
);

vi.mock("../../../../src/composables/Export/usePresets", () => ({
  usePresets: () => ({
    presets: mockPresets,
    loading: mockLoading,
    error: mockError,
    loadPresets: mockLoadPresets,
    filterPresets: mockFilterPresets,
  }),
}));

describe("SearchBarComponent.vue", () => {
  let wrapper: VueWrapper<any>;

  const factory = (props: { query?: string; searchDisabled?: boolean } = {}) => {
    return mount(SearchBarComponent, {
      props: {
        query: props.query ?? "",
        searchDisabled: props.searchDisabled,
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPresets.value = [
      { id: "1", name: "Preset One" },
      { id: "2", name: "Preset Two" },
      { id: "3", name: "Another Preset" },
    ];
    mockLoading.value = false;
    mockError.value = null;
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe("Component Mounting and Exposed Methods", () => {
    it("mounts without errors and calls loadPresets on mount", () => {
      wrapper = factory();
      expect(() => wrapper).not.toThrow();
      expect(mockLoadPresets).toHaveBeenCalled();
    });

    it("exposes required methods", () => {
      wrapper = factory();
      expect(typeof wrapper.vm.clearSearch).toBe("function");
      expect(typeof wrapper.vm.applyPreset).toBe("function");
      expect(typeof wrapper.vm.handleSearch).toBe("function");
      expect(typeof wrapper.vm.handleFocus).toBe("function");
      expect(typeof wrapper.vm.handleBlur).toBe("function");
      expect(typeof wrapper.vm.handleKeydown).toBe("function");
    });
  });

  describe("Reactivity and Watchers", () => {
    it("initializes inputQuery from prop 'query'", () => {
      wrapper = factory({ query: "initial" });
      expect(wrapper.vm.inputQuery).toBe("initial");
    });

    it("updates inputQuery when prop 'query' changes", async () => {
      wrapper = factory({ query: "first" });
      expect(wrapper.vm.inputQuery).toBe("first");
      await wrapper.setProps({ query: "second" });
      await nextTick();
      expect(wrapper.vm.inputQuery).toBe("second");
    });
  });

  describe("clearSearch Method", () => {
    it("clears inputQuery when called", async () => {
      wrapper = factory({ query: "search term" });
      expect(wrapper.vm.inputQuery).toBe("search term");
      wrapper.vm.clearSearch();
      await nextTick();
      expect(wrapper.vm.inputQuery).toBe("");
    });
  });

  describe("applyPreset Method", () => {
    it("emits 'apply-preset' with the correct payload and clears inputQuery", async () => {
      wrapper = factory();
      // Pre-fill the inputQuery to ensure clearSearch is invoked
      wrapper.vm.inputQuery = "something";
      const preset = { id: "2", name: "Preset Two" };
      await wrapper.vm.applyPreset(preset);
      await nextTick();
      const emitted = wrapper.emitted("apply-preset");
      expect(emitted).toBeTruthy();
      expect(emitted![0]).toEqual([preset]);
      expect(wrapper.vm.inputQuery).toBe("");
    });
  });

  describe("handleSearch Method", () => {
    it("emits 'search' when called directly", () => {
      wrapper = factory();
      wrapper.vm.handleSearch();
      const emitted = wrapper.emitted("search");
      expect(emitted).toBeTruthy();
      expect(emitted!.length).toBe(1);
    });

    it("is invoked when Enter key is pressed in handleKeydown", () => {
      wrapper = factory();
      wrapper.vm.handleKeydown({ key: "Enter" } as KeyboardEvent);
      const emitted = wrapper.emitted("search");
      expect(emitted).toBeTruthy();
      expect(emitted!.length).toBe(1);
    });
  });

  describe("handleFocus Method", () => {
    it("sets showDropdown to true", async () => {
      wrapper = factory();
      expect(wrapper.vm.showDropdown).toBe(false);
      wrapper.vm.handleFocus();
      await nextTick();
      expect(wrapper.vm.showDropdown).toBe(true);
    });

    it("calls loadPresets if presets are empty and not loading", async () => {
      mockPresets.value = [];
      mockLoading.value = false;
      wrapper = factory();
      wrapper.vm.showDropdown = false;
      wrapper.vm.handleFocus();
      await nextTick();
      // One call from mount + one from handleFocus
      expect(mockLoadPresets).toHaveBeenCalledTimes(2);
    });

    it("does not call loadPresets if presets already loaded", async () => {
      wrapper = factory();
      mockLoadPresets.mockClear();
      wrapper.vm.showDropdown = false;
      wrapper.vm.handleFocus();
      await nextTick();
      expect(mockLoadPresets).not.toHaveBeenCalled();
    });
  });

  describe("handleBlur Method", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("hides dropdown after a 200ms delay", async () => {
      wrapper = factory();
      wrapper.vm.showDropdown = true;
      wrapper.vm.handleBlur();
      // Immediately after calling, it should still be true
      expect(wrapper.vm.showDropdown).toBe(true);
      // Advance timers by 200ms
      vi.advanceTimersByTime(200);
      await nextTick();
      expect(wrapper.vm.showDropdown).toBe(false);
    });
  });

  describe("handleKeydown Method", () => {
    it("hides dropdown when Escape key is pressed", async () => {
      wrapper = factory();
      wrapper.vm.showDropdown = true;
      wrapper.vm.handleKeydown({ key: "Escape" } as KeyboardEvent);
      await nextTick();
      expect(wrapper.vm.showDropdown).toBe(false);
    });

    it("does nothing on other keys", async () => {
      wrapper = factory();
      wrapper.vm.showDropdown = true;
      wrapper.vm.handleKeydown({ key: "a" } as KeyboardEvent);
      await nextTick();
      expect(wrapper.vm.showDropdown).toBe(true);
    });
  });

  describe("Computed Property: filteredPresets", () => {
    it("returns all presets when input is empty and showDropdown is true", async () => {
      wrapper = factory();
      wrapper.vm.inputQuery = "";
      wrapper.vm.showDropdown = true;
      await nextTick();
      expect(wrapper.vm.filteredPresets).toEqual(mockPresets.value);
    });

    it("returns empty array when input is empty and showDropdown is false", async () => {
      wrapper = factory();
      wrapper.vm.inputQuery = "";
      wrapper.vm.showDropdown = false;
      await nextTick();
      expect(wrapper.vm.filteredPresets).toEqual([]);
    });

    it("calls filterPresets and returns matching presets when input has value", async () => {
      wrapper = factory();
      wrapper.vm.inputQuery = "preset";
      wrapper.vm.showDropdown = true;
      await nextTick();
      expect(mockFilterPresets).toHaveBeenCalledWith("preset");
      expect(wrapper.vm.filteredPresets).toEqual([
        { id: "1", name: "Preset One" },
        { id: "2", name: "Preset Two" },
        { id: "3", name: "Another Preset" },
      ]);

      mockFilterPresets.mockClear();
      wrapper.vm.inputQuery = "another";
      await nextTick();
      expect(mockFilterPresets).toHaveBeenCalledWith("another");
      expect(wrapper.vm.filteredPresets).toEqual([
        { id: "3", name: "Another Preset" },
      ]);
    });

    it("returns empty array when filterPresets finds nothing", async () => {
      wrapper = factory();
      mockFilterPresets.mockReturnValueOnce([]);
      wrapper.vm.inputQuery = "nonexistent";
      wrapper.vm.showDropdown = true;
      await nextTick();
      expect(mockFilterPresets).toHaveBeenCalledWith("nonexistent");
      expect(wrapper.vm.filteredPresets).toEqual([]);
    });
  });

  describe("Computed Property: showNoResults", () => {
    it("is falsy when input is empty", async () => {
      wrapper = factory();
      wrapper.vm.inputQuery = "";
      await nextTick();
      expect(wrapper.vm.showNoResults).toBeFalsy();
    });

    it("is falsy when loading is true", async () => {
      wrapper = factory();
      wrapper.vm.inputQuery = "xyz";
      mockLoading.value = true;
      await nextTick();
      expect(wrapper.vm.showNoResults).toBeFalsy();
    });

    it("is truthy when input has value, no filteredPresets, and not loading", async () => {
      wrapper = factory();
      wrapper.vm.inputQuery = "zzz";
      mockLoading.value = false;
      mockFilterPresets.mockReturnValueOnce([]);
      wrapper.vm.showDropdown = true;
      await nextTick();
      expect(wrapper.vm.filteredPresets).toEqual([]);
      expect(wrapper.vm.showNoResults).toBeTruthy();
    });
  });

  describe("Integration: filteredPresets + applyPreset behavior", () => {
    it("when showDropdown is true and input is empty, filteredPresets matches all presets; applyPreset clears inputQuery and emits correctly", async () => {
      wrapper = factory();
      // Ensure dropdown would be visible and no input
      wrapper.vm.inputQuery = "";
      wrapper.vm.showDropdown = true;
      await nextTick();

      // filteredPresets should be identical to mockPresets
      expect(wrapper.vm.filteredPresets).toEqual(mockPresets.value);

      // Call applyPreset on the second preset, as if clicking it
      const toApply = mockPresets.value[1];
      await wrapper.vm.applyPreset(toApply);
      await nextTick();

      // It should emit "apply-preset" and clear the inputQuery
      const emitted = wrapper.emitted("apply-preset");
      expect(emitted).toBeTruthy();
      expect(emitted![0]).toEqual([toApply]);
      expect(wrapper.vm.inputQuery).toBe("");
    });
  });
});
