import L from "leaflet";
import { Spinner, type SpinnerOptions } from "spin.js";
import "spin.js/spin.css";
import { toValue, watch, type MaybeRefOrGetter, type Ref } from "vue";

export function createOSMLayer(): L.TileLayer {
  return L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  });
}

export function createMarker(location: Ref<L.LatLng>): L.Marker {
  const marker = L.marker(location.value, {
    draggable: true,
    autoPan: true,
  });
  // Keep the marker in sync with the location
  watch(location, (newLocation) => {
    marker.setLatLng(newLocation);
  });
  // Update the location when the marker moved
  marker.on("dragend", (ev: L.DragEndEvent) => {
    const marker = ev.target;
    location.value = marker.getLatLng();
  });
  return marker;
}

export function createMap(
  element: HTMLElement,
  location: MaybeRefOrGetter<L.LatLng>
): L.Map {
  return L.map(element, {
    center: toValue(location),
    zoom: 4,
  });
}

export function initializeMap(
  mapElement: HTMLElement,
  location: Ref<L.LatLng>
): L.Map {
  const map: L.Map = createMap(mapElement, location);
  const layer: L.TileLayer = createOSMLayer();
  layer.addTo(map);
  const marker: L.Marker = createMarker(location);
  marker.addTo(map);
  return map;
}

type LocateControl = L.Control & {
  _startSpinner: () => void;
  _endSpinner: () => void;
  _getIpLocation: () => void;
  _getGeoLocation: (map: L.Map) => void;
};

export function getLocateControl(
  location: Ref<L.LatLng>,
  opts: L.ControlOptions
): LocateControl {
  const LocateControl = L.Control.extend({
    container: null as HTMLElement | null,
    icon: null as HTMLElement | null,
    spinner: null as Spinner | null,
    locateIcon: null as HTMLElement | null,
    map: null as L.Map | null,

    initialize: function (options: L.ControlOptions) {
      this._setupContainer();
      L.Util.setOptions(this, options);
    },

    _setupContainer: function () {
      this.container = this._createContainer();
      this.icon = this._createIcon();
      this.spinner = this._createSpinner();
      this.locateIcon = this._createLocateIcon();
      this.icon.appendChild(this.locateIcon);
      this.container.appendChild(this.icon);
      return this.container;
    },

    _createContainer: function (): HTMLElement {
      const container = L.DomUtil.create("div");
      container.className = "leaflet-bar leaflet-control leaflet-control-load";
      container.title = "Get current location";
      return container;
    },

    _createIcon: function (): HTMLElement {
      const icon = L.DomUtil.create("a");
      icon.style.display = "flex";
      icon.style.alignItems = "center";
      icon.style.justifyContent = "center";
      return icon;
    },

    _createLocateIcon: function (): HTMLElement {
      const locateIcon = L.DomUtil.create("span");
      locateIcon.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M440-42v-80q-125-14-214.5-103.5T122-440H42v-80h80q14-125 103.5-214.5T440-838v-80h80v80q125 14 214.5 103.5T838-520h80v80h-80q-14 125-103.5 214.5T520-122v80h-80Zm40-158q116 0 198-82t82-198q0-116-82-198t-198-82q-116 0-198 82t-82 198q0 116 82 198t198 82Zm0-120q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T560-480q0-33-23.5-56.5T480-560q-33 0-56.5 23.5T400-480q0 33 23.5 56.5T480-400Zm0-80Z"/></svg>';
      return locateIcon;
    },

    _createSpinner: function (spinOpts?: SpinnerOptions): Spinner {
      if (!spinOpts) {
        spinOpts = {
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
      }
      return new Spinner(spinOpts);
    },

    _startSpinner: function () {
      if (this.locateIcon) {
        this.locateIcon.style.display = "none";
      }
      if (this.icon && this.spinner) {
        this.spinner.spin(this.icon);
      }
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
      console.error(e);
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

    _getGeoLocation: function (map: L.Map) {
      map.locate({
        setView: true,
        maxZoom: 16,
      });
      this._startSpinner();
    },

    onAdd: function (map: L.Map): HTMLElement {
      this.map = map;

      if (!this.container) {
        this.container = this._setupContainer();
      }

      // Add the locate handler
      L.DomEvent.on(
        this.container,
        "click",
        this._getGeoLocation.bind(this, map)
      );

      map.on("locationfound", this._handleLocationFound, this);
      map.on("locationerror", this._handleLocationError, this);
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
      map.off("locationfound", this._handleLocationFound, this);
      map.off("locationerror", this._handleLocationError, this);
    },
  });

  return new LocateControl(opts);
}
