<template>
    <div ref="mapElement" class="map"></div>
</template>

<script setup lang="ts">
import { createOSMLayer } from "@/composables/LocationFallback";
import * as L from "leaflet";
import { onMounted, useTemplateRef } from "vue";
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

const { center = L.latLng(51.999, 4.3737), data } = defineProps<{
    center?: L.LatLng;
    data: DataPoint[];
}>();

const hexbinOptions: L.HexbinLayerConfig = {
    radius: 24,
    opacity: 0.2,
    colorRange: ["blue", "orange", "red"],
    radiusRange: [4, 22],
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
    (e: "hex-click", d: unknown[]): void;
}>();

hexbinLayer.dispatch().on("click", function (event: MouseEvent, d: unknown[], i: unknown) {
    emit("hex-click", d);
    console.log("Hex clicked:", d, i);
});

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
});
</script>

<style scoped>
.map {
    height: 100%;
    width: 100%;
    z-index: 0;
}
</style>
