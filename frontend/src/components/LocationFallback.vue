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

  map.locate({
    setView: true,
    maxZoom: 16,
  });
  locateControl._startSpinner();
});

function setMarkerLocation(ev: L.LeafletMouseEvent) {
  location.value = ev.latlng;
}

const LocateControl = L.Control.extend({
  container: null as HTMLElement | null,
  icon: null as HTMLElement | null,
  locateIcon: null as HTMLElement | null,
  spinner: null as Spinner | null,
  map: null as L.Map | null,

  _createButton: function (): HTMLElement {
    this.container = L.DomUtil.create("div");
    this.container.className =
      "leaflet-bar leaflet-control leaflet-control-load";
    this.container.title = "Get current location";

    this.icon = L.DomUtil.create("a");
    this.icon.style.display = "flex";
    this.icon.style.alignItems = "center";
    this.icon.style.justifyContent = "center";
    this.locateIcon = L.DomUtil.create("span");
    this.locateIcon.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M440-42v-80q-125-14-214.5-103.5T122-440H42v-80h80q14-125 103.5-214.5T440-838v-80h80v80q125 14 214.5 103.5T838-520h80v80h-80q-14 125-103.5 214.5T520-122v80h-80Zm40-158q116 0 198-82t82-198q0-116-82-198t-198-82q-116 0-198 82t-82 198q0 116 82 198t198 82Zm0-120q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T560-480q0-33-23.5-56.5T480-560q-33 0-56.5 23.5T400-480q0 33 23.5 56.5T480-400Zm0-80Z"/></svg>';

    this.icon.appendChild(this.locateIcon);

    this.container.appendChild(this.icon);

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

    return this.container;
  },

  _startSpinner: function () {
    if (!this.icon || !this.spinner) {
      return;
    }
    if (this.locateIcon) {
      this.locateIcon.style.display = "none";
    }
    this.spinner.spin(this.icon);
  },
  _endSpinner: function () {
    if (this.spinner) {
      this.spinner.stop();
    }
    if (this.locateIcon) {
      this.locateIcon.removeAttribute("style");
    }
  },

  _handleLocationError: function (e: L.ErrorEvent) {
    this._endSpinner();
    alert("Location could not be found, set a location manually.");
  },
  _handleLocationFound: function (ev: L.LocationEvent) {
    this._endSpinner();
    location.value = ev.latlng;
  },

  _getIpLocation: function () {
    fetch("https://www.geolocation-db.com/json/")
      .then((x) => x.json())
      .then((data) => {
        location.value = L.latLng(data.latitude, data.longitude);
        if (this.map) {
          this.map.setView(L.latLng(data.latitude, data.longitude), 9);
        }
      });
  },

  onAdd: function (map: L.Map) {
    this.map = map;
    this.container = this._createButton();

    // Add the locate handler
    L.DomEvent.on(this.container, "click", () => {
      map.locate({
        setView: true,
        maxZoom: 16,
      });
      this._startSpinner();
    });

    map.on("locationfound", this._handleLocationFound.bind(this));
    map.on("locationerror", this._handleLocationError.bind(this));
    map.once("locationerror", () => {
      this._getIpLocation();
    });

    // Prevent the event from propagating to the map
    L.DomEvent.disableClickPropagation(this.container);

    return this.container;
  },

  onRemove: function (map: L.Map) {
    // Remove the event listener when the control is removed
    if (this.container) {
      L.DomEvent.off(this.container);
    }
    map.off("locationfound", this._handleLocationFound.bind(this));
    map.off("locationerror", this._handleLocationError.bind(this));
  },
});
</script>

<style scoped>
.map {
  height: 100%;
  width: 100%;
}
</style>
