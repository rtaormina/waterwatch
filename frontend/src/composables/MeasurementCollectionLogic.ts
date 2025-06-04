import { DateTime } from "luxon";
import { toValue, type MaybeRefOrGetter } from "vue";

export type TemperatureSensor =
    | "analog thermomether"
    | "digital thermomether"
    | "infrared thermomether"
    | "thermocouple"
    | "thermistor"
    | "bimetallic thermomether"
    | "other";

export type TemperatureUnit = "C" | "F";
export type Temperature = {
    sensor?: TemperatureSensor;
    time_waited: Duration;
    value?: number;
    unit: TemperatureUnit;
};

/**
 * Converts a temperature value to Celsius, rounding to one decimal place.
 *
 * If the temperature is already in Celsius ("C"), it returns the value rounded to one decimal.
 * If the temperature is in Fahrenheit ("F"), it converts it to Celsius and rounds to one decimal.
 * If the unit is unrecognized, returns `undefined`.
 *
 * @param temperature - An object containing the temperature value and its unit ("C" or "F").
 * @returns The temperature in Celsius rounded to one decimal place, or `undefined` if the unit is not supported.
 */
export function getTemperatureInCelsius(temperature: Temperature): number | undefined {
    if (temperature.unit === "C") {
        return Math.round((temperature.value ?? 0) * 10) / 10;
    } else if (temperature.unit === "F") {
        return Math.round(((temperature.value ?? 0) - 32) * (5 / 9) * 10) / 10;
    }
    return undefined;
}

export type Duration = {
    minutes?: number;
    seconds?: number;
};

export type LabelValuePairs<ValueType> = { label: string; value: ValueType };
export type SensorOptions = LabelValuePairs<TemperatureSensor>[];
export type WaterSourceOptions = LabelValuePairs<WaterSource>[];
export type MetricOptions = LabelValuePairs<Metric>[];

export type Metric = "temperature" | never;

export type WaterSource = "network" | "rooftop tank" | "well" | "other";
export type MeasurementData = {
    location: L.LatLng;
    waterSource?: WaterSource;
    temperature: Temperature;
    selectedMetrics: Metric[];
};

/**
 * Validates the temperature range based on the selected temperature unit.
 *
 * @param {string} val - the current value of the temperature input
 * @param {string} tempUnit - the selected temperature unit ("C" for Celsius or "F" for Fahrenheit)
 * @returns {boolean} true if the value is within the valid range, false otherwise
 */
export function validateTempRange(val: string, tempUnit: string) {
    if (tempUnit === "C") {
        if (Number(val) < 0 || Number(val) > 100) {
            return false;
        }
    } else if (tempUnit === "F") {
        if (Number(val) < 32 || Number(val) > 212) {
            console.log(val);
            return false;
        }
    }
    return true;
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
 * @param {string} tempUnit - The unit of temperature measurement ("C" for Celsius or "F" for Fahrenheit).
 * @returns {boolean} `true` if all required inputs are valid; otherwise, `false`.
 */
export function validateInputs(data: {
    longitude: number | undefined;
    latitude: number | undefined;
    waterSource: string;
    sensor: string;
    tempVal: string;
    selectedMetrics: string[];
    errors: {
        temp: string | null;
        sensor: string | null;
        mins: string | null;
        sec: string | null;
    };
    time: {
        mins: string;
        sec: string;
    };
    tempUnit: string;
}) {
    if (
        data.longitude === undefined ||
        data.latitude === undefined ||
        data.waterSource === "" ||
        data.selectedMetrics.length === 0
    ) {
        return false;
    }
    if (data.selectedMetrics.includes("temperature")) {
        if (
            data.sensor === "" ||
            data.tempVal === "" ||
            isNaN(Number(data.tempVal)) ||
            data.errors.temp !== null ||
            data.errors.sensor !== null ||
            data.errors.sec != null ||
            data.errors.mins != null ||
            ((data.time.mins === "" || +data.time.mins === 0) && (data.time.sec === "" || +data.time.sec === 0)) ||
            +data.time.mins < 0 ||
            +data.time.sec < 0 ||
            !validateTempRange(data.tempVal, data.tempUnit)
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
export function createPayload(data: MaybeRefOrGetter<MeasurementData>, selectedMetrics: MaybeRefOrGetter<Metric[]>) {
    const measurementData = toValue(data);
    const temperature = toValue(selectedMetrics).includes("temperature")
        ? {
              sensor: measurementData.temperature.sensor,
              value: getTemperatureInCelsius(measurementData.temperature),
              time_waited: `00:${String(measurementData.temperature.time_waited.seconds ?? 0).padStart(2, "0")}:${String(measurementData.temperature.time_waited.minutes ?? 0).padStart(2, "0")}`,
          }
        : undefined;
    const longitudeRounded = Number(measurementData.location.lng.toFixed(3));
    const latitudeRounded = Number(measurementData.location.lat.toFixed(3));
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
        water_source: measurementData.waterSource,
        temperature: temperature,
    };
}
