<template>
  <div ref="mapElement" class="map"></div>
</template>

<script setup lang="ts">
import { getLocateControl } from "@/composables/LocationFallback";
import L from "leaflet";
import { onMounted, useTemplateRef, watch } from "vue";

const location = defineModel<L.LatLng>("location", {
  required: true,
});

const props = defineProps({
  autoLocate: {
    type: Boolean,
    default: true,
  },
});

watch(location, (newLocation) => {
  marker.setLatLng(newLocation);
});

const marker = L.marker(location.value, {
  draggable: true,
  autoPan: true,
});
marker.on("dragend", (ev: L.DragEndEvent) => {
  const marker = ev.target;
  location.value = marker.getLatLng();
});

const layer = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }
);

const mapElement = useTemplateRef("mapElement");

onMounted(() => {
  if (!mapElement.value) {
    throw new Error("mapElement is not defined");
  }
  // Initialize the map
  const map: L.Map = L.map(mapElement.value, {
    center: location.value,
    zoom: 4,
  });
  layer.addTo(map);
  marker.addTo(map);
  map.on("click", setMarkerLocation);

  const locateControl = getLocateControl(location, props.autoLocate, {
    position: "topleft",
  });
  locateControl.addTo(map);

  if (props.autoLocate) {
    map.locate({
      setView: true,
      maxZoom: 16,
    });
    locateControl._startSpinner();
  }
});

function setMarkerLocation(ev: L.LeafletMouseEvent) {
  location.value = ev.latlng;
}
</script>

<style scoped>
.map {
  height: 100%;
  width: 100%;
}
</style>
