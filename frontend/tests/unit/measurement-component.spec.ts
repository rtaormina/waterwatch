import {
  validateInputs,
  validateTemp,
  onSensorInput,
  createPayload,
} from "../../src/composables/MeasurementCollectionLogic.ts";
import { vi, describe, it, expect } from "vitest";
import { nextTick, ref, type Ref } from "vue";

describe("validateTemp Tests", () => {
  it("sets an error and focuses input if val is not a number", async () => {
    const errors = {
      mins: null,
      sec: null,
      temp: null,
      sensor: null,
    };

    const focusMock = vi.fn();
    const tempRef: Ref<HTMLInputElement | undefined> = ref(undefined);

    tempRef.value = {
      focus: focusMock,
    } as unknown as HTMLInputElement;

    validateTemp("abc", errors, tempRef);
    expect(errors.temp).toBe("Enter a number");
    await nextTick();
    expect(focusMock).toHaveBeenCalled();
  }),
    it("has no error if valid temp value pos", async () => {
      const errors = {
        mins: null,
        sec: null,
        temp: null,
        sensor: null,
      };

      const tempRef: Ref<HTMLInputElement | undefined> = ref(undefined);

      validateTemp("32", errors, tempRef);
      expect(errors.sec).toBe(null);
    }),
    it("has no error if valid temp value neg", async () => {
      const errors = {
        mins: null,
        sec: null,
        temp: null,
        sensor: null,
      };

      const tempRef: Ref<HTMLInputElement | undefined> = ref(undefined);

      validateTemp("-32", errors, tempRef);
      expect(errors.sec).toBe(null);
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
  }),
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
  it("creates correct celsius payload", () => {
    expect(
      createPayload(
        "C",
        ["temperature"],
        { sensor: "thermometer", value: 0, time_waited: "" },
        "15.5",
        { mins: "1", sec: "15" },
        "well",
        100,
        110
      )
    ).toStrictEqual({
      location: {
        type: "Point",
        coordinates: [100, 110],
      },
      waterSource: "well",
      temperature: {
        sensor: "thermometer",
        value: 15.5,
        timeWaited: "00:01:15",
      },
    });
  }),
    it("creates correct fahrenheit payload", () => {
      expect(
        createPayload(
          "F",
          ["temperature"],
          { sensor: "thermometer", value: 0, time_waited: "" },
          "48",
          { mins: "1", sec: "15" },
          "well",
          100,
          110
        )
      ).toStrictEqual({
        location: {
          type: "Point",
          coordinates: [100, 110],
        },
        waterSource: "well",
        temperature: {
          sensor: "thermometer",
          value: 8.9,
          timeWaited: "00:01:15",
        },
      });
    }),
    it("pads minutes and seconds", () => {
      expect(
        createPayload(
          "F",
          ["temperature"],
          { sensor: "thermometer", value: 0, time_waited: "" },
          "48",
          { mins: "1", sec: "5" },
          "well",
          100,
          110
        )
      ).toStrictEqual({
        location: {
          type: "Point",
          coordinates: [100, 110],
        },
        waterSource: "well",
        temperature: {
          sensor: "thermometer",
          value: 8.9,
          timeWaited: "00:01:05",
        },
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
    const result = validateInputs(
      undefined,
      10,
      "well",
      "sensor",
      "20",
      ["temperature"],
      errors
    );
    expect(result).toBe(false);
  }),
    it("returns false if water source is empty", () => {
      const errors = {
        mins: null,
        sec: null,
        temp: null,
        sensor: null,
      };
      const result = validateInputs(
        10,
        10,
        "",
        "sensor",
        "20",
        ["temperature"],
        errors
      );
      expect(result).toBe(false);
    }),
    it("returns false if sensor is empty", () => {
      const errors = {
        mins: null,
        sec: null,
        temp: null,
        sensor: null,
      };
      const result = validateInputs(
        10,
        10,
        "well",
        "",
        "20",
        ["temperature"],
        errors
      );
      expect(result).toBe(false);
    }),
    it("returns false if tempVal is empty", () => {
      const errors = {
        mins: null,
        sec: null,
        temp: null,
        sensor: null,
      };
      const result = validateInputs(
        10,
        10,
        "well",
        "sensor",
        "",
        ["temperature"],
        errors
      );
      expect(result).toBe(false);
    }),
    it("returns false if tempVal is not a number", () => {
      const errors = {
        mins: null,
        sec: null,
        temp: null,
        sensor: null,
      };
      const result = validateInputs(
        10,
        10,
        "well",
        "sensor",
        "abc",
        ["temperature"],
        errors
      );
      expect(result).toBe(false);
    }),
    it("returns false if there are errors - mins", () => {
      const errors = {
        mins: "error",
        sec: null,
        temp: null,
        sensor: null,
      };
      const result = validateInputs(
        10,
        10,
        "well",
        "sensor",
        "20",
        ["temperature"],
        errors
      );
      expect(result).toBe(false);
    }),
    it("returns false if there are errors - sec", () => {
      const errors = {
        mins: null,
        sec: "error",
        temp: null,
        sensor: null,
      };
      const result = validateInputs(
        10,
        10,
        "well",
        "sensor",
        "20",
        ["temperature"],
        errors
      );
      expect(result).toBe(false);
    }),
    it("returns false if there are errors - temp", () => {
      const errors = {
        mins: null,
        sec: null,
        temp: "error",
        sensor: null,
      };
      const result = validateInputs(
        10,
        10,
        "well",
        "sensor",
        "20",
        ["temperature"],
        errors
      );
      expect(result).toBe(false);
    }),
    it("returns false if there are errors - sensor", () => {
      const errors = {
        mins: null,
        sec: null,
        temp: null,
        sensor: "error",
      };
      const result = validateInputs(
        10,
        10,
        "well",
        "sensor",
        "20",
        ["temperature"],
        errors
      );
      expect(result).toBe(false);
    });
});
