<template>
    <div ref="mapElement" class="map"></div>
</template>

<script setup lang="ts">
import { getLocateControl, initializeMap } from "@/composables/LocationFallback";
import * as L from "leaflet";
import { onMounted, useTemplateRef } from "vue";

const location = defineModel<L.LatLng>("location", {
    required: true,
});

const props = defineProps({
    autoLocate: {
        type: Boolean,
        default: true,
    },
});

const mapElement = useTemplateRef("mapElement");

onMounted(() => {
    // Check if the mapElement is properly mounted
    if (!mapElement.value) {
        throw new Error("mapElement is not defined");
    }
    // Initialize the map
    const map: L.Map = initializeMap(mapElement.value, location);

    // Allow the user to click on the map to set the location
    map.on("click", (ev: L.LeafletMouseEvent) => {
        location.value = ev.latlng;
    });

    // Add the locate control
    const locateControl = getLocateControl(location, {
        position: "topleft",
    });
    locateControl.addTo(map);

    // Locate the user on load if autoLocate is set true
    if (props.autoLocate) {
        locateControl._getGeoLocation(map);
    }
});
</script>

<style scoped>
.map {
    height: 100%;
    width: 100%;
    z-index: 0;
}
</style>
