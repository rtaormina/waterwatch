import { mount, VueWrapper } from "@vue/test-utils";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
const fakeFetch = vi.fn();
vi.stubGlobal("fetch", fakeFetch);
import DurationInput from "../../../../src/components/Measurement/DurationInput.vue";

const pushMock = vi.fn();
vi.mock("vue-router", () => ({
    useRouter: () => ({ push: pushMock }),
}));

/**
 * Test for DurationInput.vue
 * This test suite checks the functionality of the duration input handlers.
 */
describe("MeasurementComponent.vue time handlers", () => {
    let wrapper: VueWrapper<any>;

    beforeEach(() => {
        wrapper = mount(DurationInput, {
            props: {
                modelValue: {
                    minutes: 0,
                    seconds: 0,
                },
            },
        });
        pushMock.mockReset();
        fakeFetch.mockReset();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks;
    });

    function makeKeyboardEvent(key: string, value: string) {
        return {
            key,
            target: { value, replace: String.prototype.replace },
            preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;
    }

    it("handleKeyPress updates modelValue for valid digit", () => {
        const ev = makeKeyboardEvent("7", "1");
        const result = wrapper.vm.handleKeyPress(ev);
        expect(ev.preventDefault).toHaveBeenCalledTimes(0);
        expect(result).toEqual(17);
    });

    it("handleKeyPress emits for multiple key presses", () => {
        const ev = makeKeyboardEvent("2", "");
        const result_1 = wrapper.vm.handleKeyPress(ev);
        const ev2 = makeKeyboardEvent("3", "2");
        const result_2 = wrapper.vm.handleKeyPress(ev2);
        expect(ev.preventDefault).toHaveBeenCalledTimes(0);
        expect(result_1).toEqual(2);
        expect(result_2).toEqual(23);
    });

    it("handleKeyPress blocks out of range digit", () => {
        const ev = makeKeyboardEvent("2", "6");
        wrapper.vm.handleKeyPress(ev);
        expect(ev.preventDefault).toHaveBeenCalled();
    });

    it("handleKeyPress blocks negative", () => {
        const ev = makeKeyboardEvent(".", "-");
        wrapper.vm.handleKeyPress(ev);
        expect(ev.preventDefault).toHaveBeenCalled();
    });

    it("handleKeyPress blocks non-digits", () => {
        const ev = makeKeyboardEvent("a", "1");
        wrapper.vm.handleKeyPress(ev);
        expect(ev.preventDefault).toHaveBeenCalled();
    });

    it("handlePaste emits for valid paste", () => {
        const ev = {
            clipboardData: { getData: () => "42" },
            preventDefault: vi.fn(),
        } as unknown as ClipboardEvent;
        const result = wrapper.vm.handlePaste(ev);
        expect(ev.preventDefault).toHaveBeenCalledTimes(0);
        expect(result).toBe(42);
    });

    it("handlePaste blocks non-digit paste", () => {
        const prevent = vi.fn();
        const ev = {
            clipboardData: { getData: () => "abc" },
            preventDefault: prevent,
        } as unknown as ClipboardEvent;
        wrapper.vm.handlePaste(ev);
        expect(prevent).toHaveBeenCalled();
    });

    it("handlePaste blocks out-of-range paste", () => {
        const prevent = vi.fn();
        const ev = {
            clipboardData: { getData: () => "99" },
            preventDefault: prevent,
        } as unknown as ClipboardEvent;
        wrapper.vm.handlePaste(ev);
        expect(prevent).toHaveBeenCalled();
    });

    it("handleInput emits for valid input", () => {
        const ev = { target: { value: "58" }, preventDefault: vi.fn() } as unknown as Event;
        const result = wrapper.vm.handleInput(ev);
        expect(ev.preventDefault).toHaveBeenCalledTimes(0);
        expect(result).toBe(58);
    });

    it("handleInput blocks invalid input", () => {
        const prevent = vi.fn();
        const ev = { target: { value: "60" }, preventDefault: prevent } as unknown as Event;
        wrapper.vm.handleInput(ev);
        expect(prevent).toHaveBeenCalled();
    });
});
