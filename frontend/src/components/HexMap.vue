<template>
    <div ref="mapElement" class="map"></div>
</template>

<script setup lang="ts">
import { createOSMLayer } from "@/composables/LocationFallback";
import * as L from "leaflet";
import { onMounted, useTemplateRef, watch } from "vue";
import "@asymmetrik/leaflet-d3/dist/leaflet-d3.js";

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
};

const {
    center = L.latLng(51.999, 4.3737),
    data,
    colors,
    colorScale,
} = defineProps<{
    center?: L.LatLng;
    data: DataPoint[];
    colors: string[];
    colorScale: [number, number];
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
            emit("hex-click", geoJsonToWktPolygon(boundingGeometry));
        });
});
</script>

<style scoped>
.map {
    height: 100%;
    width: 100%;
    z-index: 0;
}
</style>
