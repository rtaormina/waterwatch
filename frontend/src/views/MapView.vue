<template>
    <div class="w-full h-full flex flex-col p-0 m-0">
        <CampaignBannerComponent v-if="campaigns.length" :campaigns="campaigns" class="bg-white" />

        <div class="w-full h-full flex flex-row">
            <div
                v-if="viewAnalytics || addMeasurement || showCompareAnalytics"
                class="left-0 top-[64px] md:top-0 bottom-0 md:bottom-auto w-screen md:w-3/5 fixed md:relative h-[calc(100vh-64px)] md:h-auto bg-white z-10"
            >
                <MeasurementComponent v-if="addMeasurement" @close="handleCloseAll" />
                <DataAnalyticsComponent v-if="viewAnalytics" :location="hexLocation" @close="handleCloseAll" />

                <DataAnalyticsCompare
                    v-if="showCompareAnalytics"
                    :group1WKT="group1WKT"
                    :group2WKT="group2WKT"
                    @close="handleCloseAll"
                />
            </div>
            <div class="relative w-full h-full">
                <ComparisonBar
                    v-if="compareMode"
                    :mode="comparePhaseString"
                    :phaseNum="comparePhaseNum"
                    :group1Count="group1HexCount"
                    :group2Count="group2HexCount"
                    @cancel="exitCompareMode"
                    @previous="goToPhase1"
                    @next="goToPhase2"
                    @compare="goToPhase3"
                    @restart="goToPhase1"
                    @exit="exitCompareMode"
                />
                <HexMap
                    ref="hexMapRef"
                    :colors="colors"
                    :data="data"
                    :colorScale="scale"
                    :selectMult="selectMult && !compareMode"
                    :compareMode="compareMode"
                    :activePhase="comparePhaseNum"
                    @click="showLegend = false"
                    @hex-click="handleHexClick"
                    @hex-select="handleSelect"
                    @hex-group-select="handleGroupSelect"
                    @open-details="handleOpenAnalysis"
                />
                <div
                    class="absolute top-4 right-4 flex align-center z-20 justify-center gap-4"
                    v-if="!viewAnalytics && !addMeasurement && !compareMode"
                >
                    <button class="bg-main rounded-md p-1 text-white hover:cursor-pointer" @click="enterCompareMode">
                        <ScaleIcon class="w-10 h-10" />
                    </button>
                    <button
                        class="text-white hover:cursor-pointer"
                        :class="[selectMult ? 'bg-light rounded-md p-1' : 'bg-main rounded-md p-1']"
                        @click="
                            selectMult = !selectMult;
                            viewAnalytics = true;
                            addMeasurement = false;
                            showLegend = false;
                        "
                    >
                        <SquaresPlusIcon class="w-10 h-10" />
                    </button>
                    <button
                        class="bg-main rounded-md p-1 text-white hover:cursor-pointer"
                        @click="
                            addMeasurement = false;
                            viewAnalytics = false;
                            showLegend = !showLegend;
                        "
                    >
                        <AdjustmentsVerticalIcon class="w-10 h-10" />
                    </button>
                </div>

                <Legend
                    v-if="showLegend"
                    class="absolute z-40 mt-1"
                    :class="legendClasses"
                    :colors="colors"
                    :scale="scale"
                    @close="handleCloseAll"
                />
            </div>

            <div class="fixed left-4 bottom-5 flex align-center z-20 justify-center gap-4">
                <button
                    class="bg-main rounded-md p-1 text-white hover:cursor-pointer"
                    @click="
                        addMeasurement = true;
                        viewAnalytics = false;
                        showLegend = false;
                    "
                    v-if="!viewAnalytics && !addMeasurement && !compareMode"
                >
                    <PlusCircleIcon class="w-10 h-10" />
                </button>
                <button
                    class="bg-main rounded-md p-1 text-white hover:cursor-pointer"
                    @click="showGlobalAnalytics"
                    v-if="!viewAnalytics && !addMeasurement && !compareMode"
                >
                    <ChartBarIcon class="w-10 h-10" />
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * MapView
 *
 * Displays the campaign banner, measurement input form, and a hex map of sample data.
 * Provides a button to add new measurements when not in adding mode.
 */
defineOptions({ name: "DashboardView" });
import { PlusCircleIcon } from "@heroicons/vue/24/outline";
import HexMap from "@/components/HexMap.vue";
import { ref, onMounted, computed, nextTick } from "vue";
import MeasurementComponent from "@/components/MeasurementComponent.vue";
import CampaignBannerComponent from "@/components/CampaignBannerComponent.vue";
import * as L from "leaflet";
import DataAnalyticsComponent from "@/components/DataAnalyticsComponent.vue";
import { asyncComputed } from "@vueuse/core";
import Legend from "../components/Legend.vue";
import { AdjustmentsVerticalIcon } from "@heroicons/vue/24/outline";
import { ChartBarIcon } from "@heroicons/vue/24/outline";
import { SquaresPlusIcon } from "@heroicons/vue/24/outline";
import { ScaleIcon } from "@heroicons/vue/24/outline";
import DataAnalyticsCompare from "@/components/DataAnalyticsCompare.vue";
import ComparisonBar from "@/components/ComparisonBar.vue";

const hexMapRef = ref<InstanceType<typeof HexMap> | null>(null);

const viewAnalytics = ref(false);
const addMeasurement = ref(false);
const showLegend = ref(false);
const selectMult = ref(false);
const campaigns = ref([]);
const hexLocation = ref<string>("");
type Location = {
    latitude: number;
    longitude: number;
};

const compareMode = ref(false);
const comparePhaseString = ref<"phase1" | "phase2" | "phase3">("phase1");
const comparePhaseNum = computed<1 | 2 | null>(() => {
    if (comparePhaseString.value === "phase1") return 1;
    if (comparePhaseString.value === "phase2") return 2;
    return null;
});
const group1WKT = ref("");
const group2WKT = ref("");
const group1HexCount = ref(0);
const group2HexCount = ref(0);
const showCompareAnalytics = ref(false);
const group1Corners = ref<Array<L.LatLng[]>>([]);
const group2Corners = ref<Array<L.LatLng[]>>([]);

/**
 * Shows the global analytics in the sidebar component.
 *
 * @returns {void}
 */
function showGlobalAnalytics() {
    hexLocation.value = "";
    viewAnalytics.value = true;
    addMeasurement.value = false;
}

/**
 * Handles the click event on a hexagon in the map.
 *
 * @returns {void}
 */
function handleHexClick() {
    addMeasurement.value = false;
}

/**
 * Handles clicking from hexagon analysis to 'see details'
 * @param location the data of the hexagon clicked
 * @returns {void}
 */
function handleOpenAnalysis(location: string) {
    hexLocation.value = location;
    viewAnalytics.value = true;
}

/**
 * Handles selecting multiple hexagons
 * @param location  the data of the hexagons clicked
 * @return {void}
 */
function handleSelect(location: string) {
    console.log(location);
    hexLocation.value = location;
    viewAnalytics.value = true;
}

/**
 * Handles the close event for the sidebar components.
 *
 * @returns {void}
 */
function handleCloseAll() {
    viewAnalytics.value = false;
    addMeasurement.value = false;
    selectMult.value = false;
    showLegend.value = false;

    // If we close from DataAnalyticsCompare, also exit compareMode
    showCompareAnalytics.value = false;
    if (compareMode.value) {
        exitCompareMode();
    }
}

/**
 * Enters compare mode, resetting all necessary states and preparing for group selection.
 *
 * @returns {void}
 */
function enterCompareMode() {
    compareMode.value = true;
    comparePhaseString.value = "phase1";
    group1WKT.value = "";
    group2WKT.value = "";
    group1HexCount.value = 0;
    group2HexCount.value = 0;
    group1Corners.value = [];
    group2Corners.value = [];
    viewAnalytics.value = false;
    addMeasurement.value = false;
    showLegend.value = false;
    selectMult.value = false;
    showCompareAnalytics.value = false;

    // **Immediately re‐enable `selectMult` so Phase 1 hex‐clicks work**
    // We use setTimeout to let Vue finish the re‐render in phase1 first.
    setTimeout(() => {
        selectMult.value = true;
    }, 30);
}

/**
 * Exits compare mode, resetting all states and clearing selections.
 *
 * @returns {void}
 */
function exitCompareMode() {
    hexMapRef.value?.phase3Highlight({ corners1: [], corners2: [] });
    compareMode.value = false;
    comparePhaseString.value = "phase1";
    group1WKT.value = "";
    group2WKT.value = "";
    group1HexCount.value = 0;
    group2HexCount.value = 0;
    showCompareAnalytics.value = false;
    selectMult.value = false;
    group1Corners.value = [];
    group2Corners.value = [];
}

/**
 * Navigates to Phase 1 of the comparison process, resetting all selections and states.
 * This function is called when the user wants to start a new comparison from scratch.
 *
 * @returns {void}
 */
function goToPhase1() {
    hexMapRef.value?.phase3Highlight({ corners1: [], corners2: [] });
    comparePhaseString.value = "phase1";
    showCompareAnalytics.value = false;
    // Clear all selections
    group1WKT.value = "";
    group2WKT.value = "";
    group1HexCount.value = 0;
    group2HexCount.value = 0;
    group1Corners.value = [];
    group2Corners.value = [];
    selectMult.value = false;
    setTimeout(() => {
        selectMult.value = true;
    }, 30);
}

/**
 * Navigates to Phase 2 of the comparison process, resetting all selections and states.
 * This function is called when the user wants to start a new comparison from scratch.
 *
 * @returns {void}
 */
function goToPhase2() {
    comparePhaseString.value = "phase2";
    selectMult.value = false;
    setTimeout(() => {
        selectMult.value = true;
    }, 30);
}

/**
 * Navigates to Phase 3 of the comparison process, showing the comparison analytics.
 * This function is called when the user has selected two groups and wants to compare them.
 *
 * @returns {void}
 */
function goToPhase3() {
    comparePhaseString.value = "phase3";
    showCompareAnalytics.value = true;

    nextTick(() => {
        // Ask HexMap to re‐draw the orange/green/yellow outlines
        hexMapRef.value?.phase3Highlight({
            corners1: group1Corners.value,
            corners2: group2Corners.value,
        });
    });
}

/**
 * Handles the selection of a group in the comparison process.
 * This function is called when the user selects a group for comparison.
 *
 * @param {Object} payload - The payload containing the WKT, phase, and corners list.
 * @returns {void}
 */
function handleGroupSelect(payload: { wkt: string; phase: number; cornersList: Array<L.LatLng[]> }) {
    if (payload.phase === 1) {
        group1WKT.value = payload.wkt;
        group1HexCount.value = (payload.wkt.match(/\(\(/g) || []).length;
        group1Corners.value = payload.cornersList;
    } else {
        group2WKT.value = payload.wkt;
        group2HexCount.value = (payload.wkt.match(/\(\(/g) || []).length;
        group2Corners.value = payload.cornersList;
    }
}

/**
 * Fetches measurements from the API and formats them for the HexMap component.
 * The data is fetched asynchronously and transformed into a format suitable for the map.
 */
type MeasurementData = {
    point: L.LatLng;
    temperature: number;
    min: number;
    max: number;
    count: number;
};
type MeasurementResponseDataPoint = {
    location: { latitude: number; longitude: number };
    avg_temperature: number;
    min_temperature: number;
    max_temperature: number;
    count: number;
};

// Fetches aggregated measurement data from the API and formats it for the HexMap component
const data = asyncComputed(async (): Promise<MeasurementData[]> => {
    const res = await fetch("/api/measurements/aggregated");

    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const data = await res.json();

    return data.measurements.map((measurement: MeasurementResponseDataPoint) => ({
        point: L.latLng(measurement.location.latitude, measurement.location.longitude),
        temperature: measurement.avg_temperature,
        min: measurement.min_temperature,
        max: measurement.max_temperature,
        count: measurement.count,
    }));
}, [] as MeasurementData[]);

// color, styling, and scale values for hexagon visualization
const colors = ref(["#3183D4", "#E0563A"]);
const scale = ref<[number, number]>([10, 40]);
const legendClasses = computed(() => ["top-[4.5rem]", "right-4", "w-72"]);

/**
 * Fetches active campaigns based on the user's location
 *
 * @param {number} lat - The user's latitude
 * @param {number} lng - The user's longitude
 * @returns {Promise<void>} A promise that resolves when the campaigns are fetched
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

// Lifecycle hook to get the user's location and fetch campaigns when the component is mounted
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

// Expose functions for documentation
defineExpose({
    /** Fetches active campaigns based on the user's location. */
    fetchCampaigns,
    /** Gets the user's location using Geolocation API or IP fallback. */
    getLocation,
    /** Fetches the user's location based on IP address. */
    getIpLocation,
});
</script>
