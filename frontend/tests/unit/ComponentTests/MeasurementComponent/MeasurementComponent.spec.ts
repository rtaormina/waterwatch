import { flushPromises, mount, VueWrapper } from "@vue/test-utils";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
const fakeFetch = vi.fn();
vi.stubGlobal("fetch", fakeFetch);
vi.mock("@vuepic/vue-datepicker", () => ({
    default: {
        name: "VueDatePicker",
        template: '<input data-testid="vue-datepicker" />',
        props: ["modelValue", "enableTimePicker", "timePickerInline", "maxDate", "placeholder", "dark"],
        emits: ["update:modelValue"],
    },
}));
vi.mock("./Measurement/MeasurementBlock.vue", () => ({
    default: {
        name: "MeasurementBlock",
        template: `
            <div>
                <slot></slot>
            </div>
        `,
    },
}));
vi.mock("@vuepic/vue-datepicker/dist/main.css", () => ({}));
import MeasurementComponent from "../../../../src/components/MeasurementComponent.vue";
import { ref } from "vue";
import { DateTime } from "luxon";
import * as L from "leaflet";
import VueDatePicker from "@vuepic/vue-datepicker";


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
                    VueDatePicker: {
                        template: '<input data-testid="vue-datepicker" />',
                        props: ["modelValue", "enableTimePicker", "timePickerInline", "maxDate", "placeholder", "dark"],
                        emits: ["update:modelValue"],
                    },
                },
            },
        });
        wrapper.vm.data = {
            location: L.latLng(0, 0),
            waterSource: "network",
            temperature: {
                sensor: "analog thermomether",
                value: 20,
                unit: "C",
                time_waited: {
                    minutes: 10,
                    seconds: 5,
                },
            },
            selectedMetrics: ["temperature"],
        };
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
            water_source: "network",
            temperature: {
                sensor: "analog thermomether",
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
        const initialData = {
            location: L.latLng(0, 0),
            waterSource: undefined,
            temperature: {
                sensor: undefined,
                value: undefined,
                unit: "C",
                time_waited: {
                    minutes: undefined,
                    seconds: undefined,
                },
            },
            selectedMetrics: ["temperature"],
            time: {
                localDate: undefined,
                localTime: undefined,
            },
        };
        wrapper.vm.defaultData = initialData;
        wrapper.vm.clear();

        expect(wrapper.vm.data.location).toEqual(initialData.location);
        expect(wrapper.vm.data.waterSource).toEqual(initialData.waterSource);
        expect(wrapper.vm.data.temperature).toEqual(initialData.temperature);
        expect(wrapper.vm.data.selectedMetrics).toEqual(initialData.selectedMetrics);
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
        wrapper.vm.TemperatureMetricComponent = ref({
            verify: vi.fn(() => true),
        });
        pushMock.mockReset();
        fakeFetch.mockReset();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks;
    });

    it("shows modal with temperature in Celsius", () => {
        wrapper.vm.data = {
            location: L.latLng(0, 0),
            waterSource: undefined,
            temperature: {
                sensor: undefined,
                value: 25,
                unit: "C",
                time_waited: {
                    minutes: undefined,
                    seconds: undefined,
                },
            },
            selectedMetrics: ["temperature"],
        };
        wrapper.vm.selectedMetrics = ["temperature"];
        wrapper.vm.postDataCheck();
        expect(wrapper.vm.showModal).toBe(true);
        expect(wrapper.vm.modalMessage).toBe("Are you sure you would like to submit this measurement?");
    });

    it("shows modal with temperature in Fahrenheit", () => {
        wrapper.vm.data = {
            location: L.latLng(0, 0),
            waterSource: undefined,
            temperature: {
                sensor: undefined,
                value: 25,
                unit: "C",
                time_waited: {
                    minutes: undefined,
                    seconds: undefined,
                },
            },
            selectedMetrics: ["temperature"],
        };
        wrapper.vm.selectedMetrics = ["temperature"];
        wrapper.vm.postDataCheck();
        expect(wrapper.vm.showModal).toBe(true);
        expect(wrapper.vm.modalMessage).toBe("Are you sure you would like to submit this measurement?");
    });

    it("shows modal with temperature out of range in Celsius", () => {
        wrapper.vm.data = {
            location: L.latLng(0, 0),
            waterSource: undefined,
            temperature: {
                sensor: undefined,
                value: 50,
                unit: "C",
                time_waited: {
                    minutes: undefined,
                    seconds: undefined,
                },
            },
            selectedMetrics: ["temperature"],
        };
        wrapper.vm.selectedMetrics = ["temperature"];
        wrapper.vm.postDataCheck();
        expect(wrapper.vm.showModal).toBe(true);
        expect(wrapper.vm.modalMessage).toBe("Are you sure you would like to submit the temperature value 50°C?");
    });

    it("shows modal with temperature out of range in Fahrenheit", () => {
        wrapper.vm.data = {
            location: L.latLng(0, 0),
            waterSource: undefined,
            temperature: {
                sensor: undefined,
                value: 120,
                unit: "F",
                time_waited: {
                    minutes: undefined,
                    seconds: undefined,
                },
            },
            selectedMetrics: ["temperature"],
        };
        wrapper.vm.selectedMetrics = ["temperature"];
        wrapper.vm.postDataCheck();
        expect(wrapper.vm.showModal).toBe(true);
        expect(wrapper.vm.modalMessage).toBe("Are you sure you would like to submit the temperature value 120°F?");
    });
});
