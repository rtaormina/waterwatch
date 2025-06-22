import {
    validateInputs,
    validateTempRange,
    onSensorInput,
    createPayload,
} from "../../../src/composables/MeasurementCollectionLogic.ts";
import { beforeAll, afterAll, vi, describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import * as L from "leaflet";

describe("validateTemp Tests", () => {
    it("accepts valid temp value", async () => {
        expect(validateTempRange("0", "C")).toBe(true);
        expect(validateTempRange("100", "C")).toBe(true);
        expect(validateTempRange("101", "C")).toBe(false);
        expect(validateTempRange("32", "F")).toBe(true);
        expect(validateTempRange("212", "F")).toBe(true);
        expect(validateTempRange("213", "F")).toBe(false);
    });
});

describe("onSensorInput Tests", () => {
    it("onSensorInput should set sensor error to null if sensor is not empty", () => {
        const errors = {
            mins: null,
            sec: null,
            temp: null,
            sensor: "Sensor error",
        };
        onSensorInput("sensor", errors);
        expect(errors.sensor).toBe(null);
    });
    it("onSensorInput should set sensor error if sensor is empty", () => {
        const errors = {
            mins: null,
            sec: null,
            temp: null,
            sensor: null,
        };
        onSensorInput("", errors);
        expect(errors.sensor).toBe("Sensor type is required");
    });
});

describe("createPayload Tests", () => {
    beforeAll(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2025-01-01T12:00:00Z"));
    });

    afterAll(() => {
        vi.useRealTimers();
    });
    it("creates correct celsius payload", () => {
        vi.spyOn(DateTime, "local").mockImplementation(
            () => DateTime.fromISO("2025-01-01T12:00:00.000-00:00").setZone("America/New_York") as DateTime<true>,
        );
        expect(
            createPayload(
                {
                    location: L.latLng(110, 100),
                    temperature: {
                        sensor: "digital thermometer",
                        value: 15.5,
                        unit: "C",
                        time_waited: { minutes: 1, seconds: 15 },
                    },
                    waterSource: "well",
                    selectedMetrics: ["temperature"],
                    time: {
                        localDate: "2025-01-01",
                        localTime: "08:00:00",
                    },
                },
                ["temperature"],
            ),
        ).toStrictEqual({
            timestamp: "2025-01-01T12:00:00.000Z",
            local_date: "2025-01-01",
            local_time: "08:00:00",
            location: {
                type: "Point",
                coordinates: [100, 110],
            },
            water_source: "well",
            temperature: {
                sensor: "digital thermometer",
                value: 15.5,
                time_waited: "00:01:15",
            },
        });
    });
    it("rounds location to 3 decimals", () => {
        vi.spyOn(DateTime, "local").mockImplementation(
            () => DateTime.fromISO("2025-01-01T13:00:00.000-00:00").setZone("America/New_York") as DateTime<true>,
        );
        expect(
            createPayload(
                {
                    location: L.latLng(110.23491, 100.3423),
                    temperature: {
                        sensor: "digital thermometer",
                        value: 15.5,
                        unit: "C",
                        time_waited: { minutes: 1, seconds: 15 },
                    },
                    waterSource: "well",
                    selectedMetrics: ["temperature"],
                    time: {
                        localDate: "2025-01-01",
                        localTime: "08:00:00",
                    },
                },
                ["temperature"],
            ),
        ).toStrictEqual({
            timestamp: "2025-01-01T12:00:00.000Z",
            local_date: "2025-01-01",
            local_time: "08:00:00",
            location: {
                type: "Point",
                coordinates: [100.342, 110.235],
            },
            water_source: "well",
            temperature: {
                sensor: "digital thermometer",
                value: 15.5,
                time_waited: "00:01:15",
            }
        });
    });
    it("creates correct fahrenheit payload", () => {
        vi.spyOn(DateTime, "local").mockImplementation(
            () => DateTime.fromISO("2025-01-01T13:00:00.000-00:00").setZone("America/New_York") as DateTime<true>,
        );
        expect(
            createPayload(
                {
                    location: L.latLng(110, 100),
                    waterSource: "well",
                    temperature: {
                        sensor: "digital thermometer",
                        value: 48,
                        unit: "F",
                        time_waited: { minutes: 1, seconds: 15 },
                    },
                    selectedMetrics: ["temperature"],
                    time: {
                        localDate: "2025-01-01",
                        localTime: "08:00:00",
                    },
                },
                ["temperature"],
            ),
        ).toStrictEqual({
            timestamp: "2025-01-01T12:00:00.000Z",
            local_date: "2025-01-01",
            local_time: "08:00:00",
            location: {
                type: "Point",
                coordinates: [100, 110],
            },
            water_source: "well",
            temperature: {
                sensor: "digital thermometer",
                value: 8.9,
                time_waited: "00:01:15",
            },
        });
    });
    it("pads minutes and seconds", () => {
        vi.spyOn(DateTime, "local").mockImplementation(
            () => DateTime.fromISO("2025-01-01T13:00:00.000-00:00").setZone("America/New_York") as DateTime<true>,
        );
        expect(
            createPayload(
                {
                    location: L.latLng(110, 100),
                    waterSource: "well",
                    temperature: {
                        sensor: "digital thermometer",
                        value: 48,
                        unit: "F",
                        time_waited: { minutes: 1, seconds: 5 },
                    },
                    selectedMetrics: ["temperature"],
                    time: {
                        localDate: "2025-01-01",
                        localTime: "08:00:00",
                    },
                },
                ["temperature"],
            ),
        ).toStrictEqual({
            timestamp: "2025-01-01T12:00:00.000Z",
            local_date: "2025-01-01",
            local_time: "08:00:00",
            location: {
                type: "Point",
                coordinates: [100, 110],
            },
            water_source: "well",
            temperature: {
                sensor: "digital thermometer",
                value: 8.9,
                time_waited: "00:01:05",
            }
        });
    });
});

describe("validateInputs Tests", () => {
    it("returns false if longitude or latitude is undefined", () => {
        const errors = {
            mins: null,
            sec: null,
            temp: null,
            sensor: null,
        };
        const time = {
            mins: "0",
            sec: "1",
        };
        const result = validateInputs(undefined, 10, "well", "sensor", "20", ["temperature"], errors, time, "C");
        expect(result).toBe(false);
    });
    it("returns false if water source is empty", () => {
        const errors = {
            mins: null,
            sec: null,
            temp: null,
            sensor: null,
        };
        const time = {
            mins: "0",
            sec: "1",
        };
        const result = validateInputs(10, 10, "", "sensor", "20", ["temperature"], errors, time, "C");
        expect(result).toBe(false);
    });
    it("returns false if sensor is empty", () => {
        const errors = {
            mins: null,
            sec: null,
            temp: null,
            sensor: null,
        };
        const time = {
            mins: "0",
            sec: "1",
        };
        const result = validateInputs(10, 10, "well", "", "20", ["temperature"], errors, time, "C");
        expect(result).toBe(false);
    });
    it("returns false if tempVal is empty", () => {
        const errors = {
            mins: null,
            sec: null,
            temp: null,
            sensor: null,
        };
        const time = {
            mins: "0",
            sec: "1",
        };
        const result = validateInputs(10, 10, "well", "sensor", "", ["temperature"], errors, time, "C");
        expect(result).toBe(false);
    });
    it("returns false if there are errors - temp", () => {
        const errors = {
            mins: null,
            sec: null,
            temp: "error",
            sensor: null,
        };
        const time = {
            mins: "0",
            sec: "1",
        };
        const result = validateInputs(10, 10, "well", "sensor", "20", ["temperature"], errors, time, "C");
        expect(result).toBe(false);
    });
    it("returns false if there are errors - sensor", () => {
        const errors = {
            mins: null,
            sec: null,
            temp: null,
            sensor: "error",
        };
        const time = {
            mins: "0",
            sec: "1",
        };
        const result = validateInputs(10, 10, "well", "sensor", "20", ["temperature"], errors, time, "C");
        expect(result).toBe(false);
    });
    it("returns false if zero time", () => {
        const errors = {
            mins: null,
            sec: null,
            temp: null,
            sensor: "error",
        };
        const time = {
            mins: "0",
            sec: "",
        };
        const result = validateInputs(10, 10, "well", "sensor", "20", ["temperature"], errors, time, "C");
        expect(result).toBe(false);
    });
    it("returns false if zero time empty fields", () => {
        const errors = {
            mins: null,
            sec: null,
            temp: null,
            sensor: "error",
        };
        const time = {
            mins: "",
            sec: "",
        };
        const result = validateInputs(10, 10, "well", "sensor", "20", ["temperature"], errors, time, "C");
        expect(result).toBe(false);
    });
});
