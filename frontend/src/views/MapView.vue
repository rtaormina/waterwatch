<template>
    <div>
        <Modal data-testid="modal" :visible="firstTime" @close="firstTime = false">
            <h2 class="text-lg font-semibold mb-4">Welcome to the WATERWATCH Map!</h2>
            <p>
                View local water quality trends by selecting hexagons or record a measurement by pressing the plus
                button in the bottom left corner. To view global analytics, select the bar chart icon in the bottom left
                corner. For an in-depth tutorial on using the website, visit
                <router-link
                    to="/tutorial"
                    @click="firstTime = false"
                    class="underline text-primary hover:text-secondary"
                >
                    Tutorial
                </router-link>
                .
            </p>
            <div class="flex items-center mt-4 gap-2">
                <button
                    type="button"
                    aria-label="open map menu"
                    data-testid="view-button"
                    @click="firstTime = false"
                    class="flex-1 bg-main text-white px-4 py-2 rounded mr-2 hover:bg-primary-light hover:cursor-pointer"
                >
                    View Map
                </button>
            </div>
        </Modal>
    </div>
    <div class="w-full h-full flex flex-col p-0 m-0">
        <CampaignBannerComponent v-if="campaigns.length" :campaigns="campaigns" class="bg-white" />

        <div class="w-full h-full flex flex-row">
            <div
                v-if="viewAnalytics || addMeasurement || showCompareAnalytics"
                class="analytics-panel left-0 top-19 md:top-0 bottom-0 md:bottom-auto w-screen md:w-3/5 md:min-w-[400px] fixed md:relative h-[calc(100vh-64px)] md:h-auto overflow-y-auto md:overflow-visible bg-default z-10"
            >
                <MeasurementComponent
                    v-if="addMeasurement"
                    @close="handleCloseAll"
                    @submitMeasurement="refresh = !refresh"
                />
                <DataAnalyticsComponent
                    v-if="viewAnalytics"
                    :location="hexLocation"
                    :month="month"
                    @close="handleCloseAll"
                />

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
                <SelectBar
                    v-if="selectMode"
                    :count="count"
                    @cancel-select="exitSelectMode"
                    @select="handleSelectContinue"
                />
                <HexMap
                    ref="hexMapRef"
                    :colors="colors"
                    :data="data"
                    :colorScale="scale"
                    :selectMult="selectMult && !compareMode"
                    :compareMode="compareMode"
                    :activePhase="comparePhaseNum"
                    :colorByTemp="colorByTemp"
                    @click="showLegend = false"
                    @hex-click="handleHexClick"
                    @hex-select="handleSelect"
                    @hex-group-select="handleGroupSelect"
                    @open-details="handleOpenAnalysis"
                />

                <div
                    class="flex flex-row-reverse items-center z-20 justify-center gap-4 absolute top-4 right-4"
                    v-if="!viewAnalytics && !addMeasurement && !compareMode && !selectMode"
                >
                    <MapMenu
                        :selectMult="selectMult"
                        @open="handleOpenClose"
                        @enter-compare="enterCompareMode"
                        @enter-select="enterSelectMode"
                        @toggle-legend="
                            () => {
                                addMeasurement = false;
                                viewAnalytics = false;
                                showLegend = !showLegend;
                            }
                        "
                        @show-global="showGlobalAnalytics"
                    />
                </div>

                <Legend
                    v-show="showLegend"
                    class="absolute z-40 mt-0.95 h-auto"
                    :class="legendClasses"
                    :colors="colors"
                    :scale="scale"
                    :colorByTemp="colorByTemp"
                    @close="handleCloseAll"
                    @switch="handleSwitch"
                    @update="updateMapFilters"
                />
            </div>

            <div class="fixed left-4 bottom-5 flex align-center z-20 justify-center gap-4">
                <UTooltip :delay-duration="0" text="Add a Measurement">
                    <button
                        class="bg-main rounded-md p-1 text-white hover:cursor-pointer"
                        @click="
                            addMeasurement = true;
                            viewAnalytics = false;
                            showLegend = false;
                        "
                        type="button"
                        aria-label="add measurement"
                        v-if="!viewAnalytics && !addMeasurement && !compareMode && !selectMode"
                    >
                        <PlusCircleIcon class="w-10 h-10" aria-label="add measurement" />
                    </button>
                </UTooltip>
            </div>
        </div>
    </div>
</template>

<style>
@media (max-width: 768px) and (orientation: landscape) {
    .analytics-panel {
        width: 100% !important;
    }
}
</style>

<script setup lang="ts">
/**
 * MapView
 *
 * Displays the campaign banner, measurement input form, and a hex map of sample data.
 * Provides a button to add new measurements when not in adding mode.
 */
defineOptions({ name: "DashboardView" });
import { PlusCircleIcon } from "@heroicons/vue/24/outline";
import HexMap from "../components/HexMap.vue";
import { ref, onMounted, computed, nextTick } from "vue";
import MeasurementComponent from "../components/MeasurementComponent.vue";
import CampaignBannerComponent from "../components/CampaignBannerComponent.vue";
import * as L from "leaflet";
import DataAnalyticsComponent from "../components/Analysis/DataAnalyticsComponent.vue";
import { asyncComputed } from "@vueuse/core";
import Legend from "../components/Legend.vue";
import DataAnalyticsCompare from "../components/Analysis/DataAnalyticsCompare.vue";
import ComparisonBar from "../components/Analysis/ComparisonBar.vue";
import SelectBar from "../components/Analysis/SelectBar.vue";
import MapMenu from "../components/MapMenu.vue";

const open = ref(false);
const hexMapRef = ref<InstanceType<typeof HexMap> | null>(null);

const firstTime = ref(false);
const viewAnalytics = ref(false);
const addMeasurement = ref(false);
const showLegend = ref(false);
const selectMult = ref(false);
const colorByTemp = ref(true);
const campaigns = ref([]);
const hexIntermediary = ref<string>("");
const hexLocation = ref<string>("");
type Location = {
    latitude: number;
    longitude: number;
};

const compareMode = ref(false);
const selectMode = ref(false);
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
const count = ref(0);
const showCompareAnalytics = ref(false);
const group1Corners = ref<Array<L.LatLng[]>>([]);
const group2Corners = ref<Array<L.LatLng[]>>([]);
const range = ref<number[]>([0]);
const month = ref<string>("0");
const refresh = ref(false);

/**
 * Handle open and close of map menu
 *
 * @return {void}
 */
function handleOpenClose() {
    if (open.value) {
        showLegend.value = false;
        open.value = false;
    } else {
        showLegend.value = false;
        open.value = true;
    }
}

/**
 * Handles filtering observations by time
 *
 * @param timeRange the time range of measurements to include in the hexmap
 * @returns {void}
 */
function updateMapFilters(timeRange: number[]) {
    range.value = timeRange;
    month.value = "";
    for (let i = 0; i < range.value.length; i++) {
        month.value += `${range.value[i]},`;
    }
    month.value = month.value.substring(0, month.value.length - 1);
}

/**
 * Shows the global analytics in the sidebar component.
 *
 * @returns {void}
 */
function showGlobalAnalytics() {
    hexLocation.value = "";
    viewAnalytics.value = true;
    addMeasurement.value = false;
    showLegend.value = false;
}

/**
 * Handles the switch between temperature and count color modes in the legend.
 */
function handleSwitch() {
    colorByTemp.value = !colorByTemp.value;
    scale.value = colorByTemp.value ? [10, 40] : [0, 50];
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
    count.value = (location.match(/\(\(/g) || []).length;
    hexIntermediary.value = location;
}

/**
 * Handles submitting selected hexagons to see analysis
 *
 * @return {void}
 */
function handleSelectContinue() {
    viewAnalytics.value = true;
    hexLocation.value = hexIntermediary.value;
}

/**
 * Enters select multiple hexagon mode, resets necessary states and prepares for hexagon selection
 *
 * @returns {void}
 */
function enterSelectMode() {
    selectMode.value = true;
    selectMult.value = true;
    addMeasurement.value = false;
    showLegend.value = false;
    compareMode.value = false;
    count.value = 0;
}

/**
 * Exits select multiple hexagon mode, resets necessary states
 *
 * @returns {void}
 */
function exitSelectMode() {
    selectMode.value = false;
    viewAnalytics.value = false;
    selectMult.value = false;
    count.value = 0;
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
    } else if (selectMode.value) {
        exitSelectMode();
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
    refresh.value = !refresh.value; // Trigger re-fetching when refresh changes
    const res = await fetch(`/api/measurements/aggregated?month=${range.value}`);

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
    /**
     * Display modal only to firsttime users through saving value in localStorage
     */
    const already = localStorage.getItem("mapViewVisited");
    if (!already) {
        firstTime.value = true;
        localStorage.setItem("mapViewVisited", "true");
    } else {
        firstTime.value = false;
    }
    /**
     * Get location for campaigns
     */
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
