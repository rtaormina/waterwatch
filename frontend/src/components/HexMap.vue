<template>
    <div ref="mapElement" class="map"></div>
</template>

<script setup lang="ts">
import { createOSMLayer } from "@/composables/LocationFallback";
import * as L from "leaflet";
import { onMounted, useTemplateRef } from "vue";

const mapElement = useTemplateRef("mapElement");

const layer = createOSMLayer();

const center = L.latLng(51.999, 4.3737);

onMounted(() => {
    // Check if the mapElement is properly mounted
    if (!mapElement.value) {
        throw new Error("mapElement is not defined");
    }
    // Initialize the map
    const map = L.map(mapElement.value, {
        center: center,
        zoom: 4,
    });
    layer.addTo(map);
});
</script>

<style scoped>
.map {
    height: 100%;
    width: 100%;
    z-index: 0;
}
</style>
