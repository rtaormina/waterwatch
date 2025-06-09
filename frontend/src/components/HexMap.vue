<template>
    <div ref="mapElement" class="map"></div>
</template>

<script setup lang="ts">
import { createOSMLayer } from "../composables/LocationFallback";
import * as L from "leaflet";
import { createApp, onMounted, ref, useTemplateRef, watch } from "vue";
import "@asymmetrik/leaflet-d3/dist/leaflet-d3.js";
import HexAnalysis from "./Analysis/HexAnalysis.vue";

declare module "leaflet" {
    /*
     * Hexbins
     */
    interface HexbinLayer<DataType = DataPoint> extends L.Layer {
        radius(): number;
        radius(v: number): this;

        opacity(): number;
        opacity(v: number): this;

        duration(): number;
        duration(v: number): this;

        colorScaleExtent(): [number, number];
        colorScaleExtent(v: [number, number]): this;

        radiusScaleExtent(): [number, number];
        radiusScaleExtent(v: [number, number]): this;

        colorRange(): string[];
        colorRange(v: string[]): this;

        radiusRange(): number[];
        radiusRange(v: number[]): this;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        colorScale(): any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        colorScale(v: any): this;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        radiusScale(): any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        radiusScale(v: any): this;

        lng(): (d: DataType) => number;
        lng(v: (d: DataType) => number): this;

        lat(): (d: DataType) => number;
        lat(v: (d: DataType) => number): this;

        colorValue(): (d: { o: DataType }[]) => number;
        colorValue(v: (d: { o: DataType }[]) => number): this;

        radiusValue(): (d: DataType) => number;
        radiusValue(v: (d: DataType) => number): this;

        fill(): (d: DataType) => string;
        fill(v: (d: DataType) => string): this;

        data(): DataType[];
        data(v: DataType[]): this;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dispatch(): any;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        hoverHandler(): any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        hoverHandler(v: any): this;

        getLatLngs(): L.LatLng[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        toGeoJSON(): any[];

        redraw(): void;
    }

    interface HexbinLayerConfig {
        radius?: number;
        opacity?: number;
        duration?: number;

        colorScaleExtent?: [number, number];
        radiusScaleExtent?: [number, number];
        colorRange?: string[];
        radiusRange?: [number, number];

        pointerEvents?: string;
    }

    function hexbinLayer(options?: HexbinLayerConfig): HexbinLayer;
}

let map: L.Map;
const mapElement = useTemplateRef("mapElement");
const layer = createOSMLayer({ noWrap: true });

// type for each incoming “measurement” point
type DataPoint = {
    point: L.LatLng;
    temperature: number;
    min: number;
    max: number;
    count: number;
};

const props = defineProps<{
    center?: L.LatLng;
    data: DataPoint[]; // this will be unwrapped automatically
    colors: string[];
    colorScale: [number, number];
    selectMult: boolean;
    colorByTemp: boolean;
    compareMode: boolean;
    activePhase: 1 | 2 | null;
}>();

// default center if none is passed
const center = props.center ?? L.latLng(51.999, 4.3737);

const hexbinOptions: L.HexbinLayerConfig = {
    radius: 30,
    opacity: 0.3,
    colorRange: props.colors,
    colorScaleExtent: props.colorScale,
    radiusRange: [4, 30],
};

const hexbinLayer: L.HexbinLayer = L.hexbinLayer(hexbinOptions);
hexbinLayer.lat((d: DataPoint) => d.point.lat);
hexbinLayer.lng((d: DataPoint) => d.point.lng);
hexbinLayer.colorValue((d) => {
    const color = props.colorByTemp ? d.map((v) => v.o.temperature).reduce((a, b) => a + b, 0) / d.length : d.length;
    return color;
});

const selectedPhase1 = ref<Array<{ wkt: string; corners: L.LatLng[]; layer: L.Polygon }>>([]);
const selectedPhase2 = ref<Array<{ wkt: string; corners: L.LatLng[]; layer: L.Polygon }>>([]);
const selected = ref<Array<{ wkt: string; corners: L.LatLng[]; layer: L.Polygon }>>([]);

const phase3Layers = ref<L.Polygon[]>([]);

const emit = defineEmits<{
    (e: "hex-click", d: string): void;
    (e: "open-details", d: string): void;
    (e: "hex-select", d: string): void;
    (
        e: "hex-group-select",
        params: {
            wkt: string;
            phase: number;
            cornersList: Array<L.LatLng[]>;
        },
    ): void;
}>();

/**
 * Calculates the corners of a hexagon given its center and radius.
 * @param centerPoint - The center point of the hexagon with latitude and longitude.
 * @param radius - The radius of the hexagon.
 * @param toLatLng - Function to convert a point of [latitude, longitude] to a Leaflet LatLng object.
 * @returns An array of six LatLng objects representing the corners of the hexagon.
 */
function getHexagonCorners(
    centerPoint: { lat: number; lng: number },
    radius: number,
    toLatLng: (point: [number, number]) => L.LatLng,
): [L.LatLng, L.LatLng, L.LatLng, L.LatLng, L.LatLng, L.LatLng] {
    const corners = [null, null, null, null, null, null] as unknown as [
        L.LatLng,
        L.LatLng,
        L.LatLng,
        L.LatLng,
        L.LatLng,
        L.LatLng,
    ];
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * (i - 0.5);
        const latOffset = radius * Math.cos(angle);
        const lngOffset = radius * Math.sin(angle);
        const corner: [number, number] = [centerPoint.lat + latOffset, centerPoint.lng + lngOffset];
        corners[i] = toLatLng(corner);
    }
    return corners;
}

/**
 * Initializes the Leaflet map and sets up event listeners.
 * This function is called when the component is mounted.
 */
onMounted(() => {
    // Check if the mapElement is properly mounted
    if (!mapElement.value) {
        throw new Error("mapElement is not defined");
    }

    // Create the map instance
    map = L.map(mapElement.value, {
        center: center,
        zoom: 1,
        maxZoom: 16,
        minZoom: 3,
    });

    // On zoom start, close any open popups and clear selections
    map.on("zoomstart", () => {
        map.closePopup();
        if (!props.compareMode) {
            clearSelection();
        } else if (props.compareMode && (props.activePhase === 1 || props.activePhase === 2)) {
            clearSelection();
            emit("hex-group-select", { wkt: "", phase: props.activePhase, cornersList: [] });
        }
    });

    // Set max bounds to prevent panning too far
    map.setMaxBounds(
        L.latLngBounds([
            [-90, -200],
            [90, 200],
        ]),
    );
    layer.addTo(map);
    hexbinLayer.addTo(map);

    // **Initially set the data** using props.data (which Vue has already unwrapped)
    hexbinLayer.data(props.data);

    // Whenever props.data changes (the asyncComputed finally resolves), re-set it:
    watch(
        () => props.data,
        (newData) => {
            hexbinLayer.data(newData);
        },
    );

    /**
     * Highlights a hexagon on the map.
     *
     * @param corners The corners of the hexagon.
     * @param color The color to use for the highlight.
     * @return A Leaflet polygon representing the highlighted hexagon.
     */
    function highlightHex(corners: L.LatLng[], color: string): L.Polygon {
        return L.polygon(corners, {
            color,
            weight: 4,
            fill: false,
            dashArray: "4 4",
        }).addTo(map);
    }

    /**
     * Clears all selected polygons from the map and resets the selection arrays.
     * This is used to clear selections when switching phases or modes.
     *
     * @return {void}
     */
    function clearSelection() {
        // Remove any polygons from all three arrays (phase1, phase2, normal mode)
        selectedPhase1.value.forEach((s) => {
            map.removeLayer(s.layer as unknown as L.Layer);
        });
        selectedPhase2.value.forEach((s) => {
            map.removeLayer(s.layer as unknown as L.Layer);
        });
        selected.value.forEach((s) => {
            map.removeLayer(s.layer as unknown as L.Layer);
        });

        // Then empty them
        selectedPhase1.value.length = 0;
        selectedPhase2.value.length = 0;
        selected.value.length = 0;

        phase3Layers.value.forEach((poly) => {
            map.removeLayer(poly as unknown as L.Layer);
        });
        phase3Layers.value.length = 0;
    }

    // Watch for changes in compareMode and activePhase to clear selections
    watch(
        () => props.compareMode,
        (newVal, oldVal) => {
            if (newVal !== oldVal) {
                clearSelection();
                map.closePopup();
            }
        },
    );

    // If compareMode is true and activePhase changes, clear selections
    watch(
        () => props.activePhase,
        (newPhase, oldPhase) => {
            if (props.compareMode && newPhase !== oldPhase) {
                clearSelection();
            }
        },
    );

    /**
     * Converts an array of WKT polygons to a single MultiPolygon WKT string.
     *
     * @param polygons - An array of objects, each containing a WKT string for a polygon.
     * @returns A MultiPolygon WKT string or an empty string if the input is invalid.
     */
    function wktsToMultiPolygon(polygons: Array<{ wkt: string }>): string {
        if (!Array.isArray(polygons) || polygons.length === 0) {
            return "";
        }

        // 1) For each sub‐polygon, strip off "POLYGON((" and "))", leaving "x1 y1, x2 y2, …"
        const listOfInner = polygons.map((p) =>
            p.wkt
                .replace(/^\s*POLYGON\s*\(\(\s*/, "")
                .replace(/\)\)\s*$/, "")
                .trim(),
        );

        // 2) Wrap each in exactly two levels of parentheses, then join with commas
        const wrapped = listOfInner.map((coords) => `((${coords}))`).join(",");

        // 3) Now “wrapped” is like "((…)),((…)),…", so this is guaranteed to be valid:
        return `MULTIPOLYGON(${wrapped})`;
    }

    // Set up the click handler for hexbinLayer
    hexbinLayer.dispatch().on("click", function (event: MouseEvent, d: undefined[] & { x: number; y: number }) {
        const centerPoint = { lat: d.x, lng: d.y };
        const radius = hexbinLayer.radius();

        const corners = getHexagonCorners(centerPoint, radius, (point: [number, number]) =>
            map.layerPointToLatLng(point),
        );

        /**
         * Converts a GeoJSON polygon to a WKT polygon.
         *
         * @param geometry The GeoJSON polygon geometry.
         * @returns The WKT representation of the polygon.
         */
        function geoJsonToWktPolygon(geometry: { coordinates: number[][][] }) {
            const coords = geometry.coordinates[0].map(([lng, lat]) => `${lng} ${lat}`).join(", ");
            return `POLYGON((${coords}))`;
        }

        // Convert the corners to a GeoJSON polygon and then to WKT
        const boundingGeometry = (L.polygon(corners) as L.Polygon).toGeoJSON().geometry as {
            coordinates: number[][][];
        };
        const wkt = geoJsonToWktPolygon(boundingGeometry);

        // If we are in compareMode and in phase 3, do nothing
        if (props.compareMode && props.activePhase === null) {
            return;
        }

        // If we are in compareMode AND activePhase is 1 or 2, toggle that group’s selection
        if (props.compareMode && (props.activePhase === 1 || props.activePhase === 2)) {
            const which = props.activePhase === 1 ? selectedPhase1.value : selectedPhase2.value;
            const idx = which.findIndex((s) => s.wkt === wkt);

            if (idx >= 0) {
                map.removeLayer(which[idx].layer as unknown as L.Layer);
                which.splice(idx, 1);
            } else {
                const poly = highlightHex(corners, props.activePhase === 1 ? "steelblue" : "crimson");
                which.push({ wkt, corners, layer: poly });
            }

            const allSelectedThisPhase = (props.activePhase === 1 ? selectedPhase1.value : selectedPhase2.value).map(
                (s) => ({ wkt: s.wkt }),
            );

            const multi = wktsToMultiPolygon(allSelectedThisPhase);
            const cornersList = (props.activePhase === 1 ? selectedPhase1.value : selectedPhase2.value).map(
                (s) => s.corners,
            );

            emit("hex-group-select", {
                wkt: multi,
                phase: props.activePhase!,
                cornersList,
            });
            return;
        }

        // If we are not in compareMode, clear the selection
        if (!props.selectMult) {
            clearSelection();
        }
        // If we are in selectMult mode, we toggle the selection
        const idx2 = selected.value.findIndex((s) => s.wkt === wkt);
        if (idx2 >= 0) {
            map.removeLayer(selected.value[idx2].layer as unknown as L.Layer);
            selected.value.splice(idx2, 1);
        } else {
            const layer = highlightHex(corners, "orange");
            selected.value.push({ wkt, corners, layer });
        }
        // If we are in selectMult mode, we emit the MultiPolygon WKT
        if (!props.selectMult) {
            const layerPoint = L.point(d.x, d.y);
            const latlng = map.layerPointToLatLng(layerPoint);
            const container = document.createElement("div");
            const vm = createApp(HexAnalysis, {
                points: d,
                /**
                 * Opens the details popup for the selected hexagon.
                 *
                 * @returns {void}
                 */
                onOpenDetails: () => {
                    emit("open-details", wkt);
                },
                /**
                 * Closes the popup when the close button is clicked.
                 *
                 * @returns {void}
                 */
                onClose: () => {
                    map.closePopup();
                },
            });
            vm.mount(container);
            const popup = L.popup({
                offset: [0, -hexbinLayer.radius()],
                autoClose: true,
                closeOnClick: false,
            })
                .setLatLng(latlng)
                .setContent(container)
                .openOn(map);
            popup.on("remove", () => vm.unmount());
        }
        // If we are in selectMult mode, we emit the MultiPolygon WKT, else we emit the single WKT
        if (props.selectMult) {
            const allWkts = wktsToMultiPolygon(selected.value);
            emit("hex-select", allWkts);
        } else {
            emit("hex-click", wkt);
        }
    });

    // Watch for changes in selectMult to clear selections if it becomes false
    watch(
        () => props.selectMult,
        (newVal) => {
            if (!newVal) {
                clearSelection();
            } else {
                map.closePopup();
            }
        },
    );
});

/**
 * Draws highlights for Phase 3 comparisons.
 *
 * @param params The parameters for the highlights.
 */
function drawPhase3Highlights(params: { corners1: Array<L.LatLng[]>; corners2: Array<L.LatLng[]> }) {
    // 1) Remove any existing Phase 3 polygons
    phase3Layers.value.forEach((poly) => {
        map.removeLayer(poly as unknown as L.Layer);
    });
    phase3Layers.value.length = 0;

    const { corners1, corners2 } = params;
    // If both are empty, we’ve effectively “cleared” Phase 3, so stop here
    if (corners1.length === 0 && corners2.length === 0) {
        return;
    }

    // 2) Compute “only1”, “only2”, “shared”
    const shared: Array<L.LatLng[]> = [];
    const only1: Array<L.LatLng[]> = [];
    const only2: Array<L.LatLng[]> = [];

    /**
     * Generates a unique key for a set of corner points.
     *
     * @param c The array of corner points.
     * @returns {string} The unique key representing the corner points.
     */
    function cornersKey(c: L.LatLng[]) {
        return c.map((pt) => `${pt.lat.toFixed(5)},${pt.lng.toFixed(5)}`).join("|");
    }

    const map1 = new Map<string, L.LatLng[]>();
    corners1.forEach((c) => map1.set(cornersKey(c), c));
    const map2 = new Map<string, L.LatLng[]>();
    corners2.forEach((c) => map2.set(cornersKey(c), c));

    for (const [key, c] of map1) {
        if (map2.has(key)) {
            shared.push(c);
        } else {
            only1.push(c);
        }
    }
    for (const [key, c] of map2) {
        if (!map1.has(key)) {
            only2.push(c);
        }
    }

    // 3) Draw “only1” in steelblue, record layer in phase3Layers
    only1.forEach((c) => {
        const poly = L.polygon(c, {
            color: "steelblue",
            weight: 4,
            fill: false,
            dashArray: "4 4",
        }).addTo(map);
        phase3Layers.value.push(poly);
    });

    // 4) Draw “only2” in crimson, record it
    only2.forEach((c) => {
        const poly = L.polygon(c, {
            color: "crimson",
            weight: 4,
            fill: false,
            dashArray: "4 4",
        }).addTo(map);
        phase3Layers.value.push(poly);
    });

    // 5) Draw “shared” in purple on top, record it
    shared.forEach((c) => {
        const poly = L.polygon(c, {
            color: "#914B78",
            weight: 4,
            fill: false,
            dashArray: "4 4",
        }).addTo(map);
        phase3Layers.value.push(poly);
    });
}

// Refresh the color scale
watch(
    () => props.colorScale,
    (newVal) => {
        hexbinLayer.colorScaleExtent(newVal);
        hexbinLayer.redraw();
    },
    { immediate: true },
);

// Expose the drawPhase3Highlights function so it can be called from outside
defineExpose({
    phase3Highlight: drawPhase3Highlights,
});
</script>

<style scoped>
.map {
    height: 100%;
    width: 100%;
    z-index: 0;
}
</style>
