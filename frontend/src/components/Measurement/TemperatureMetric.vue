<script setup lang="ts">
import type { SensorOptions, Temperature } from "@/composables/MeasurementCollectionLogic";
import { ref, watch } from "vue";
const priorDot = ref(false);

/**
 * Handles key presses for the temperature input field.
 *
 * @param {KeyboardEvent} event - The keypress event.
 * @return {void}
 */
const handleTempPress = (event: KeyboardEvent) => {
    const key = event.key;
    const target = event.target as HTMLInputElement;
    if (key == "Tab") return; // Allow tabbing out of the input

    if (key === "Backspace" || key === "Delete") {
        // handle backspace and delete
        priorDot.value = false;
        return;
    } else if (/^\d$/.test(key)) {
        // check if the key is a digit (0-9)
        priorDot.value = false;
        return;
    } else if (key === ".") {
        // handle decimal points (consecutive and non consecutive)
        if (target.value.includes(".") || priorDot.value) {
            event.preventDefault();
            return;
        }

        priorDot.value = true;
        return;
    }

    // Block any other input
    event.preventDefault();
};

/**
 * Handles input changes for the temperature input field, specifically with regard to leading/trailing zeros.
 *
 * @param {Event} event - The input event.
 * @return {void}
 */
const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    let value = target.value;
    if (value.length > 1 && value[0] === "0" && value[1] !== ".") {
        value = value.replace(/^0+/, "");
        if (value === "" || value === ".") {
            value = "0" + value;
        }
    }

    if (target.value !== value) {
        const cursorPos = target.selectionStart;
        target.value = value;
        target.setSelectionRange(cursorPos, cursorPos);
    }
};

const modelValue = defineModel<Temperature>({
    required: true,
});

defineProps<{
    sensorOptions: SensorOptions;
}>();

type TemperatureMetricErrors = {
    sensor: string | false;
    value: string | false;
    time_waited: string | false;
};
const errors = ref<TemperatureMetricErrors>({
    sensor: false,
    value: false,
    time_waited: false,
});

/**
 * Verifies the validity of the Sensor field.
 *
 * @returns {boolean} True if Sensor field is valid, false otherwise.
 */
function verifySensor(): boolean {
    if (!modelValue.value.sensor) {
        errors.value.sensor = "Sensor type is required.";
    } else {
        errors.value.sensor = false;
    }
    return errors.value.sensor === false;
}

/**
 * Verifies the validity of the Temperature Value field.
 *
 * @returns {boolean} True if Temperature Value field is valid, false otherwise.
 */
function verifyTemperature(): boolean {
    const temperature = modelValue.value;
    if (!temperature.value && temperature.value !== 0) {
        errors.value.value = "Temperature value is required.";
    } else if (!temperature.unit) {
        errors.value.value = "Temperature unit is required.";
    } else if (temperature.unit === "C" && (temperature.value >= 100 || temperature.value <= 0)) {
        errors.value.value = "Temperature value must be between 0°C and 100°C";
    } else if (temperature.unit === "F" && (temperature.value > 212 || temperature.value < 32)) {
        errors.value.value = "Temperature value must be between 32°F and 212°F";
    } else {
        errors.value.value = false;
    }
    return errors.value.value === false;
}

/**
 * Verifies the validity of the Time Waited field.
 *
 * @returns {boolean} True if Time Waited field is valid, false otherwise.
 */
function verifyTimeWaited(): boolean {
    const time = modelValue.value.time_waited;
    if (!time.minutes && !time.seconds) {
        errors.value.time_waited = "Time waited is required.";
    } else if (
        (time.minutes && (time.minutes < 0 || time.minutes > 59)) ||
        (time.seconds && (time.seconds < 0 || time.seconds > 59))
    ) {
        errors.value.time_waited = "Time waited must be between 00:00 and 59:59";
    } else {
        errors.value.time_waited = false;
    }
    return errors.value.time_waited === false;
}

const resetErrorAfterFirstVerify = (() => {
    let hasBeenCalled = false;
    return function () {
        if (!hasBeenCalled) {
            watch(() => modelValue.value.sensor, verifySensor);
            watch(() => modelValue.value.value, verifyTemperature);
            watch(() => modelValue.value.time_waited.minutes || modelValue.value.time_waited.seconds, verifyTimeWaited);
            watch(() => modelValue.value.unit, verifyTemperature);
            hasBeenCalled = true;
        }
    };
})();

/**
 * Verifies the validity of the temperature measurement fields.
 *
 * @returns {boolean} True if all fields are valid, false otherwise.
 */
function verify(): boolean {
    const validSensor = verifySensor();
    const validTemperature = verifyTemperature();
    const validTimeWaited = verifyTimeWaited();
    resetErrorAfterFirstVerify();
    return validSensor && validTemperature && validTimeWaited;
}

defineExpose({
    verify,
});
</script>

<template>
    <Block title="Temperature">
        <!-- Sensor Type -->
        <div class="flex-1 items-start gap-4 mb-4">
            <div class="flex flex-col">
                <UFormField class="xs:flex xs:items-center xs:gap-4" :error="errors.sensor" label="Sensor Type">
                    <USelect
                        data-testid="sensor-type"
                        :items="sensorOptions"
                        value-key="value"
                        v-model="modelValue.sensor"
                        class="w-60"
                        :ui="{
                            content: 'z-10',
                        }"
                    />
                </UFormField>
            </div>
        </div>

        <!-- Temperature Value + Unit -->
        <UFormField class="xs:flex xs:items-center xs:gap-4" :error="errors.value" label="Temperature Value">
            <div class="flex items-center gap-4">
                <UInput
                    data-testid="temp-val"
                    id="temp-val"
                    v-model="modelValue.value"
                    type="text"
                    @keydown="handleTempPress"
                    @input="handleInput"
                    ref="tempRef"
                    placeholder="e.g. 24.3"
                    class="min-w-16 max-w-20"
                    aria-label="Temperature value input"
                />

                <URadioGroup
                    data-testid="temp-unit"
                    v-model="modelValue.unit"
                    :items="[
                        { label: '°C', value: 'C' },
                        { label: '°F', value: 'F' },
                    ]"
                    value-key="value"
                    color="primary"
                    orientation="horizontal"
                    variant="table"
                    default-value="C"
                    indicator="hidden"
                    :ui="{
                        item: 'p-2',
                    }"
                ></URadioGroup>
            </div>
        </UFormField>

        <!-- Time waited -->
        <div class="flex items-center gap-2">
            <UFormField class="xs:flex xs:items-center xs:gap-4" :error="errors.time_waited" label="Time waited">
                <DurationInput v-model="modelValue.time_waited" />
            </UFormField>
        </div>
    </Block>
</template>
