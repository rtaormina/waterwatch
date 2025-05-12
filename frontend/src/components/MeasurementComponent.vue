<script setup lang='ts'>

import Cookies from "universal-cookie"
import { useRouter } from 'vue-router'
import { ref, computed, reactive} from 'vue'
import { errorMessages } from "vue/compiler-sfc"

const cookies = new Cookies()
const router = useRouter()


const tempUnit = ref<'C' | 'F'>('C')
const formData = reactive({
    location : '',
    flag : false,
    water_source : '',
    metrics : [
        {
        metric_type : 'temperature',
        sensor : '',
        value : 0.0,
        time_waited : ''
    }
    ]

})
const time = reactive({
    mins: '',
    sec: ''
})
const tempVal = ref('')
const selectedMetrics = ref<string[]>([])
const metricOptions = [
    {label: 'Temperature', value: 'temperature'},
]
const errorMsgLoc = ref<string>('')
const userLoc = ref<{latitude: number; longitude: number} | null>(null)
const locating = ref(false);
const valid = computed(() => {
  return (
    isValidNumber(tempVal.value) &&
    isValidNumber(time.mins) && Number.isInteger(+time.mins) &&
    isValidNumber(time.sec) && Number.isInteger(+time.sec)
  )
})
const validated = computed(() => {
    if(userLoc.value?.longitude === null || userLoc.value?.latitude === null || formData.water_source === '' ||
            formData.metrics[0].sensor === '' || formData.metrics[0].time_waited === '00:00:00'
            || tempVal.value === ''
        ){
            console.log("something empty")
            console.log(formData.location)
            console.log(formData.water_source)
            console.log(formData.metrics[0].sensor)
            console.log(formData.metrics[0].time_waited)
            console.log(tempVal.value)

            return false
        }
        return true;
})
function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

const validate = () => {
    if(tempUnit.value == null) return 0
    if(tempUnit.value === 'F'){
        formData.metrics[0].value = (+tempVal.value - 32) * (5/9)
        console.log(tempVal.value)
        console.log(formData.metrics[0].value)
    }else{
        formData.metrics[0].value = +tempVal.value
    }
    if(formData.metrics[0].value < 0 || formData.metrics[0].value > 40) {
        formData.flag = true
    }
    const mins = time.mins != null ? time.mins : 0;
    const secs = time.sec != null ? time.sec : 0;
    const mm = String(mins).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');
    formData.metrics[0].time_waited = `00:${mm}:${ss}`;


    formData.metrics[0].value = Math.round(+tempVal.value * 10) / 10

    const payload = {
        location: {
            type: 'Point',
            coordinates: [userLoc.value?.longitude, userLoc.value?.latitude]
        },
        flag: formData.flag,
        water_source: formData.water_source,
        metrics: formData.metrics
    }

        fetch("api/measurements/", {
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

function getLocation() {
    if(!navigator.geolocation){
        errorMsgLoc.value = 'No geolocation'
        return
    }
    locating.value = true
    navigator.geolocation.getCurrentPosition(
        pos => {
            userLoc.value = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
            }
            locating.value = false
        },
        err => {
            errorMsgLoc.value = 'Location could not be retrieved'
            locating.value = false
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    )
}


</script>

<template>
    <div class="min-h-screen bg-white p-4 md:p-8">
        <h1 class="text-2xl font-bold text-white px-4 py-3 rounded mb-6" style="background-color: #00A6D6;">Record Measurement</h1>
        <div class=" rounded-lg p-4 mb-6 shadow max-w-screen-md mx-auto" style="background-color: #D7E9F4;">
            <h3 class="text-lg font-semibold mb-4">Measurement</h3>

            <div class="mb-4">
                <label for="location" class="block text-sm font-medium text-gray-700">Location:</label>
                <input ref="loc" type="text" id="location" class="w-full border border-gray-300 rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-primary">
            </div>
            <button type="button" @click="getLocation"  :disabled="locating" style="background-color: #00A6D6;" class="mb-4 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed">{{ locating ? "Locating…" : "Use Current Location" }}</button>

            <div class="flex items-center gap-4 mb-3">
                <label for="water_source" class="block text-sm font-medium text-gray-700">Water Source: </label>
                <select id="water_source" v-model="formData.water_source" class="w-full border border-gray-300 rounded px-3 py-2 mb-4">
                    <option value="well">Well</option>
                </select>
            </div>

        </div>

        <div class="rounded-lg p-4 mb-6 shadow max-w-screen-md mx-auto" style="background-color: #D7E9F4;">
            <h3 class="text-lg font-semibold mb-2">Metric</h3>
            <label for="metric_choice" class="block text-sm font-medium text-gray-700 mb-1">Metric Type</label>
            <div class="flex flex-col gap-2">
                <label v-for="opt in metricOptions" :key="opt.value" class="flex items-center space-x-2">
                    <input type="checkbox" :value="opt.value" v-model="selectedMetrics" class="accent-primary">
                    <span>{{ opt.label }}</span>
                </label>

            </div>

        </div>

        <div v-if="selectedMetrics.includes('temperature')" class="rounded-lg p-4 mb-6 shadow max-w-screen-md mx-auto" style="background-color: #D7E9F4;">
            <h3 class="text-lg font-semibold mb-4">Temperature</h3>

            <div class="flex items-center gap-4 mb-4">
                <label for="sensor-type" class="block text-sm font-medium text-gray-700">Sensor Type</label>
                <input id="sensor-type" v-model="formData.metrics[0].sensor" type="text" class="w-full border border-gray-300 rounded px-3 py-2 mt-1">
            </div>

            <div class="flex items-center gap-4 mb-4">
                <label for="temp-val" class="block text-sm font-medium text-gray-700">Temperature Value</label>
                <input id="temp-val" v-model.number="tempVal" type="number" step="0.1" placeholder="e.g. 24.3" class="w-full border border-gray-300 rounded px-3 py-2 mt-1">
                <label class="inline-flex items-center gap-1">
                    <input name="temp" type="radio" value="C" v-model="tempUnit">
                    <span>°C</span>
                </label>
                <label class="inline-flex items-center gap-1">
                    <input name="temp" type="radio" value="F" v-model="tempUnit">
                    <span>°F</span>
                </label>
            </div>

            <div class="flex items-center gap-2">
                <label class="block text-sm font-medium text-gray-700">Time waited</label>
                <input id="time-waited_min" v-model.number="time.mins" type="number" pattern="^\d{1,2}$" class="w-16 border border-gray-300 rounded px-2 py-1">
                <label for="time-waited_min">Min</label>
                <input id="time-waited_sec" v-model.number="time.sec" type="number" pattern="^\d{1,2}$" class="w-16 border border-gray-300 rounded px-2 py-1" >
                <label for="time-waited_sec">Sec</label>
            </div>


        </div>

        <div class="flex grow justify-evenly items-center mt-6">
            <button type="button" class="bg-white border border-primary text-primary px-4 py-2 rounded hover:bg-primary-light">Clear</button>
            <button :disabled="!validated || !valid" type="submit" @click='validate' style="background-color: #00A6D6;" class="px-4 py-2 rounded text-white disabled:bg-gray-400 disabled:cursor-not-allowed">Submit</button>
        </div>
        <div class="mt-4 text-red-600">
            <p v-if="!valid">Please enter valid numbers.</p>
            <p v-if="!validated">Please fill in the required fields.</p>
        </div>
    </div>


</template>
