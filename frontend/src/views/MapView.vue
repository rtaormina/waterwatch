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
                <UButton
                    type="button"
                    aria-label="open map menu"
                    data-testid="view-button"
                    @click="firstTime = false"
                    class="flex-1 bg-main text-white justify-center text-xl px-4 py-2 rounded mr-2 hover:cursor-pointer"
                >
                    View Map
                </UButton>
            </div>
        </Modal>
    </div>
    <div class="w-full h-full flex flex-col p-0 m-0">
        <CampaignBannerComponent v-if="campaigns.length" :campaigns="campaigns" />

        <div class="w-full h-full flex flex-row">
            <div class="relative w-full h-full">
                <SideBar
                    v-model:open="showCompareAnalytics"
                    :settings="{ modal: false, overlay: false, dismissible: false }"
                    title="Compare Distributions"
                    @close="handleCloseAll"
                >
                    <template #content>
                        <DataAnalyticsCompare
                            :group1WKT="group1WKT"
                            :group2WKT="group2WKT"
                            :month="month"
                            :fromExport="false"
                        />
                    </template>
                </SideBar>
                <SideBar
                    v-model:open="viewAnalytics"
                    :settings="{ modal: false, overlay: false, dismissible: false }"
                    title="Data Analytics"
                    @close="handleCloseAll"
                >
                    <template #content>
                        <DataAnalyticsComponent :location="hexLocation" :month="month" :fromExport="false" />
                    </template>
                </SideBar>

                <SelectBar
                    v-if="selectMode || compareMode"
                    :style="
                        viewAnalytics || showCompareAnalytics
                            ? 'left: var(--container-lg); transform: none; margin-left: 2%;'
                            : ''
                    "
                    :rightButton="selectBarRight"
                    :rightButtonDisabled="selectBarRightButtonDisabled"
                    :leftButton="selectBarLeft"
                    :centerLabel="centerLabel"
                />

                <HexMap
                    ref="hexMapRef"
                    :colors="colors"
                    :data="data"
                    :selectMode="selectMode"
                    :compareMode="compareMode"
                    :activePhase="comparePhaseNum"
                    :month="month"
                    :fromExport="false"
                    @click="showLegend = false"
                    @hex-click="handleHexClick"
                    @hex-select="handleSelect"
                    @hex-group-select="handleGroupSelect"
                    @open-details="handleOpenAnalysis"
                />

                <div
                    class="flex flex-row-reverse items-center z-20 justify-center gap-4 absolute top-4 right-4"
                    :class="{ 'hidden md:block': viewAnalytics || addMeasurement || compareMode || selectMode }"
                >
                    <MapMenu :menuItems="menuItems" @open="handleOpenClose" />
                </div>

                <Legend
                    v-show="showLegend"
                    class="absolute z-40 mt-0.95 h-auto"
                    :class="legendClasses"
                    :colors="colors"
                    :fromExport="false"
                    @update="updateMapFilters"
                />
            </div>

            <div class="fixed left-4 bottom-5 flex align-center z-20 justify-center gap-4">
                <SideBar v-model:open="addMeasurement" title="Record Measurement" @close="handleCloseAll">
                    <template #content>
                        <MeasurementComponent
                            @submitMeasurement="
                                () => {
                                    refresh = !refresh;
                                    handleCloseAll();
                                }
                            "
                        />
                    </template>
                    <MenuButton
                        icon="i-heroicons-plus-circle"
                        tooltip="Add a Measurement"
                        :handler="
                            () => {
                                addMeasurement = true;
                            }
                        "
                        v-if="!viewAnalytics && !addMeasurement && !compareMode && !selectMode"
                    />
                </SideBar>
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
 * Displays the campaign banner, measurement input form, and a hex map of sample data.
 * Provides a button to add new measurements when not in adding mode.
 */
defineOptions({ name: "DashboardView" });

import { ref, onMounted, computed, nextTick } from "vue";
import { asyncComputed } from "@vueuse/core";
import axios from "axios";
import Cookies from "universal-cookie";
import * as L from "leaflet";

import CampaignBannerComponent from "../components/CampaignBannerComponent.vue";
import HexMap from "../components/HexMap.vue";
import MapMenu from "../components/MenuItems/MapMenu.vue";
import MenuButton from "../components/MenuItems/MenuButton.vue";
import Legend from "../components/MenuItems/Legend.vue";
import SelectBar from "../components/MenuItems/SelectBar.vue";
import MeasurementComponent from "../components/MeasurementComponent.vue";
import DataAnalyticsComponent from "../components/Analysis/DataAnalyticsComponent.vue";
import DataAnalyticsCompare from "../components/Analysis/DataAnalyticsCompare.vue";

const cookies = new Cookies();

const open = ref(false);
const hexMapRef = ref<InstanceType<typeof HexMap> | null>(null);
const colors = ref(["#3183D4", "#E0563A"]);
const legendClasses = computed(() => ["top-[4.5rem]", "right-4", "w-72"]);
const campaigns = ref([]);
const firstTime = ref(false);

const addMeasurement = ref(false);
const showLegend = ref(false);
const viewAnalytics = ref(false);
const hexIntermediary = ref<string>("");
const hexLocation = ref<string>("");
type Location = {
    latitude: number;
    longitude: number;
};

const selectMode = ref(false);
const count = ref(0);

const compareMode = ref(false);
const comparePhaseNum = ref<1 | 2 | null>(null);
const group1WKT = ref("");
const group2WKT = ref("");
const group1Corners = ref<Array<L.LatLng[]>>([]);
const group2Corners = ref<Array<L.LatLng[]>>([]);
const showCompareAnalytics = ref(false);

const selectBarLeft = ref({
    label: "Cancel",
    onButtonClick: exitSelectMode,
});

const selectBarRight = ref({
    label: "Select",
    onButtonClick: handleSelectContinue,
});

const centerLabel = ref("Select group 1");

const selectBarRightButtonDisabled = computed(() => {
    if (selectMode.value) return count.value <= 0;
    if (compareMode.value) return comparePhaseNum.value == 1 ? group1WKT.value === "" : group2WKT.value === "";
    return false;
});

const range = ref<number[]>([0]);
const month = ref<string>("0");
const refresh = ref(false);

const menuItems = [
    { icon: "i-heroicons-adjustments-vertical", tooltip: "Map Settings", handler: toggleLegend },
    {
        icon: "i-heroicons-chart-bar",
        tooltip: "Show Global Analytics",
        handler: showGlobalAnalytics,
        testid: "global-analytics-button",
    },
    {
        icon: "i-heroicons-squares-plus",
        tooltip: "Select Multiple Hexagons",
        handler: enterSelectMode,
        testid: "select-multiple-hexagons-button",
    },
    {
        icon: "i-heroicons-scale",
        tooltip: "Compare Hexagon Groups",
        handler: enterCompareMode,
        testid: "comparing-hexagons-button",
    },
];

/**
 * Toggles the visibility of the legend in the map view.
 */
function toggleLegend() {
    addMeasurement.value = false;
    viewAnalytics.value = false;
    showLegend.value = !showLegend.value;
}

/**
 * Shows the global analytics in the sidebar component.
 *
 * @returns {void}
 */
function showGlobalAnalytics() {
    hexLocation.value = "";

    if (viewAnalytics.value || showCompareAnalytics.value) {
        viewAnalytics.value = false;
        setTimeout(() => {
            viewAnalytics.value = true;
        }, 300);
    } else {
        viewAnalytics.value = true;
    }

    showCompareAnalytics.value = false;
    addMeasurement.value = false;
    showLegend.value = false;
    compareMode.value = false;
    selectMode.value = false;
}

// === Functions to handle select mode === //

/**
 * Enters select multiple hexagon mode, resets necessary states and prepares for hexagon selection
 *
 * @returns {void}
 */
function enterSelectMode() {
    setSelectBarProps("Cancel", exitSelectMode, "Select", handleSelectContinue, "Select Hexagons");

    viewAnalytics.value = false;
    showCompareAnalytics.value = false;

    selectMode.value = true;
    compareMode.value = false;

    addMeasurement.value = false;
    showLegend.value = false;
    count.value = 0;
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
 * Exits select multiple hexagon mode, resets necessary states
 *
 * @returns {void}
 */
function exitSelectMode() {
    selectMode.value = false;
    viewAnalytics.value = false;
    count.value = 0;
}

// === Functions to handle compare mode === //

/**
 * Enters compare mode, resetting all necessary states and preparing for group selection.
 *
 * @returns {void}
 */
function enterCompareMode() {
    setSelectBarProps("Cancel", exitCompareMode, "Next group", goToPhase2, "Select group 1");

    compareMode.value = true;
    selectMode.value = false;

    hexMapRef.value?.phase3Highlight({ corners1: [], corners2: [] });
    comparePhaseNum.value = 1;

    showCompareAnalytics.value = false;
    viewAnalytics.value = false;

    // Clear all selections
    group1WKT.value = "";
    group2WKT.value = "";
    group1Corners.value = [];
    group2Corners.value = [];
    viewAnalytics.value = false;
    addMeasurement.value = false;
    showLegend.value = false;
    showCompareAnalytics.value = false;
}

/**
 * Navigates to Phase 2 of the comparison process, resetting all selections and states.
 * This function is called when the user wants to start a new comparison from scratch.
 *
 * @returns {void}
 */
function goToPhase2() {
    setSelectBarProps("Previous group", enterCompareMode, "Compare", goToPhase3, "Select group 2");
    comparePhaseNum.value = 2;
}

/**
 * Navigates to Phase 3 of the comparison process, showing the comparison analytics.
 * This function is called when the user has selected two groups and wants to compare them.
 *
 * @returns {void}
 */
function goToPhase3() {
    setSelectBarProps("Restart", enterCompareMode, "Exit", exitCompareMode, "Comparing");

    comparePhaseNum.value = null;
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
 * Exits compare mode, resetting all states and clearing selections.
 *
 * @returns {void}
 */
function exitCompareMode() {
    hexMapRef.value?.phase3Highlight({ corners1: [], corners2: [] });
    compareMode.value = false;
    comparePhaseNum.value = null;
    group1WKT.value = "";
    group2WKT.value = "";
    showCompareAnalytics.value = false;
    selectMode.value = false;
    group1Corners.value = [];
    group2Corners.value = [];
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
        group1Corners.value = payload.cornersList;
    } else {
        group2WKT.value = payload.wkt;
        group2Corners.value = payload.cornersList;
    }
}

/**
 * Sets the properties for the select bar component.
 * @param leftLabel the label for the left button
 * @param leftButtonClick the handler for the left button click
 * @param rightLabel the label for the right button
 * @param rightButtonClick the handler for the right button click
 * @param centerLabelText the center label text
 * @returns {void}
 */
function setSelectBarProps(
    leftLabel: string,
    leftButtonClick: () => void,
    rightLabel: string,
    rightButtonClick: () => void,
    centerLabelText: string,
) {
    selectBarLeft.value = {
        label: leftLabel,
        onButtonClick: leftButtonClick,
    };

    selectBarRight.value = {
        label: rightLabel,
        onButtonClick: rightButtonClick,
    };

    centerLabel.value = centerLabelText;
}

// ======================================== //

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
    if (viewAnalytics.value || showCompareAnalytics.value) {
        viewAnalytics.value = false;
        console.log("entered");
        setTimeout(() => {
            viewAnalytics.value = true;
        }, 300);
    } else {
        viewAnalytics.value = true;
    }
}

/**
 * Handles the close event for the sidebar components.
 *
 * @returns {void}
 */
function handleCloseAll() {
    viewAnalytics.value = false;
    addMeasurement.value = false;
    selectMode.value = false;
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
    const res = await axios.post("/api/measurements/aggregated/", range.value ? { month: range.value } : {}, {
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": cookies.get("csrftoken"),
        },
    });

    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
    const data = res.data;

    return data.measurements.map((measurement: MeasurementResponseDataPoint) => ({
        point: L.latLng(measurement.location.latitude, measurement.location.longitude),
        temperature: measurement.avg_temperature,
        min: measurement.min_temperature,
        max: measurement.max_temperature,
        count: measurement.count,
    }));
}, [] as MeasurementData[]);

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
