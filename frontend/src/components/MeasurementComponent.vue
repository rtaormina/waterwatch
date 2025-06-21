<script setup lang="ts">
import Cookies from "universal-cookie";
import { useRouter } from "vue-router";
import MeasurementBasisBlock from "./Measurement/MeasurementBlock.vue";
import Modal from "./Modal.vue";
import { ref, defineEmits, defineExpose, useTemplateRef } from "vue";
import {
    createPayload,
    type MeasurementData,
    type Metric,
    type MetricOptions,
    sensorOptions,
    waterSourceOptions,
} from "../composables/MeasurementCollectionLogic.ts";
import * as L from "leaflet";
import { useToast } from "@nuxt/ui/runtime/composables/useToast.js";

const cookies = new Cookies();
const router = useRouter();
const toast = useToast();

const selectedMetrics = ref<Metric[]>(["temperature"]);
const metricOptions: MetricOptions = [{ label: "Temperature", value: "temperature" }];

const defaultData: MeasurementData = {
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

const data = ref<MeasurementData>(defaultData);

interface VerifiableComponent {
    verify: () => boolean;
}
const TemperatureMetricComponent = useTemplateRef<VerifiableComponent>("TemperatureMetric");
const MeasurementBlock = useTemplateRef<VerifiableComponent>("MeasurementBlock");

/**
 * Clears the form from all values.
 */
function clear() {
    data.value = defaultData;
}

/**
 * Handles the submission of measurement data and delegates validating inputs.
 */
function submitData() {
    const validMeasurement = MeasurementBlock.value?.verify() ?? false;
    const validTemperature =
        !selectedMetrics.value.includes("temperature") || TemperatureMetricComponent.value?.verify();
    if (validMeasurement && validTemperature) postDataCheck();
    else {
        toast.add({
            title: "Please fill in all required fields.",
            color: "error",
            icon: "heroicons-solid:exclamation-triangle",
        });
    }
}

const emit = defineEmits<{
    (e: "close"): void;
    (e: "submitMeasurement"): void;
}>();

const showModal = ref(false);
const modalMessage = ref("");

/**
 * Sends the form data to the server, and check if the response is successful.
 */
const postData = () => {
    const payload = createPayload(data, selectedMetrics);
    return fetch("/api/measurements/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": cookies.get("csrftoken"),
        },
        credentials: "same-origin",
        body: JSON.stringify(payload),
    })
        .then((res) => {
            if (res.status === 201) {
                toast.add({
                    title: "Measurement successfully submitted!",
                    color: "success",
                    icon: "i-heroicons-check-circle",
                });
                showModal.value = false;
                emit("submitMeasurement");
                clear();
                router.push({ name: "Map" });
            } else {
                console.error("Error with adding measurement");
                toast.add({
                    title: "Error Submitting Measurement!",
                    color: "error",
                    icon: "heroicons-solid:exclamation-triangle",
                });
            }
        })
        .catch((err) => {
            toast.add({
                title: "Error Submitting Measurement!",
                description: err.message,
                color: "error",
                icon: "heroicons-solid:exclamation-triangle",
            });
            console.error(err);
        })
        .finally(() => {
            clear();
            emit("close");
        });
};

/**
 * Checks the temperature data and displays a warning message to the user based on it.
 * If the temperature is out of range, it shows a warning message.
 * If the temperature is within range, it shows a confirmation message.
 */
const postDataCheck = () => {
    const temperatureValue = data.value.temperature.value;
    const temperatureUnit = data.value.temperature.unit;
    let tempCheck;
    if (selectedMetrics.value.includes("temperature")) {
        if (temperatureValue === undefined || temperatureValue === null) {
            TemperatureMetricComponent.value?.verify();
            toast.add({
                title: "Please fill in the temperature value.",
                color: "error",
                icon: "heroicons-solid:exclamation-circle",
            });
            return;
        }
        if (temperatureUnit === "F") {
            tempCheck = Math.round((temperatureValue - 32) * (5 / 9) * 10) / 10;
        } else {
            tempCheck = Math.round(temperatureValue * 10) / 10;
        }
        if (tempCheck < 0 || tempCheck > 40) {
            showModal.value = true;
            modalMessage.value = `Are you sure you would like to submit the temperature value ${temperatureValue}°${temperatureUnit}?`;
            return;
        } else {
            showModal.value = true;
            modalMessage.value = "Are you sure you would like to submit this measurement?";
            return;
        }
    } else {
        showModal.value = true;
        modalMessage.value = "Are you sure you would like to submit this measurement?";
        return;
    }
};

// Expose methods so vue-docgen-cli can pick them up
defineExpose({
    /** Clears the form from all values. */
    clear,
    /** Sends the form data to the server, and checks if the response is successful. */
    postData,
    /** Checks temperature and displays a confirmation or warning modal. */
    postDataCheck,
});
</script>

<template>
    <SideBar title="Record Measurement" @close="emit('close')">
        <div class="flex-1 pb-16 md:pb-0">
            <!-- Measurement block -->
            <MeasurementBasisBlock
                v-model:location="data.location"
                v-model:water-source="data.waterSource"
                v-model:time="data.time"
                :water-source-options="waterSourceOptions"
                ref="MeasurementBlock"
            ></MeasurementBasisBlock>

            <!-- Metric block -->
            <Block title="Metric Type">
                <UCheckboxGroup
                    data-testid="metric-checkbox"
                    v-model="selectedMetrics"
                    :items="metricOptions"
                    color="primary"
                    legend="Metric Type"
                />
            </Block>

            <!-- Temperature Metric (if selected) -->
            <TemperatureMetric
                v-if="selectedMetrics.includes('temperature')"
                v-model="data.temperature"
                :sensor-options="sensorOptions"
                ref="TemperatureMetric"
            />
        </div>

        <div
            class="/* mobile: pinned row */ z-10 flex gap-2 bg-default p-4 shadow fixed bottom-0 left-0 w-full /* md+ : revert to static, original margins & width */ md:relative md:bottom-auto md:left-auto md:w-auto md:bg-transparent md:p-0 md:shadow-none md:mb-6 md:max-w-screen-md md:mx-auto md:mt-6"
        >
            <UButton
                class="flex-1 border bg-default text-md border-primary justify-center text-default px-4 py-2 rounded hover:bg-accented hover:cursor-pointer"
                @click="clear"
                label="Clear"
            />
            <UButton
                type="submit"
                data-testid="submit-measurement-button"
                @click="submitData"
                class="flex-1 px-4 py-2 rounded text-inverted justify-center text-md bg-primary hover:cursor-pointer"
                label="Submit"
            />

            <!-- Modal markup unchanged -->
            <Modal :visible="showModal" @close="showModal = false">
                <h2 class="text-lg font-semibold mb-4">Confirm Submission</h2>
                <p data-testid="add-measurement-modal-message">{{ modalMessage }}</p>
                <div class="flex items-center mt-4 gap-2">
                    <UButton
                        @click="showModal = false"
                        class="flex-1 justify-center bg-default border border-primary text-default px-4 py-2 rounded hover:bg-accented hover:cursor-pointer"
                        label="Cancel"
                    />
                    <UButton
                        data-testid="submit-modal-button"
                        @click="postData"
                        class="flex-1 justify-center bg-primary text-inverted px-4 py-2 rounded mr-2 hover:cursor-pointer"
                        label="Submit"
                    />
                </div>
            </Modal>
        </div>
    </SideBar>
</template>
