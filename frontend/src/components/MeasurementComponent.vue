<script setup lang="ts">
import Cookies from "universal-cookie";
import { useRouter } from "vue-router";
import Modal from "./Modal.vue";
import { ref, computed, reactive, defineEmits, defineProps, watch } from "vue";
import {
  validateTemp,
  onSensorInput,
  validateInputs,
  createPayload,
} from "@/composables/MeasurementCollectionLogic";
import LocationFallback from "./LocationFallback.vue";
import L from "leaflet";

const cookies = new Cookies();
const router = useRouter();

const formData = reactive({
  location: "",
  water_source: "",
  temperature: {
    sensor: "",
    value: 0.0,
    time_waited: "",
  },
});

const time = reactive({
  mins: "",
  sec: "",
});

const errors = reactive<{
  temp: string | null;
  sensor: string | null;
}>({
  temp: null,
  sensor: null,
});
const minsRef = ref<HTMLInputElement>();
const secRef = ref<HTMLInputElement>();
const tempRef = ref<HTMLInputElement>();
const tempUnit = ref<"C" | "F">("C");
const tempVal = ref("");
const selectedMetrics = ref<string[]>([]);
const metricOptions = [{ label: "Temperature", value: "temperature" }];
const waterSourceOptions = [
  { label: "Well", value: "well" },
  { label: "Tap", value: "tap" },
];
const userLoc = ref<L.LatLng>(L.latLng(0, 0));
const locating = ref(false);
const locAvail = ref(true);

const validated = computed(() => {
  return validateInputs(
    userLoc.value?.lng,
    userLoc.value?.lat,
    formData.water_source,
    formData.temperature.sensor,
    tempVal.value,
    selectedMetrics.value,
    errors,
    time
  );
});

watch(
  () => formData.temperature.sensor,
  (newVal) => onSensorInput(newVal, errors)
);
function onTempInput() {
  validateTemp(tempVal.value, errors, tempRef);
}

function clear() {
  formData.location = "";
  formData.water_source = "";
  formData.temperature.sensor = "";
  formData.temperature.value = 0.0;
  time.mins = "";
  time.sec = "";
  tempVal.value = "";
  tempUnit.value = "C";
  selectedMetrics.value = [];
  errors.temp = null;
  errors.sensor = null;
  locationMode.value = null;
}

function getLocation() {
  if (!navigator.geolocation) {
    locAvail.value = false;
    return;
  }
  locating.value = true;
  locAvail.value = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLoc.value = L.latLng(pos.coords.latitude, pos.coords.longitude);
      locAvail.value = true;
      locating.value = false;
    },
    (err) => {
      locAvail.value = true;
      locating.value = false;
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
}

defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const handleKeyPress = (event: KeyboardEvent) => {
  const key = event.key;
  if (key.length === 1 && isNaN(Number(key))) {
    event.preventDefault();
  }
};
const handlePaste = (event: ClipboardEvent) => {
  const pastedText = event.clipboardData?.getData("text");
  if (pastedText && !/^\d+$/.test(pastedText)) {
    event.preventDefault();
  }
};
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.value.replace(/[^0-9]/g, ""));
};
const locationMode = ref<"auto" | "manual" | null>(null);

watch(locAvail, (avail) => {
  if (!avail) {
    locationMode.value = "manual";
  }
});

const showModal = ref(false);
const modalMessage = ref("");
const postData = () => {
  const payload = createPayload(
    tempUnit.value,
    selectedMetrics.value,
    formData.temperature,
    tempVal.value,
    time,
    formData.water_source,
    userLoc.value?.lng,
    userLoc.value?.lat
  );
  if (formData.temperature.value < 0 || formData.temperature.value > 40) {
    showModal.value = true;
    modalMessage.value =
      "Are you sure you would like to submit the temperature value " +
      tempVal.value +
      "°" +
      tempUnit.value +
      "?";
    return;
  }

  fetch("/api/measurements/", {
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
        router.push({ name: "Home" });
      } else {
        console.error("error with adding measurement");
      }
    })
    .catch((err) => {
      console.error(err);
    });
};
</script>

<template>
  <div class="min-h-screen bg-white p-4 md:p-8">
    <h1
      class="bg-main text-lg font-bold text-white rounded-lg p-4 mb-6 shadow max-w-screen-md mx-auto"
    >
      Record Measurement
    </h1>
    <div class="bg-light rounded-lg p-4 mb-6 shadow max-w-screen-md mx-auto">
      <h3 class="text-lg font-semibold mb-4">Measurement</h3>


      <div class="w-full h-48">
        <LocationFallback v-model:location="userLoc" />
      </div>

      <div class="flex-start min-w-0 flex items-center gap-2">
        <label class="self-center text-sm font-medium text-gray-700"
          >Water Source:</label
        >

        <select
          id="water_source"
          v-model="formData.water_source"
          class="self-center border border-gray-300 rounded px-3 py-2"
        >
          <option disabled value="">Select a source</option>
          <option
            v-for="opt in waterSourceOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>

    <div class="bg-light rounded-lg p-4 mb-6 shadow max-w-screen-md mx-auto">
      <h3 class="text-lg font-semibold mb-2">Metric</h3>
      <label
        for="metric_choice"
        class="block text-sm font-medium text-gray-700 mb-1"
        >Metric Type</label
      >
      <div class="flex flex-col gap-2">
        <label
          v-for="opt in metricOptions"
          :key="opt.value"
          class="flex items-center space-x-2"
        >
          <input
            type="checkbox"
            :value="opt.value"
            v-model="selectedMetrics"
            class="accent-primary"
          />
          <span>{{ opt.label }}</span>
        </label>
      </div>
    </div>

    <!-- Temperature Metric -->
    <div
      v-if="selectedMetrics.includes('temperature')"
      class="bg-light rounded-lg p-4 mb-6 shadow max-w-screen-md mx-auto space-y-6"
    >
      <h3 class="text-lg font-semibold mb-4">Temperature</h3>

      <!-- Sensor Type -->
      <div class="flex-1 items-start gap-4 mb-4">
        <div class="flex flex-col">
          <div class="flex-start min-w-0 flex items-center gap-2">
            <label for="sensor-type" class="text-sm font-medium text-gray-700"
              >Sensor Type</label
            >
            <input
              id="sensor-type"
              v-model="formData.temperature.sensor"
              placeholder="thermometer"
              type="text"
              :class="[
                'flex-grow border border-gray-300 rounded px-3 py-2 mt-1',
                errors.sensor ? 'border-red-500 border-2' : 'border-gray-300',
              ]"
            />
          </div>
          <p class="mt-2 h-4 text-red-600 text-xs">
            {{ errors.sensor || " " }}
          </p>
        </div>
      </div>

      <!-- Temp Val -->
      <div class="flex items-center gap-4">
        <div class="flex-1 flex-col">
          <div class="flex items-center gap-4">
            <div class="flex-1 min-w-0 flex items-center gap-2">
              <label for="temp-val" class="text-sm font-medium text-gray-700">
                <span class="hidden sm:inline">Temperature Value</span>
                <span class="inline sm:hidden">Temp. Value</span>
              </label>
              <input
                id="temp-val"
                v-model="tempVal"
                type="number"
                @input="onTempInput"
                ref="tempRef"
                placeholder="e.g. 24.3"
                :class="[
                  'flex-1 min-w-0 border border-gray-300 rounded px-3 py-2 mt-1',
                  errors.temp ? 'border-red-500 border-2' : 'border-gray-300',
                ]"
              />
              <label class="items-center gap-1">
                <input name="temp" type="radio" value="C" v-model="tempUnit" />
                <span>°C</span>
              </label>
              <label class="items-center gap-1">
                <input name="temp" type="radio" value="F" v-model="tempUnit" />
                <span>°F</span>
              </label>
            </div>
          </div>
          <p class="mt-2 h-4 text-red-600 text-xs">{{ errors.temp || " " }}</p>
        </div>
      </div>

      <!-- Temp time waited -->
      <div class="flex items-center gap-2">
        <div class="flex flex-col">
          <label class="block text-sm font-medium text-gray-700"
            >Time waited</label
          >
        </div>

        <div class="flex flex-col">
          <div class="flex items-center gap-2">
            <input
              id="time-waited_min"
              @input="handleInput"
              @keypress="handleKeyPress"
              @paste="handlePaste"
              v-model="time.mins"
              placeholder="00"
              type="number"
              ref="minsRef"
              class="w-16 border border-gray-300 rounded px-2 py-1 border-gray-300"
            />
            <label for="time-waited_min">Min</label>
          </div>
        </div>
        <div class="flex flex-col">
          <div class="flex items-center gap-2">
            <input
              id="time-waited_sec"
              @input="handleInput"
              @keypress="handleKeyPress"
              @paste="handlePaste"
              v-model="time.sec"
              placeholder="00"
              type="number"
              ref="secRef"
              class="w-16 border border-gray-300 rounded px-2 py-1 border-gray-300"
            />
            <label for="time-waited_sec">Sec</label>
          </div>
        </div>
      </div>
    </div>

    <!-- Submit -->
    <div class="flex mb-6 max-w-screen-md mx-auto mt-6 gap-2">
      <button
        type="button"
        class="flex-1 bg-white border border-primary text-primary px-4 py-2 rounded hover:bg-primary-light hover:cursor-pointer"
        @click="clear"
      >
        Clear
      </button>
      <button
        :disabled="!validated"
        type="submit"
        @click="postData"
        style="background-color: #00a6d6"
        :class="[
          'flex-1 px-4 py-2 rounded text-white ',
          !validated
            ? 'bg-gray-400 opacity-50 hover:cursor-not-allowed'
            : 'bg-main hover:cursor-pointer',
        ]"
      >
        Submit
      </button>
      <Modal :visible="showModal" @close="showModal = false">
        <h2 class="text-lg font-semibold mb-4">Confirm Submission</h2>
        <p>{{ modalMessage }}</p>
        <div class="flex items-center mt-4 gap-2">
          <button
            @click="showModal = false"
            class="flex-1 bg-white text-black border border-primary text-primary px-4 py-2 px-4 py-2 rounded hover:cursor-pointer"
          >
            Cancel
          </button>
          <button
            @click="postData"
            class="flex-1 bg-main text-white px-4 py-2 rounded mr-2 hover:bg-primary-light hover:cursor-pointer"
          >
            Submit
          </button>
        </div>
      </Modal>
    </div>
  </div>
</template>
