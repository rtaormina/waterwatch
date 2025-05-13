<script setup lang='ts'>

import Cookies from "universal-cookie"
import { useRouter } from 'vue-router'
import { ref, computed, reactive, nextTick, watch, } from 'vue'

const cookies = new Cookies()
const router = useRouter()

const formData = reactive({
    location : '',
    water_source : '',
    temperature :
        {
        sensor : '',
        value : 0.0,
        time_waited : ''
    },
})

const time = reactive({
    mins: '',
    sec: ''
})

const errors = reactive<{ mins: string | null; sec: string | null; temp: string | null; sensor: string | null }>({
  mins: null,
  sec: null,
  temp: null,
  sensor: null
})
const minsRef = ref<HTMLInputElement>()
const secRef = ref<HTMLInputElement>()
const tempRef = ref<HTMLInputElement>()
const tempUnit = ref<'C' | 'F'>('C')
const tempVal = ref('')
const selectedMetrics = ref<string[]>([])
const metricOptions = [
    {label: 'Temperature', value: 'temperature'},
]
const userLoc = ref<{latitude: number; longitude: number} | null>(null)
const locating = ref(false)
const locAvail = ref(true)


const validated = computed(() => {
    if(userLoc.value?.longitude === null || userLoc.value?.latitude === null || formData.water_source === ''
        ){
            return false
        }
    if(selectedMetrics.value.includes('temperature')){
        if((formData.temperature.sensor === '' || formData.temperature.time_waited === '00:00:00'
        || tempVal.value === '')){
            return false
        }
        const val = time.sec
        if (val === '' || isNaN(Number(val)) || Number(val) < 0 || Number(val) > 59) {
            return false
        }
        const val2 = time.mins
        if (val2 === '' || isNaN(Number(val2)) || Number(val2) < 0 || Number(val2) > 59) {
            return false
        }
        }

    return true
})



function getLocation() {
    if(!navigator.geolocation){
        locAvail.value = false
        return
    }
    locating.value = true
    locAvail.value = true
    navigator.geolocation.getCurrentPosition(
        pos => {
            userLoc.value = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
            }
            locating.value = false
        },
        err => {
            locAvail.value = true
            locating.value = false
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    )
}

function createPayload(){
    if(tempUnit.value == null) return 0
    if(selectedMetrics.value.includes('temperature')){
        if(tempUnit.value === 'F'){
        formData.temperature.value = Math.round(((+tempVal.value - 32) * (5/9)) * 10)/10
        }else{
            formData.temperature.value = Math.round(+tempVal.value * 10) / 10
        }
        const mins = time.mins
        const secs = time.sec
        const mm = String(mins).padStart(2, '0');
        const ss = String(secs).padStart(2, '0');
        formData.temperature.time_waited = `00:${mm}:${ss}`;
    }

    return {
        location: {
            type: 'Point',
            coordinates: [userLoc.value?.longitude, userLoc.value?.latitude]
        },
        water_source: formData.water_source,
        temperature: formData.temperature
    }
}


const validate = () => {

    const payload = createPayload()

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
                router.push({ name: 'Home' })
            }
            else {
                console.log("error with adding measurement")
            }
            })
            .catch((err) => {
                console.error(err);
            });

    }


function validateMins(val: string) {
  if (!/^\d+$/.test(val) || +val < 0 || +val > 59) {
    errors.mins = 'Enter a number 0-59'
    nextTick(() => minsRef.value?.focus())
  } else {
    errors.mins = null
  }
}

function validateSec(val: string) {
  if (!/^\d+$/.test(val) || +val <= 0 || +val > 59) {
    errors.sec = 'Enter a number 0-59'
    nextTick(() => secRef.value?.focus())
  } else {
    errors.sec = null
  }
}

function validateTemp(val: string) {
  if (!/^-?\d+(\.\d+)?$/.test(val)) {
    errors.temp = 'Enter a number'
    nextTick(() => tempRef.value?.focus())
  } else {
    errors.temp = null
  }
}
function onTempInput() {
  validateTemp(tempVal.value)
}
function onMinsInput() {
  validateMins(time.mins)
}
function onSecInput() {
  validateSec(time.sec)
}
function onSensorInput() {
  if (formData.temperature.sensor === '') {
    errors.sensor = 'Sensor type is required'
  } else {
    errors.sensor = null
  }
}

watch(() => time.mins, (newVal) => validateMins(newVal))
watch(() => time.sec, (newVal) => validateSec(newVal))
watch(() => tempVal.value, (newVal) => validateTemp(newVal))
watch(() => formData.temperature.sensor, (newVal) => onSensorInput)

const formIsValid = computed(() => {
  return (
    errors.mins === null &&
    errors.sec === null &&
    time.mins !== '' &&
    time.sec !== ''
  )
})

function clear() {
    formData.location = ''
    formData.water_source = ''
    formData.temperature.sensor = ''
    formData.temperature.value = 0.0
    time.mins = ''
    time.sec = ''
    tempVal.value = ''
    tempUnit.value = 'C'
    selectedMetrics.value = []
    userLoc.value = null
    errors.mins = null
    errors.sec = null
    errors.temp = null
    errors.sensor = null
}

</script>

<template>
    <div class="min-h-screen bg-white p-4 md:p-8">
        <h1 class="bg-main text-lg font-bold text-white rounded-lg p-4 mb-6 shadow max-w-screen-md mx-auto">Record Measurement</h1>
        <div class="bg-light rounded-lg p-4 mb-6 shadow max-w-screen-md mx-auto">
            <h3 class="text-lg font-semibold mb-4">Measurement</h3>

            <div class="mb-4">
                <label for="location" class="block text-sm font-medium text-gray-700">Location:</label>
                <input ref="loc" type="text" id="location" class="w-full border border-gray-300 rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-primary">
            </div>
            <div class="flex items-center gap-4 mb-3">
                <button type="button" @click="getLocation"  :disabled="locating" class="bg-main mb-4 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed">{{ locating ? "Locating…" : "Use Current Location" }}</button>
                <p v-if="!locAvail">Location not available, please select your location manually.</p>
            </div>
            <div class="flex-start min-w-0 flex items-center gap-2">
                <label for="water_source" class="self-center text-sm font-medium text-gray-700">Water Source: </label>
                <select id="water_source" v-model="formData.water_source" class="flex-1 border border-gray-300 rounded px-3 py-2 mb-4">
                    <option value="well">Well</option>
                </select>
            </div>


        </div>

        <div class="bg-light rounded-lg p-4 mb-6 shadow max-w-screen-md mx-auto">
            <h3 class="text-lg font-semibold mb-2">Metric</h3>
            <label for="metric_choice" class="block text-sm font-medium text-gray-700 mb-1">Metric Type</label>
            <div class="flex flex-col gap-2">
                <label v-for="opt in metricOptions" :key="opt.value" class="flex items-center space-x-2">
                    <input type="checkbox" :value="opt.value" v-model="selectedMetrics" class="accent-primary">
                    <span>{{ opt.label }}</span>
                </label>
            </div>
        </div>


        <!-- Temperature Metric -->
        <div v-if="selectedMetrics.includes('temperature')" class="bg-light rounded-lg p-4 mb-6 shadow max-w-screen-md mx-auto space-y-6">
            <h3 class="text-lg font-semibold mb-4">Temperature</h3>

            <!-- Sensor Type -->
            <div class="flex-1 items-start gap-4 mb-4">
                <div class="flex flex-col">
                    <div class="flex-start min-w-0 flex items-center gap-2">
                        <label for="sensor-type" class="text-sm font-medium text-gray-700">Sensor Type</label>
                        <input id="sensor-type" v-model="formData.temperature.sensor" type="text" @input="onSensorInput" :class="['flex-grow border border-gray-300 rounded px-3 py-2 mt-1',errors.sensor ? 'border-red-500 border-2': 'border-gray-300']">
                    </div>
                    <p class="mt-2 h-4 text-red-600 text-xs">{{ errors.sensor || ' '}}</p>
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
                            <input id="temp-val" v-model.number="tempVal" type="number" ref="tempRef" placeholder="e.g. 24.3" @input="onTempInput" :class="['flex-grow border border-gray-300 rounded px-3 py-2 mt-1',errors.temp ? 'border-red-500 border-2': 'border-gray-300']">
                            <label class="inline-flex items-center gap-1">
                                <input name="temp" type="radio" value="C" v-model="tempUnit">
                                <span>°C</span>
                            </label>
                            <label class="inline-flex items-center gap-1">
                                <input name="temp" type="radio" value="F" v-model="tempUnit">
                                <span>°F</span>
                            </label>
                        </div>
                    </div>
                    <p class="mt-2 h-4 text-red-600 text-xs">{{ errors.temp || ' '}}</p>
                </div>
            </div>

            <!-- Temp time waited -->
            <div class="flex items-center gap-2">
                <div class="flex flex-col">
                    <label class="block text-sm font-medium text-gray-700">Time waited</label>
                    <p class="mt-1 h-4"></p>
                </div>

                <div class="flex flex-col">
                    <div class="flex items-center gap-2">
                        <input id="time-waited_min" v-model.number="time.mins" type="number" ref="minsRef" @input="onMinsInput" :class="['w-16 border border-gray-300 rounded px-2 py-1',errors.mins ? 'border-red-500 border-2': 'border-gray-300']">
                        <label for="time-waited_min">Min</label>
                    </div>
                    <p class="mt-1 h-4 text-red-600 text-xs">{{ errors.mins || ' '}}</p>
                </div>
                <div class="flex flex-col">
                    <div class="flex items-center gap-2">
                        <input id="time-waited_sec" v-model.number="time.sec" type="number" ref="secRef" @input="onSecInput" :class="['w-16 border border-gray-300 rounded px-2 py-1',errors.sec ? 'border-red-500 border-2': 'border-gray-300']" >
                        <label for="time-waited_sec">Sec</label>
                    </div>
                    <p class="mt-1 h-4 text-red-600 text-xs">{{ errors.sec || ' '}}</p>
                </div>
            </div>
        </div>


        <!-- Submit -->
        <div class="flex grow justify-evenly items-center mt-6">
            <button type="button" class="bg-white border border-primary text-primary px-4 py-2 rounded hover:bg-primary-light" @click='clear'>Clear</button>
            <button :disabled="!validated || !formIsValid" type="submit" @click='validate' style="background-color: #00A6D6;" class="px-4 py-2 rounded text-white disabled:bg-gray-400 disabled:cursor-not-allowed">Submit</button>
        </div>
        <!-- <div class="mt-4 text-red-600">
            <p v-if="!validated">Please fill in the required fields.</p>
        </div> -->
    </div>


</template>
