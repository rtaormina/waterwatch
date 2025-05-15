<template>
  <div ref="mapElement" class="map"></div>
</template>

<script setup lang="ts">
import { onMounted, useTemplateRef, watch } from "vue";
import L from "leaflet";
import { Spinner } from "spin.js";
import "spin.js/spin.css";

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

  const locateControl = new LocateControl({ position: "topleft" });
  locateControl.addTo(map);
});

function setMarkerLocation(ev: L.LeafletMouseEvent) {
  location.value = ev.latlng;
}

const LocateControl = L.Control.extend({
  button: null as HTMLElement | null,
  icon: null as HTMLElement | null,
  spinner: null as Spinner | null,

  _createButton: function (): HTMLElement {
    this.button = L.DomUtil.create("button");
    this.button.className = "leaflet-bar leaflet-control";

    this.icon = L.DomUtil.create("a");
    this.icon.textContent = "📍";

    this.button.appendChild(this.icon);

    const spinOpts = {
      lines: 8, // The number of lines to draw
      length: 0, // The length of each line
      width: 8, // The line thickness
      radius: 10, // The radius of the inner circle
      scale: 0.5, // Scales overall size of the spinner
      corners: 1, // Corner roundness (0..1)
      speed: 0.8, // Rounds per second
      rotate: 0, // The rotation offset
      animation: "spinner-line-fade-more", // The CSS animation name for the lines
      direction: 1, // 1: clockwise, -1: counterclockwise
      color: "#000000", // CSS color or array of colors
      fadeColor: "transparent", // CSS color or array of colors
    };
    this.spinner = new Spinner(spinOpts);

    return this.button;
  },

  _startSpinner: function () {
    if (!this.icon || !this.spinner) {
      return;
    }
    this.icon.textContent = "";
    this.spinner.spin(this.icon);
  },
  _endSpinner: function () {
    if (this.spinner) {
      this.spinner.stop();
    }
    if (this.icon) {
      this.icon.textContent = "📍";
    }
  },

  onAdd: function (map: L.Map) {
    this.button = this._createButton();

    // Add the locate handler
    L.DomEvent.on(this.button, "click", () => {
      map.locate({
        setView: true,
        maxZoom: 16,
      });
      this._startSpinner();
      map.on("locationfound", (ev: L.LocationEvent) => {
        this._endSpinner();
        location.value = ev.latlng;
      });
      map.on("locationerror", (e: L.ErrorEvent) => {
        this._endSpinner();
        alert(
          "Location could not be found set a location manually.\n" + e.message
        );
      });
    });

    // Prevent the event from propagating to the map
    L.DomEvent.disableClickPropagation(this.button);

    return this.button;
  },

  onRemove: function (map: L.Map) {
    // Remove the event listener when the control is removed
    if (this.button) {
      L.DomEvent.off(this.button);
    }
  },
});
</script>

<style scoped>
.map {
  height: 100%;
  width: 100%;
}
</style>
