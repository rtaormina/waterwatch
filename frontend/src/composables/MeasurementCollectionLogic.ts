import { nextTick, type Ref } from "vue";

export function validateTemp(
  val: string,
  errors: {
    temp: string | null;
    sensor: string | null;
  },
  tempRef: Ref<HTMLInputElement | undefined>
) {
  if (!/^-?\d+(\.\d+)?$/.test(val)) {
    errors.temp = "Enter a number";
    nextTick(() => tempRef?.value?.focus());
  } else if (Number(val) > 100) {
    errors.temp = "Temperature too large";
    nextTick(() => tempRef?.value?.focus());
  } else {
    errors.temp = null;
  }
}

export function onSensorInput(
  sensor: string,
  errors: {
    temp: string | null;
    sensor: string | null;
  }
) {
  if (sensor === "") {
    errors.sensor = "Sensor type is required";
  } else {
    errors.sensor = null;
  }
}

export function validateTime(
  errors: {
    temp: string | null;
    sensor: string | null;
    mins: string | null;
    sec: string | null;
  },
  time: {
    mins: string;
    sec: string;
  }
) {
  console.log("called");
  if (+time.mins > 59 || +time.mins < 0) {
    errors.mins = "Time must be between 0 and 59";
    console.log("mins error");
  } else {
    errors.mins = null;
  }
  if (+time.sec > 59 && +time.sec < 0) {
    errors.sec = "Time must be between 0 and 59";
    console.log("sec error");
  } else {
    errors.sec = null;
  }
}

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
  }
) {
  if (
    longitude === undefined ||
    latitude === undefined ||
    waterSource === "" ||
    selectedMetrics.length === 0
  ) {
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
      ((time.mins === "" || time.mins === "0") &&
        (time.sec === "" || time.sec === "0")) ||
      +time.mins < 0 ||
      +time.sec < 0
    ) {
      return false;
    }
  }

  return true;
}

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
  latitude: number | undefined
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

  return {
    location: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
    water_source: waterSource,
    temperature: temperature,
  };
}
