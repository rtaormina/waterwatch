<template>
  <div>
    <h1 class="text-center">Map View</h1>
    <div class="flex justify-center">
      <div id="map"></div>
    </div>
    <div>{{ location.lat }}, {{ location.lng }}</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import L from "leaflet";

const location = ref<L.LatLng>(L.latLng(51.999, 4.374));

watch(location, (newLocation) => {
  marker.setLatLng(newLocation);
});

const layer = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }
);
const marker = L.marker(location.value, {
  draggable: true,
  autoPan: true,
});
marker.on("dragend", (ev: L.DragEndEvent) => {
  const marker = ev.target;
  location.value = marker.getLatLng();
});

onMounted(() => {
  // Initialize the map
  const map: L.Map = L.map("map", {
    center: [51.999, 4.374],
    zoom: 13,
  });
  layer.addTo(map);
  marker.addTo(map);
  map.on("click", setMarkerLocation);
});

function setMarkerLocation(ev: L.LeafletMouseEvent) {
  location.value = ev.latlng;
}
</script>
<script lang="ts"></script>

<style scoped>
#map {
  height: 400px;
  width: 80%;
}
</style>
