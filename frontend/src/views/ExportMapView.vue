<template>
    <div class="w-full h-full flex flex-col p-0 m-0">
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
                <ComparisonBar
                    v-if="compareMode"
                    :style="showCompareAnalytics ? 'left: var(--container-lg); transform: none; margin-left: 2%;' : ''"
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
                    v-if="selectMode"
                    :style="viewAnalytics ? 'left: var(--container-lg); transform: none; margin-left: 2%;' : ''"
                    :count="count"
                    @cancel-select="exitSelectMode"
                    @select="handleSelectContinue"
                />
                <HexMap
                    ref="hexMapRef"
                    :colors="colors"
                    :data="data"
                    :selectMult="selectMult && !compareMode"
                    :compareMode="compareMode"
                    :activePhase="comparePhaseNum"
                    :month="month"
                    :fromExport="true"
                    @click="showLegend = false"
                    @hex-click="handleHexClick"
                    @hex-select="handleSelect"
                    @hex-group-select="handleGroupSelect"
                    @open-details="handleOpenAnalysis"
                />

                <div class="flex flex-row-reverse items-center z-20 justify-center gap-4 absolute top-4 right-4">
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
                    <button class="bg-main rounded-md p-1 text-white hover:cursor-pointer" @click="enterCompareMode">
                        <ScaleIcon class="w-10 h-10" />
                    </button>
                    <button class="bg-main rounded-md p-1 text-white hover:cursor-pointer" @click="enterSelectMode">
                        <SquaresPlusIcon class="w-10 h-10" />
                    </button>
                    <button class="bg-main rounded-md p-1 text-white hover:cursor-pointer" @click="returnToExport">
                        <div class="flex items-center">
                            <ChevronLeftIcon class="w-10 h-10" />
                            <span class="leading-none mr-2 whitespace-nowrap text-2xl">Go Back</span>
                        </div>
                    </button>
                </div>

                <Legend
                    v-show="showLegend"
                    class="absolute z-40 mt-0.95 h-auto"
                    :class="legendClasses"
                    :colors="colors"
                    :fromExport="true"
                    @update="updateMapFilters"
                />
            </div>
        </div>
    </div>
</template>

<style>
@media (max-height: 500px), (max-width: 768px) and (orientation: landscape) {
    .analytics-panel {
        width: 100% !important;
    }
}
</style>

<script setup lang="ts">
/**
 * ExportMapView
 *
 * Displays the map from the data gathered by the researchers
 */
defineOptions({ name: "DashboardView" });
import HexMap from "../components/HexMap.vue";
import { ref, computed, nextTick } from "vue";
import * as L from "leaflet";
import DataAnalyticsComponent from "../components/Analysis/DataAnalyticsComponent.vue";
import { asyncComputed } from "@vueuse/core";
import Legend from "../components/MenuItems/Legend.vue";
import { ScaleIcon, AdjustmentsVerticalIcon, SquaresPlusIcon, ChevronLeftIcon } from "@heroicons/vue/24/outline";
import DataAnalyticsCompare from "../components/Analysis/DataAnalyticsCompare.vue";
import ComparisonBar from "../components/Analysis/ComparisonBar.vue";
import SelectBar from "../components/Analysis/SelectBar.vue";
import { useRouter } from "vue-router";
import { useExportStore } from "../stores/ExportStore";
import Cookies from "universal-cookie";
import { flattenSearchParams } from "../composables/Export/useSearch";
import axios from "axios";

const router = useRouter();
const exportStore = useExportStore();
const cookies = new Cookies();

const hexMapRef = ref<InstanceType<typeof HexMap> | null>(null);

const viewAnalytics = ref(false);
const addMeasurement = ref(false);
const showLegend = ref(false);
const selectMult = ref(false);
const hexIntermediary = ref<string>("");
const hexLocation = ref<string>("");

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
const month = ref<string>("1,2,3,4,5,6,7,8,9,10,11,12");

// color, styling, and scale values for hexagon visualization
const colors = ref(["#3183D4", "#E0563A"]);
const legendClasses = computed(() => ["top-[4.5rem]", "right-4", "w-72"]);

/**
 * Returns to the export view, resetting all states and closing any open components.
 */
function returnToExport() {
    router.push({ name: "Export", query: { fromMap: "1" } });
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
    const filters = JSON.parse(JSON.stringify(exportStore.filters));
    const bodyData = {
        ...flattenSearchParams(filters),
        month: month.value,
        format: "map-format", // Add format to the body
    };

    const res = await axios.post("/api/measurements/search/", bodyData, {
        headers: {
            "X-CSRFToken": cookies.get("csrftoken"),
            "Content-Type": "application/json",
        },
        withCredentials: true,
    });

    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
    const data = res.data;

    const formated = data.measurements.map((measurement: MeasurementResponseDataPoint) => ({
        point: L.latLng(measurement.location.latitude, measurement.location.longitude),
        temperature: measurement.avg_temperature,
        min: measurement.min_temperature,
        max: measurement.max_temperature,
        count: measurement.count,
    }));

    return formated;
}, [] as MeasurementData[]);
</script>
