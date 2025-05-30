<template>
    <div ref="mapElement" class="map"></div>
</template>

<script setup lang="ts">
import { createOSMLayer } from "@/composables/LocationFallback";
import * as L from "leaflet";
import { createApp, onMounted, useTemplateRef, watch } from "vue";
import "@asymmetrik/leaflet-d3/dist/leaflet-d3.js";
import HexAnalysis from "./HexAnalysis.vue";

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

const mapElement = useTemplateRef("mapElement");

const layer = createOSMLayer({ noWrap: true });

type DataPoint = {
    point: L.LatLng;
    temperature: number;
    min: number;
    max: number;
    count: number;
};

const {
    center = L.latLng(51.999, 4.3737),
    data,
    colors,
    colorScale,
    selectMult,
} = defineProps<{
    center?: L.LatLng;
    data: DataPoint[];
    colors: string[];
    colorScale: [number, number];
    selectMult: boolean;
}>();

const hexbinOptions: L.HexbinLayerConfig = {
    radius: 30,
    opacity: 0.3,
    colorRange: colors,
    colorScaleExtent: colorScale,
    radiusRange: [4, 30],
};

const hexbinLayer: L.HexbinLayer = L.hexbinLayer(hexbinOptions);

hexbinLayer.lat((d: DataPoint) => d.point.lat);
hexbinLayer.lng((d: DataPoint) => d.point.lng);
hexbinLayer.colorValue((d) => {
    const color = d.map((v) => v.o.temperature).reduce((a, b) => a + b, 0) / d.length;
    return color;
});

// Set up events
const emit = defineEmits<{
    (e: "hex-click", d: string): void;
    (e: "open-details", d: string): void;
    (e: "hex-select", d: string): void;
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
        const angle = (Math.PI / 3) * (i - 0.5); // Offset by 30 degrees
        const latOffset = radius * Math.cos(angle);
        const lngOffset = radius * Math.sin(angle);

        const corner: [number, number] = [centerPoint.lat + latOffset, centerPoint.lng + lngOffset];
        corners[i] = toLatLng(corner);
    }
    return corners;
}

onMounted(() => {
    // Check if the mapElement is properly mounted
    if (!mapElement.value) {
        throw new Error("mapElement is not defined");
    }

    // Initialize the map
    const map = L.map(mapElement.value, {
        center: center,
        zoom: 1,
        maxZoom: 16,
        minZoom: 3,
    });
    map.on("zoomstart", () => {
        map.closePopup();
        clearSelection();
    });
    map.setMaxBounds(
        L.latLngBounds([
            [-90, -200],
            [90, 200],
        ]),
    );
    layer.addTo(map);
    hexbinLayer.addTo(map);
    hexbinLayer.data(data);
    watch(
        () => data,
        (newData) => hexbinLayer.data(newData),
    );
    const selected: {
        wkt: string;
        corners: L.LatLng[];
        layer: L.Polygon;
    }[] = [];

    /**
     * Returns true if two hexagons are adjacent (sides are touching)
     * @param cornersA corners of the first hexagon compare
     * @param cornersB corners of second hexagon to compare
     * @return {boolean} true if adjacent, false if not
     */
    function isAdjacent(cornersA: L.LatLng[], cornersB: L.LatLng[]): boolean {
        let shared = 0;
        for (const a of cornersA) {
            for (const b of cornersB) {
                if (a.equals(b)) shared += 1;
                if (shared >= 2) return true;
            }
        }
        return false;
    }
    /**
     * Highlights selected hexagons
     * @param corners corners of WKT polygons to be highlighted
     * @return {polygon} highlighted polygon to overlay
     */
    function highlightHex(corners: L.LatLng[]): L.Polygon {
        return L.polygon(corners, {
            color: "orange",
            weight: 5,
            fill: false,
            dashArray: "4 4",
        }).addTo(map);
    }

    /**
     * Clears the highlighted/selected hexagons
     */
    function clearSelection() {
        selected.forEach((s) => map.removeLayer(s.layer));
        selected.length = 0;
    }

    /**
     * Converts an array of WKT polygons to a MultiPolygon
     * @param polygons Array of objects containing WKT polygon strings
     * @returns WKT MultiPolygon string
     */
    function wktsToMultiPolygon(polygons: Array<{ wkt: string }>): string {
        if (!Array.isArray(polygons) || polygons.length === 0) {
            throw new Error("Input must be a non-empty array of polygon objects");
        }
        const geometries = polygons.map((polygon) =>
            polygon.wkt.replace(/^\s*POLYGON\s*\(\(\s*/, "").replace(/\)\)\s*$/, ""),
        );

        const inner = geometries.map((r) => `((${r}))`).join(",");
        console.log(inner);

        return `MULTIPOLYGON(${inner})`;
    }

    hexbinLayer
        .dispatch()
        .on("click", function (event: MouseEvent, d: undefined[] & { x: number; y: number }, i: unknown) {
            const centerPoint = { lat: d.x, lng: d.y };
            const radius = hexbinLayer.radius();

            const corners = getHexagonCorners(
                centerPoint,
                radius,
                (point: [number, number]): L.LatLng => map.layerPointToLatLng(point),
            );

            const middlePoint = map.layerPointToLatLng([centerPoint.lng, centerPoint.lat]);

            console.log({
                type: "click",
                event: event,
                d: d,
                index: i,
                coordinates: middlePoint,
                corners: corners,
            });

            /**
             * Converts GeoJSON polygon geometry to WKT format.
             *
             * @param {number[][][]} geometry The GeoJSON polygon
             * @returns {string} The WKT representation of the polygon
             */
            function geoJsonToWktPolygon(geometry: { coordinates: number[][][] }) {
                // GeoJSON coordinates: [[[lng, lat], [lng, lat], ...]]
                const coords = geometry.coordinates[0].map(([lng, lat]) => `${lng} ${lat}`).join(", ");
                return `POLYGON((${coords}))`;
            }

            const boundingGeometry = L.polygon(corners).toGeoJSON().geometry as { coordinates: number[][][] };
            console.log("Bounding Geometry:", boundingGeometry);
            const wkt = geoJsonToWktPolygon(boundingGeometry);

            if (selectMult && selected.length > 0) {
                const anyAdjacent = selected.some((sel) => isAdjacent(sel.corners, corners));
                if (!anyAdjacent) {
                    console.warn("Hex is not adjacent to current selection, ignoring.");
                    return;
                }
            }

            const layerPoint = L.point(d.x, d.y);
            const latlng = map.layerPointToLatLng(layerPoint);
            const container = document.createElement("div");

            const vm = createApp(HexAnalysis, {
                points: d,
                /**
                 * Function passed to the popup that sends an emit with the hexagon location info
                 */
                onOpenDetails: () => {
                    emit("open-details", geoJsonToWktPolygon(boundingGeometry));
                },
                /**
                 * Function passed to the popup that closes it when x is selected
                 */
                onClose: () => {
                    map.closePopup();
                },
            });

            vm.mount(container);

            if (!selectMult) {
                clearSelection();
            }
            const idx = selected.findIndex((s) => s.wkt === wkt);
            if (idx >= 0) {
                map.removeLayer(selected[idx].layer);
                selected.splice(idx, 1);
            } else {
                const layer = highlightHex(corners);
                selected.push({ wkt, corners, layer });
            }

            if (!selectMult) {
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

            if (selectMult) {
                emit("hex-select", wktsToMultiPolygon(selected));
            } else {
                emit("hex-click", geoJsonToWktPolygon(boundingGeometry));
            }
        });
    watch(
        () => selectMult,
        (newVal) => {
            if (!newVal) {
                clearSelection();
            } else {
                map.closePopup();
            }
        },
    );
});
</script>

<style scoped>
.map {
    height: 100%;
    width: 100%;
    z-index: 0;
}
</style>
