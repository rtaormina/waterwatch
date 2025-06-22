import { mount, VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const fakeFetch = vi.fn();
vi.stubGlobal("fetch", fakeFetch);
import TemperatureMetric from "../../../../src/components/Measurement/TemperatureMetric.vue";
import { sensorOptions } from "../../../../src/composables/MeasurementCollectionLogic";

const pushMock = vi.fn();
vi.mock("vue-router", () => ({
    useRouter: () => ({ push: pushMock }),
}));

/**
 * Test for TemperatureMetric.vue temperature handler
 * This test suite checks the functionality of the temperature input handlers in the TemperatureMetric.
 */
describe("TemperatureMetric.vue temperature handler", () => {
    let wrapper: VueWrapper<any>;

    beforeEach(() => {
        wrapper = mount(TemperatureMetric, {
            props: {
                modelValue: {
                    value: "2",
                    unit: "C",
                    sensor: "analog thermometer",
                    time_waited: {
                        minutes: 0,
                        seconds: 0,
                    },
                },
                sensorOptions: sensorOptions,
            },
        });

        pushMock.mockReset();
        fakeFetch.mockReset();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks;
    });

    function makeTempEvent(key: string, value: string) {
        return {
            key,
            target: { value, replace: String.prototype.replace },
            preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;
    }

    it("handleTempPress allows digit within 0-212", () => {
        const ev = makeTempEvent("1", "20");
        expect(ev.preventDefault).toHaveBeenCalledTimes(0);
    });

    it("handleTempPress allows multiple key presses", () => {
        const ev = makeTempEvent("4", "");
        const ev2 = makeTempEvent("3", "4");
        expect(ev.preventDefault).toHaveBeenCalledTimes(0);
        expect(ev2.preventDefault).toHaveBeenCalledTimes(0);
    });

    it("handleTempPress blocks double decimal point", () => {
        const prevent = vi.fn();
        const ev = makeTempEvent(".", ".");
        Object.assign(ev, { preventDefault: prevent });
        wrapper.vm.handleTempPress(ev);
        expect(prevent).toHaveBeenCalled();
    });

    it("handleTempPress blocks second decimal point", () => {
        const prevent = vi.fn();
        const ev = makeTempEvent(".", "1.2");
        Object.assign(ev, { preventDefault: prevent });
        wrapper.vm.handleTempPress(ev);
        expect(prevent).toHaveBeenCalled();
    });

    it("handleTempPress sets prior dot when decimal point typed", () => {
        const prevent = vi.fn();
        const ev = makeTempEvent(".", "1");
        Object.assign(ev, { preventDefault: prevent });
        wrapper.vm.handleTempPress(ev);
        expect(wrapper.vm.priorDot).toBe(true)
    });

     it("handleTempPress sets prior dot to false if backspace typed", () => {
        const prevent = vi.fn();
        const ev = makeTempEvent(".", "1");
        Object.assign(ev, { preventDefault: prevent });
        wrapper.vm.handleTempPress(ev);
        expect(wrapper.vm.priorDot).toBe(true)

        const ev2 = makeTempEvent("Backspace", "1.");
        Object.assign(ev2, { preventDefault: prevent });
        wrapper.vm.handleTempPress(ev2);
        expect(wrapper.vm.priorDot).toBe(false);
    });

    it("handleTempPress blocks minus sign", () => {
        const prevent = vi.fn();
        const ev = makeTempEvent("-", "");
        Object.assign(ev, { preventDefault: prevent });
        wrapper.vm.handleTempPress(ev);
        expect(prevent).toHaveBeenCalled();
    });
});
