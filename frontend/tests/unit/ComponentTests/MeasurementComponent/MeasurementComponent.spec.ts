import { flushPromises, mount, VueWrapper } from "@vue/test-utils";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
const fakeFetch = vi.fn();
vi.stubGlobal("fetch", fakeFetch);
import MeasurementComponent from "../../../../src/components/MeasurementComponent.vue";
import { ref } from "vue";
import { DateTime } from "luxon";

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

/**
 * Test for posting data in MeasurementComponent
 * This test suite checks the functionality of the postData method in the MeasurementComponent.
 */
describe("postData", () => {
    let wrapper;

    beforeEach(() => {
        wrapper = mount(MeasurementComponent, {
            global: {
                stubs: {
                    LocationFallback: {
                        template: '<div data-testid="stub-map"></div>',
                    },
                },
            },
        });
        wrapper.vm.tempUnit = "C";
        wrapper.vm.selectedMetrics = ["temperature"];
        wrapper.vm.formData.water_source = "river";
        wrapper.vm.formData.temperature.sensor = "analog";
        wrapper.vm.formData.temperature.value = 2.0;
        wrapper.vm.formData.temperature.time_waited = "00:01:15";
        wrapper.vm.formData.location = {
            type: "Point",
            coordinates: [0, 0],
        };
        wrapper.vm.tempVal = "20";
        wrapper.vm.time.mins = "10";
        wrapper.vm.time.sec = "05";
        wrapper.vm.userLoc = { lng: 0, lat: 0 };
        wrapper.vm.showModal = ref(false);
        wrapper.vm.cookies = { get: () => "test-token" };
    });

    afterEach(() => {
        vi.resetAllMocks();
        vi.useRealTimers();
    });

    it("logs an error and does not navigate when status is not 201", async () => {
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        vi.useFakeTimers();
        vi.setSystemTime(new Date("2025-01-01T12:00:00Z"));

        global.fetch = vi.fn(() =>
            Promise.resolve(
                new Response(JSON.stringify({ error: "boom" }), {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                }),
            ),
        );

        await wrapper.vm.$forceUpdate();

        await wrapper.vm.postData();
        await flushPromises();

        expect(errorSpy).toHaveBeenCalledWith("error with adding measurement");
        expect(wrapper.vm.router.push).not.toHaveBeenCalled();

        errorSpy.mockRestore();
    });

    it("should send form data successfully", async () => {
        vi.spyOn(DateTime, "local").mockImplementation(
            () => DateTime.fromISO("2025-01-01T12:00:00.000-00:00").setZone("America/New_York") as DateTime<true>,
        );

        await wrapper.vm.$forceUpdate();
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2025-01-01T12:00:00Z"));
        global.fetch = vi.fn(() =>
            Promise.resolve(
                new Response(JSON.stringify({ success: true }), {
                    status: 201,
                    headers: { "Content-Type": "application/json" },
                }),
            ),
        );

        await wrapper.vm.postData();
        await flushPromises();

        expect(fetch).toHaveBeenCalledWith(
            "/api/measurements/",
            expect.objectContaining({
                method: "POST",
                headers: expect.objectContaining({
                    "Content-Type": "application/json",
                }),
            }),
        );
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(wrapper.vm.router.push).toHaveBeenCalled();
        const fetchCall = (global.fetch as any).mock.calls[0];
        const requestBody = JSON.parse(fetchCall[1].body);
        const [url, opts] = (global.fetch as any).mock.calls[0];
        expect(url).toBe("/api/measurements/");
        expect(opts.method).toBe("POST");
        expect(requestBody).toEqual({
            timestamp: expect.any(String),
            local_date: "2025-01-01",
            local_time: "07:00:00",
            location: {
                type: "Point",
                coordinates: [0, 0],
            },
            water_source: "river",
            temperature: {
                sensor: "analog",
                value: 20,
                time_waited: "00:10:05",
            },
        });
    });
});

/**
 * Test for MeasurementComponent clear method
 * This test suite checks the functionality of the clear method in the MeasurementComponent.
 */
describe("MeasurementComponent.vue clear/post", () => {
    let wrapper: VueWrapper<any>;

    beforeEach(() => {
        wrapper = mount(MeasurementComponent, {
            global: {
                stubs: {
                    LocationFallback: {
                        template: '<div data-testid="stub-map"></div>',
                    },
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

    it("clear() should reset all fields to their initial state", async () => {
        wrapper.vm.formData.water_source = "well";
        wrapper.vm.tempVal = "25";
        wrapper.vm.time.mins = "10";
        wrapper.vm.selectedMetrics = ["temperature"];
        wrapper.vm.tempUnit = "F";

        wrapper.vm.clear();

        expect(wrapper.vm.formData.water_source).toBe("");
        expect(wrapper.vm.tempVal).toBe("");
        expect(wrapper.vm.time.mins).toBe("");
        expect(wrapper.vm.selectedMetrics).toEqual([]);
        expect(wrapper.vm.tempUnit).toBe("C");
    });
});

/**
 * Test for MeasurementComponent.vue time handlers
 * This test suite checks the functionality of the time input handlers in the MeasurementComponent.
 */
describe("MeasurementComponent.vue time handlers", () => {
    let wrapper: VueWrapper<any>;

    beforeEach(() => {
        wrapper = mount(MeasurementComponent, {
            global: {
                stubs: {
                    LocationFallback: {
                        template: '<div data-testid="stub-map"></div>',
                    },
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

    it("handleKeyPress emits update:modelValue for valid digit", () => {
        const ev = makeKeyboardEvent("7", "1");
        wrapper.vm.handleKeyPress(ev);
        expect(wrapper.emitted("update:modelValue")).toBeTruthy();
        const emissions = wrapper.emitted("update:modelValue");
        expect(emissions && emissions.length).toBe(1);
        expect(emissions && emissions[0][0]).toBe("17");
    });

    it("handleKeyPress emits for multiple key presses", () => {
        const ev = makeKeyboardEvent("2", "");
        wrapper.vm.handleKeyPress(ev);
        const ev2 = makeKeyboardEvent("3", "2");
        wrapper.vm.handleKeyPress(ev2);
        expect(wrapper.emitted("update:modelValue")).toBeTruthy();
        const emissions = wrapper.emitted("update:modelValue");
        expect(emissions && emissions.length).toBe(2);
        expect(emissions && emissions[0][0]).toBe("2");
        expect(emissions && emissions[1][0]).toBe("23");
    });

    it("handleKeyPress blocks out of range digit", () => {
        const ev = makeKeyboardEvent("2", "6");
        wrapper.vm.handleKeyPress(ev);
        expect(wrapper.emitted("update:modelValue")).toBeFalsy();
        const emissions = wrapper.emitted("update:modelValue");
        expect(emissions).toBeFalsy();
    });

    it("handleKeyPress blocks negative", () => {
        const ev = makeKeyboardEvent(".", "-");
        wrapper.vm.handleKeyPress(ev);
        expect(wrapper.emitted("update:modelValue")).toBeFalsy();
        const emissions = wrapper.emitted("update:modelValue");
        expect(emissions).toBeFalsy();
    });

    it("handleKeyPress blocks non-digits", () => {
        const ev = makeKeyboardEvent("a", "1");
        wrapper.vm.handleKeyPress(ev);
        expect(wrapper.emitted("update:modelValue")).toBeFalsy();
        const emissions = wrapper.emitted("update:modelValue");
        expect(emissions).toBeFalsy();
    });

    it("handlePaste emits for valid paste", () => {
        const ev = {
            clipboardData: { getData: () => "42" },
            preventDefault: vi.fn(),
        } as unknown as ClipboardEvent;
        wrapper.vm.handlePaste(ev);
        expect(wrapper.emitted("update:modelValue")).toBeTruthy();
        const emissions = wrapper.emitted("update:modelValue");
        expect(emissions && emissions.length).toBe(1);
        expect(emissions && emissions[0][0]).toBe("42");
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
        wrapper.vm.handleInput(ev);
        expect(wrapper.emitted("update:modelValue")).toBeTruthy();
        const emissions = wrapper.emitted("update:modelValue");
        expect(emissions && emissions.length).toBe(1);
        expect(emissions && emissions[0][0]).toBe("58");
    });

    it("handleInput blocks invalid input", () => {
        const prevent = vi.fn();
        const ev = { target: { value: "60" }, preventDefault: prevent } as unknown as Event;
        wrapper.vm.handleInput(ev);
        expect(prevent).toHaveBeenCalled();
    });
});

/**
 * Test for MeasurementComponent.vue temperature handler
 * This test suite checks the functionality of the temperature input handlers in the MeasurementComponent.
 */
describe("MeasurementComponent.vue temperature handler", () => {
    let wrapper: VueWrapper<any>;

    beforeEach(() => {
        wrapper = mount(MeasurementComponent, {
            global: {
                stubs: {
                    LocationFallback: {
                        template: '<div data-testid="stub-map"></div>',
                    },
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

    function makeTempEvent(key: string, value: string) {
        return {
            key,
            target: { value, replace: String.prototype.replace },
        } as unknown as KeyboardEvent;
    }

    it("handleTempPress allows digit within 0-212", () => {
        const ev = makeTempEvent("1", "20");
        wrapper.vm.handleTempPress(ev);
        expect(wrapper.emitted("update:modelValue")).toBeTruthy();
        const emissions = wrapper.emitted("update:modelValue");
        expect(emissions && emissions.length).toBe(1);
        expect(emissions && emissions[0][0]).toBe("201");
    });

    it("handleTempPress allows multiple key presses", () => {
        const ev = makeTempEvent("4", "");
        wrapper.vm.handleTempPress(ev);
        const ev2 = makeTempEvent("3", "4");
        wrapper.vm.handleTempPress(ev2);
        expect(wrapper.emitted("update:modelValue")).toBeTruthy();
        const emissions = wrapper.emitted("update:modelValue");
        expect(emissions && emissions.length).toBe(2);
        expect(emissions && emissions[0][0]).toBe("4");
        expect(emissions && emissions[1][0]).toBe("43");
    });

    it("handleTempPress blocks beyond 212", () => {
        const prevent = vi.fn();
        const ev = makeTempEvent("3", "71");
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

    it("handleTempPress blocks minus sign", () => {
        const prevent = vi.fn();
        const ev = makeTempEvent("-", "");
        Object.assign(ev, { preventDefault: prevent });
        wrapper.vm.handleTempPress(ev);
        expect(prevent).toHaveBeenCalled();
    });
});

/**
 * Test for MeasurementComponent.vue postDataCheck
 * This test suite checks the functionality of the postDataCheck method in the MeasurementComponent.
 */
describe("MeasurementComponent.vue postDataCheck", () => {
    let wrapper: VueWrapper<any>;

    beforeEach(() => {
        wrapper = mount(MeasurementComponent, {
            global: {
                stubs: {
                    LocationFallback: {
                        template: '<div data-testid="stub-map"></div>',
                    },
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

    it("shows modal without temperature included", () => {
        wrapper.vm.postDataCheck();
        expect(wrapper.vm.showModal).toBe(true);
        expect(wrapper.vm.modalMessage).toBe("Are you sure you would like to submit this measurement?");
    });

    it("shows modal with temperature in Celsius", () => {
        wrapper.vm.tempUnit = "C";
        wrapper.vm.tempVal = "25";
        wrapper.vm.selectedMetrics = ["temperature"];
        wrapper.vm.postDataCheck();
        expect(wrapper.vm.showModal).toBe(true);
        expect(wrapper.vm.modalMessage).toBe("Are you sure you would like to submit this measurement?");
    });

    it("shows modal with temperature in Fahrenheit", () => {
        wrapper.vm.tempUnit = "F";
        wrapper.vm.tempVal = "77";
        wrapper.vm.selectedMetrics = ["temperature"];
        wrapper.vm.postDataCheck();
        expect(wrapper.vm.showModal).toBe(true);
        expect(wrapper.vm.modalMessage).toBe("Are you sure you would like to submit this measurement?");
    });

    it("shows modal with temperature out of range in Celsius", () => {
        wrapper.vm.tempUnit = "C";
        wrapper.vm.tempVal = "50";
        wrapper.vm.selectedMetrics = ["temperature"];
        wrapper.vm.postDataCheck();
        expect(wrapper.vm.showModal).toBe(true);
        expect(wrapper.vm.modalMessage).toBe("Are you sure you would like to submit the temperature value 50°C?");
    });

    it("shows modal with temperature out of range in Fahrenheit", () => {
        wrapper.vm.tempUnit = "F";
        wrapper.vm.tempVal = "120";
        wrapper.vm.selectedMetrics = ["temperature"];
        wrapper.vm.postDataCheck();
        expect(wrapper.vm.showModal).toBe(true);
        expect(wrapper.vm.modalMessage).toBe("Are you sure you would like to submit the temperature value 120°F?");
    });
});
