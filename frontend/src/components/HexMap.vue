<template>
  <div ref="mapElement" class="map"></div>
</template>

<script setup lang="ts">
import { createOSMLayer } from "@/composables/LocationFallback";
import * as L from "leaflet";
import { onMounted, useTemplateRef } from "vue";
import "@asymmetrik/leaflet-d3/dist/leaflet-d3.js";

// Extend Leaflet types to include hexagonal
declare module "leaflet" {
  function hexbinLayer(options?: any): any;
}

const mapElement = useTemplateRef("mapElement");

const layer = createOSMLayer();

const { center = L.latLng(51.999, 4.3737), data } = defineProps<{
  center?: L.LatLng;
  data: { point: L.LatLng; value: number }[];
}>();

const hexbinOptions = {
  radius: 24,
  opacity: 0.3,
  colorRange: ["blue", "orange", "red"],
  radiusRange: [4, 22],
};

const hexbinLayer = L.hexbinLayer(hexbinOptions);

// Set up events
hexbinLayer.dispatch().on("click", function (event: any, d: any, i: any) {
  console.log({ type: "click", event: event, d: d, index: i});
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
  hexbinLayer.addTo(map);
  hexbinLayer.data(
    data.map((item) => item.point).map((point) => [point.lng, point.lat])
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
