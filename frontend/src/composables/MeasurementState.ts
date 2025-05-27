import { ref } from "vue";

const addingMeasurement = ref(false);

/**
 * Provides the current measurement state.
 * @returns { addingMeasurement: Ref<boolean> }
 */
export function useMeasurementState() {
    return { addingMeasurement };
}

/**
 * Sets the measurement state to false.
 */
export function setFalse() {
    addingMeasurement.value = false;
}

/**
 * Sets the measurement state to true.
 */
export function setTrue() {
    addingMeasurement.value = true;
}
