<template>
  <div ref="mapElement" class="map"></div>
</template>

<script setup lang="ts">
import { createOSMLayer } from "@/composables/LocationFallback";
import * as L from "leaflet";
import { onMounted, useTemplateRef } from "vue";
import "../assets/leaflet.hexagonal.js";
import "../assets/leaflet.hexagonal.css";
import "@asymmetrik/leaflet-d3/dist/leaflet-d3.js";
import { watch } from "vue";

// Extend Leaflet types to include hexagonal
declare module "leaflet" {
  function hexagonal(options?: any): any;
  function hexbinLayer(options?: any): any;
}

const mapElement = useTemplateRef("mapElement");

const layer = createOSMLayer();

const { center = L.latLng(51.999, 4.3737), data } = defineProps<{
  center?: L.LatLng;
  data: { point: L.LatLng; value: number }[];
}>();

const hexLayer = L.hexagonal({
  // clusterProperty: "value",
  // clusterMode: "avg",
  clusterColors: ["#d7e9f4", "#297ed8", "#d75f2c", "#951313"],
  clusterScale: "linear",
  highlightDisplay: true,
  selectionMode: "points",
  highlightStrokeColor: "#0f0",
  hexagonSize: 64,
  selectionTolerance: 30,
  opacity: 0.45,
});

const hexbinLayer = L.hexbinLayer();

hexLayer.on("click", (e) => {
  const { lat, lng } = e.latlng;
  const point = L.latLng(lat, lng);
  const selectedPoint = data.find((item) => item.point.equals(point));
  if (selectedPoint) {
    console.log("Selected point:", e);
  }
});

onMounted(() => {
  // Check if the mapElement is properly mounted
  if (!mapElement.value) {
    throw new Error("mapElement is not defined");
  }
  // Initialize the map
  const map = L.map(mapElement.value, {
    center: center,
    zoom: 14,
    maxZoom: 16,
    worldCopyJump: true,
  });
  layer.addTo(map);
  hexLayer.addTo(map);
  hexbinLayer.addTo(map);
  hexbinLayer.data(data.map((item) => item.point).map((point) => [point.lng, point.lat]));
  watch(
    () => data,
    (newData) => {
      if (newData) {
        hexLayer.removeAll();
        for (const item of newData) {
          hexLayer.addPoint(item.point, {
            value: item.value,
          });
        }
      }
    },
    { immediate: true }
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
