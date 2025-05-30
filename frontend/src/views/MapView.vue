<template>
    <div class="w-full h-full flex flex-col p-0 m-0">
        <CampaignBannerComponent v-if="campaigns.length" :campaigns="campaigns" class="bg-white" />

        <div class="w-full h-full flex flex-row">
            <div
                class="left-0 top-[64px] md:top-0 bottom-0 w-screen md:w-3/5 h-screen fixed md:relative z-10 bg-white"
                v-if="viewAnalytics || addMeasurement"
            >
                <MeasurementComponent v-if="addMeasurement" @close="handleClose" />
                <DataAnalyticsComponent v-if="viewAnalytics" :location="hexLocation" @close="handleClose" />
            </div>
            <HexMap :data="data" @hex-click="handleHexClick" />
            <div class="fixed left-4 bottom-5 flex align-center z-20 justify-center gap-4">
                <button
                    class="bg-main rounded-md p-1 text-white"
                    @click="
                        addMeasurement = true;
                        viewAnalytics = false;
                    "
                    v-if="!addMeasurement"
                >
                    <PlusCircleIcon class="w-10 h-10" />
                </button>
                <button
                    class="bg-main rounded-md p-1 text-white"
                    @click="showGlobalAnalytics"
                    v-if="!viewAnalytics && !addMeasurement"
                >
                    <ChartBarIcon class="w-10 h-10" />
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { PlusCircleIcon, ChartBarIcon } from "@heroicons/vue/24/outline";
import HexMap from "@/components/HexMap.vue";
import { ref, onMounted } from "vue";
import MeasurementComponent from "@/components/MeasurementComponent.vue";
import CampaignBannerComponent from "@/components/CampaignBannerComponent.vue";
import * as L from "leaflet";
import DataAnalyticsComponent from "@/components/DataAnalyticsComponent.vue";
import { asyncComputed } from "@vueuse/core";

const viewAnalytics = ref(false);
const addMeasurement = ref(false);
const campaigns = ref([]);
const hexLocation = ref<string>("");
type Location = {
    latitude: number;
    longitude: number;
};

/**
 * Shows the global analytics in the sidebar component.
 */
function showGlobalAnalytics() {
    hexLocation.value = "";
    viewAnalytics.value = true;
    addMeasurement.value = false;
}

/**
 * Handles the click event on a hexagon in the map.
 *
 * @param data the data of the hexagon clicked
 */
function handleHexClick(location: string) {
    hexLocation.value = location;
    viewAnalytics.value = true;
    addMeasurement.value = false;
}

/**
 * Handles the close event for the sidebar components.
 */
function handleClose() {
    viewAnalytics.value = false;
    addMeasurement.value = false;
}

/**
 * Fetches measurements from the API and formats them for the HexMap component.
 * The data is fetched asynchronously and transformed into a format suitable for the map.
 */
type MeasurementData = {
    point: L.LatLng;
    temperature: number;
    count: number;
};
type MeasurementResponseDataPoint = {
    location: { latitude: number; longitude: number };
    avg_temperature: number;
    count: number;
};

const data = asyncComputed(async (): Promise<MeasurementData[]> => {
    const res = await fetch("/api/measurements/aggregated");

    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const data = await res.json();

    return data.measurements.map((measurement: MeasurementResponseDataPoint) => ({
        point: L.latLng(measurement.location.latitude, measurement.location.longitude),
        temperature: measurement.avg_temperature,
        count: measurement.count,
    }));
}, [] as MeasurementData[]);

/**
 * Fetches active campaigns based on the user's location
 *
 * @param {number} lat - The user's latitude
 * @param {number} lng - The user's longitude
 */
const fetchCampaigns = async (lat: number, lng: number) => {
    const now = new Date().toISOString();

    const res = await fetch(`/api/campaigns/active/?datetime=${encodeURIComponent(now)}&lat=${lat}&lng=${lng}`, {
        method: "GET",
        credentials: "same-origin",
    });

    if (!res.ok) throw new Error(`Status: ${res.status}`);

    const data = await res.json();
    campaigns.value = data.campaigns || [];
};

/**
 * Gets the user's location using the Geolocation API or falls back to IP-based location.
 *
 * @returns {Promise<Location>} A promise that resolves to the user's location
 */
const getLocation = (): Promise<Location> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            console.warn("Geolocation not supported, falling back to IP-based location");
            getIpLocation().then(resolve).catch(reject);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                resolve({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                });
            },
            (err) => {
                console.warn("Geolocation failed, falling back to IP-based location", err);
                getIpLocation().then(resolve).catch(reject);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            },
        );
    });
};

/**
 * Fetches the user's location based on their IP address.
 *
 * @returns {Promise<Location>} A promise that resolves to the user's location
 */
const getIpLocation = (): Promise<Location> => {
    return fetch("https://www.geolocation-db.com/json/")
        .then((res) => res.json())
        .then((data) => {
            if (!data.latitude || !data.longitude) {
                throw new Error("Invalid IP location data");
            }
            return {
                latitude: data.latitude,
                longitude: data.longitude,
            };
        });
};

onMounted(async () => {
    getLocation()
        .then((position) => {
            const lat = position.latitude;
            const lng = position.longitude;

            fetchCampaigns(lat, lng);
        })
        .catch((err) => {
            console.error("Error getting location or fetching campaigns:", err);
            campaigns.value = [];
        });
});
</script>
