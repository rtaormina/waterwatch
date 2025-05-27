import { nextTick, type Ref } from "vue";
import { DateTime } from "luxon";

/**
 * Validates if the input in the temperature field is a number, and not too large.
 *
 * @param {string} val - the current value of the temperature input
 * @param {string | null} errors - the current error state of the temperature input
 * @param {Ref<HTMLInputElement | undefined>} tempRef - the reference to the input element
 */
export function validateTemp(
    val: string,
    errors: {
        temp: string | null;
        sensor: string | null;
    },
    tempRef: Ref<HTMLInputElement | undefined>,
) {
    if (!/^-?\d+(\.\d+)?$/.test(val)) {
        errors.temp = "Enter a number";
        nextTick(() => tempRef?.value?.focus());
    } else if (Number(val) > 500) {
        errors.temp = "Temperature too large";
        nextTick(() => tempRef?.value?.focus());
    } else {
        errors.temp = null;
    }
}

/**
 * Validates if the input in the sensor field is not empty.
 *
 * @param {string} sensor - the current value of the sensor input
 * @param {string | null} errors - the current error state of the sensor input
 */
export function onSensorInput(
    sensor: string,
    errors: {
        temp: string | null;
        sensor: string | null;
    },
) {
    if (sensor === "") {
        errors.sensor = "Sensor type is required";
    } else {
        errors.sensor = null;
    }
}

/**
 * Validates the input values required for a measurement collection operation.
 *
 * @param {number | undefined} longitude - The longitude value, or `undefined` if not provided.
 * @param {number | undefined} latitude - The latitude value, or `undefined` if not provided.
 * @param {string} waterSource - The name or identifier of the water source.
 * @param {string} sensor - The sensor identifier or name.
 * @param {string} tempVal - The temperature value as a string.
 * @param {string[]} selectedMetrics - An array of selected metric names.
 * @param {{ temp: string | null; sensor: string | null; mins: string | null; sec: string | null }} errors - An object containing possible error messages for temperature, sensor, minutes, and seconds.
 * @param {{ mins: string; sec: string }} time - An object containing the minutes and seconds as strings.
 * @returns {boolean} `true` if all required inputs are valid; otherwise, `false`.
 */
export function validateInputs(
    longitude: number | undefined,
    latitude: number | undefined,
    waterSource: string,
    sensor: string,
    tempVal: string,
    selectedMetrics: string[],
    errors: {
        temp: string | null;
        sensor: string | null;
        mins: string | null;
        sec: string | null;
    },
    time: {
        mins: string;
        sec: string;
    },
) {
    if (longitude === undefined || latitude === undefined || waterSource === "" || selectedMetrics.length === 0) {
        return false;
    }
    if (selectedMetrics.includes("temperature")) {
        if (
            sensor === "" ||
            tempVal === "" ||
            isNaN(Number(tempVal)) ||
            errors.temp !== null ||
            errors.sensor !== null ||
            errors.sec != null ||
            errors.mins != null ||
            ((time.mins === "" || +time.mins === 0) && (time.sec === "" || +time.sec === 0)) ||
            +time.mins < 0 ||
            +time.sec < 0
        ) {
            return false;
        }
    }

    return true;
}

/**
 * Creates a payload object for measurement collection.
 *
 * @param {string} tempUnit - The unit of temperature measurement ("C" for Celsius or "F" for Fahrenheit).
 * @param {string[]} selectedMetrics - An array of selected metric names to include in the payload.
 * @param {{ sensor: string; value: number; time_waited: string }} temperature - An object containing temperature information
 * @param {string} tempVal - The raw temperature value as a string (to be parsed and converted).
 * @param {{ mins: string; sec: string }} time - An object containing the time waited for the measurement
 * @param {string} waterSource - The water source.
 * @param {number | undefined} longitude - The longitude coordinate
 * @param {number | undefined} latitude - The latitude coordinate
 * @returns {{ timestamp_local: string; location: { type: string; coordinates: [number | undefined, number | undefined] }; water_source: string; temperature: { sensor: string; value: number; time_waited: string } }} the payload
 */
export function createPayload(
    tempUnit: string,
    selectedMetrics: string[],
    temperature: {
        sensor: string;
        value: number;
        time_waited: string;
    },
    tempVal: string,
    time: {
        mins: string;
        sec: string;
    },
    waterSource: string,
    longitude: number | undefined,
    latitude: number | undefined,
) {
    if (selectedMetrics.includes("temperature")) {
        if (tempUnit === "F") {
            temperature.value = Math.round((+tempVal - 32) * (5 / 9) * 10) / 10;
        } else {
            temperature.value = Math.round(+tempVal * 10) / 10;
        }
        const mins = time.mins;
        const secs = time.sec;
        const mm = String(mins).padStart(2, "0");
        const ss = String(secs).padStart(2, "0");
        temperature.time_waited = `00:${mm}:${ss}`;
    }
    const longitudeRounded = longitude !== undefined ? Number(longitude.toFixed(3)) : undefined;
    const latitudeRounded = latitude !== undefined ? Number(latitude.toFixed(3)) : undefined;
    const localISO = DateTime.local().toISO();
    const local_date = localISO ? localISO.split("T")[0] : undefined;
    const local_time = localISO ? localISO.split("T")[1].split(".")[0] : undefined;
    return {
        timestamp: DateTime.utc().toISO(),
        local_date: local_date,
        local_time: local_time,
        location: {
            type: "Point",
            coordinates: [longitudeRounded, latitudeRounded],
        },
        water_source: waterSource,
        temperature: temperature,
    };
}
