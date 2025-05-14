<template>
  <div ref="mapElement" class="map"></div>
</template>

<script setup lang="ts">
import { onMounted, useTemplateRef, watch } from "vue";
import L from "leaflet";



const location = defineModel<L.LatLng>("location", {
  default: () => L.latLng(51.999, 4.374),
});

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




const mapElement = useTemplateRef("mapElement");
onMounted(() => {
  if (!mapElement.value) {
    throw new Error("mapElement is not defined");
  }
  // Initialize the map
  const map: L.Map = L.map(mapElement.value, {
    center: [51.999, 4.374],
    zoom: 13,
  });
  layer.addTo(map);
  marker.addTo(map);
  map.on("click", setMarkerLocation);
  map.locate({
    setView: true,
    maxZoom: 16,
  });
  map.on("locationfound", (ev: L.LocationEvent) => {
    location.value = ev.latlng;
  });
  map.on("locationerror", (e: L.ErrorEvent) => {
    alert(
      "Location could not be found set a location manually.\n" + e.message
    );
  });
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
