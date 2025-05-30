import * as L from "leaflet";
import { Spinner, type SpinnerOptions } from "spin.js";
import "spin.js/spin.css";
import { toValue, watch, type MaybeRefOrGetter, type Ref } from "vue";

// For Leaflets marker to work properly on production, we need to set the default marker icon URLs explicitly.
// This is a workaround for the issue where Leaflet does not correctly build the marker icon images in production builds.
import markerIconUrl from "../../node_modules/leaflet/dist/images/marker-icon.png";
import markerIconRetinaUrl from "../../node_modules/leaflet/dist/images/marker-icon-2x.png";
import markerShadowUrl from "../../node_modules/leaflet/dist/images/marker-shadow.png";
L.Icon.Default.prototype.options.iconUrl = markerIconUrl;
L.Icon.Default.prototype.options.iconRetinaUrl = markerIconRetinaUrl;
L.Icon.Default.prototype.options.shadowUrl = markerShadowUrl;
L.Icon.Default.imagePath = ""; // necessary to avoid Leaflet adds some prefix to image path.

/**
 * Creates the OSM Layer for the map.
 *
 * @returns {Leaflet.TileLayer} The OSM Layer
 */
export function createOSMLayer(options?: { noWrap: boolean }): L.TileLayer {
    return L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        ...options,
    });
}

/**
 * Creates a marker on the map.
 *
 * @param {Ref<Leaflet.LatLng>}location
 * @returns {Leaflet.Marker} The marker
 */
export function createMarker(location: Ref<L.LatLng>): L.Marker {
    L.Icon.Default.prototype.options.iconUrl = markerIconUrl;
    L.Icon.Default.prototype.options.iconRetinaUrl = markerIconRetinaUrl;
    L.Icon.Default.prototype.options.shadowUrl = markerShadowUrl;
    L.Icon.Default.imagePath = ""; // necessary to avoid Leaflet adds some prefix to image path.
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

/**
 * Creates a Leaflet map instance centered at the given location.
 *
 * @param {HTMLElement} element - The HTML element to mount the map on.
 * @param {MaybeRefOrGetter<L.LatLng>} location - The initial center location for the map (can be a ref or getter).
 * @returns {L.Map} The Leaflet map instance.
 */
export function createMap(element: HTMLElement, location: MaybeRefOrGetter<L.LatLng>): L.Map {
    return L.map(element, {
        center: toValue(location),
        zoom: 4,
        worldCopyJump: true,
    });
}

/**
 * Initializes a Leaflet map on the specified HTML element, centers it at the given location,
 * adds an OpenStreetMap tile layer, and places a marker at the location.
 *
 * @param mapElement - The HTML element where the map will be rendered.
 * @param location - A Vue Ref containing the latitude and longitude to center the map and place the marker.
 * @returns The initialized Leaflet map instance.
 */
export function initializeMap(mapElement: HTMLElement, location: Ref<L.LatLng>): L.Map {
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
    _handleLocationError: (e: L.ErrorEvent) => void;
    _handleLocationFound: (ev: L.LocationEvent) => void;
    map: L.Map | null;
    container: HTMLElement | null;
    icon: HTMLElement | null;
    spinner: Spinner | null;
    locateIcon: HTMLElement | null;
};

/**
 * Creates a custom Leaflet control for locating the user's position.
 *
 * This control attempts to use the browser's geolocation API to determine the user's location.
 * If geolocation fails, it falls back to an IP-based location service.
 * The control displays a button with a location icon and a spinner while locating.
 *
 * @param location - A Vue Ref containing the current location as a Leaflet LatLng object. This will be updated when the location is found.
 * @param opts - Optional Leaflet control options to customize the control's appearance and behavior.
 * @returns An instance of the custom LocateControl, which can be added to a Leaflet map.
 *
 * @remarks
 * - The control listens for `locationfound` and `locationerror` events on the map.
 * - On success, the map view is set to the found location.
 * - On error, an alert is shown and the control attempts to use an IP-based geolocation service.
 * - The control uses a spinner to indicate loading state.
 *
 * @example
 * ```typescript
 * import { getLocateControl } from './composables/LocationFallback';
 *
 * const location = ref<L.LatLng>(L.latLng(0, 0));
 * const locateControl = getLocateControl(location);
 * map.addControl(locateControl);
 * ```
 */
export function getLocateControl(location: Ref<L.LatLng>, opts?: L.ControlOptions): LocateControl {
    const LocateControl = L.Control.extend({
        container: null as HTMLElement | null,
        icon: null as HTMLElement | null,
        spinner: null as Spinner | null,
        locateIcon: null as HTMLElement | null,
        map: null as L.Map | null,

        /**
         * Initializes the control with the given options.
         *
         * @param {L.ControlOptions} options - Options for the control.
         */
        initialize: function (options: L.ControlOptions) {
            this._setupContainer();
            L.Util.setOptions(this, options);
        },

        /**
         * Sets up the container and its elements.
         *
         * @returns {HTMLElement} the container
         */
        _setupContainer: function () {
            this.container = this._createContainer();
            this.icon = this._createIcon();
            this.spinner = this._createSpinner();
            this.locateIcon = this._createLocateIcon();
            this.icon.appendChild(this.locateIcon);
            this.container.appendChild(this.icon);
            return this.container;
        },

        /**
         * Creates the container element.
         *
         * @returns {HTMLElement} The container element.
         */
        _createContainer: function (): HTMLElement {
            const container = L.DomUtil.create("div");
            container.className = "leaflet-bar leaflet-control leaflet-control-load";
            container.title = "Get current location";
            return container;
        },

        /**
         * Create the location icon element.
         *
         * @returns {HTMLElement} The icon element.
         */
        _createIcon: function (): HTMLElement {
            const icon = L.DomUtil.create("a");
            icon.style.display = "flex";
            icon.style.alignItems = "center";
            icon.style.justifyContent = "center";
            return icon;
        },

        /**
         * Create the icon to locate your position
         *
         * @returns {HTMLElement} The locate icon element.
         */
        _createLocateIcon: function (): HTMLElement {
            const locateIcon = L.DomUtil.create("span");
            locateIcon.innerHTML =
                '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M440-42v-80q-125-14-214.5-103.5T122-440H42v-80h80q14-125 103.5-214.5T440-838v-80h80v80q125 14 214.5 103.5T838-520h80v80h-80q-14 125-103.5 214.5T520-122v80h-80Zm40-158q116 0 198-82t82-198q0-116-82-198t-198-82q-116 0-198 82t-82 198q0 116 82 198t198 82Zm0-120q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T560-480q0-33-23.5-56.5T480-560q-33 0-56.5 23.5T400-480q0 33 23.5 56.5T480-400Zm0-80Z"/></svg>';
            return locateIcon;
        },

        /**
         * Creates a spinner to display while locating.
         *
         * @param {SpinnerOptions} spinOpts - the options for the spinner
         * @returns {Spinner} The spinner instance.
         */
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

        /**
         * Starts the spinner animation.
         */
        _startSpinner: function () {
            if (this.locateIcon) {
                this.locateIcon.style.display = "none";
            }
            if (this.icon && this.spinner) {
                this.spinner.spin(this.icon);
            }
        },
        /**
         * Stops the spinner animation.
         */
        _endSpinner: function () {
            if (this.spinner) {
                this.spinner.stop();
            }
            if (this.locateIcon) {
                this.locateIcon.removeAttribute("style");
            }
        },

        /**
         * Displays an alert in case something went wrong with finding the location
         *
         * @param {Leaflet.ErrorEvent} e - The error event.
         */
        _handleLocationError: function (e: L.ErrorEvent) {
            this._endSpinner();
            console.error(e);
            alert("Location could not be found, set a location manually." + e.message);
        },

        /**
         * Handles the location found event.
         *
         * @param {Leaflet.LocationEvent} ev - The location event.
         */
        _handleLocationFound: function (ev: L.LocationEvent) {
            this._endSpinner();
            location.value = ev.latlng;
            if (this.map) {
                this.map.setView(ev.latlng, 14);
            }
        },

        /**
         * Fetches the user's location based on IP address.
         */
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

        /**
         * Attempts to locate the user's current position using the browser's geolocation API.
         *
         * @param {L.Map} map - The Leaflet map instance on which to perform geolocation.
         */
        _getGeoLocation: function (map: L.Map) {
            map.locate({
                setView: true,
                maxZoom: 16,
            });
            this._startSpinner();
        },

        /**
         * Adds the locate control to the specified Leaflet map and sets up event listeners.
         *
         * @param {L.Map} map - The Leaflet map instance to which the control will be added.
         * @returns {HTMLElement} The container element for the control.
         */
        onAdd: function (map: L.Map): HTMLElement {
            this.map = map;

            // this.container should never be null as container is setup during initialize, but in case it is, we create a new container
            if (!this.container) {
                this.container = this._setupContainer();
            }

            // Add the locate handler
            L.DomEvent.on(this.container, "click", this._getGeoLocation.bind(this, map));

            map.on("locationfound", this._handleLocationFound, this);
            map.on("locationerror", this._handleLocationError, this);
            map.once("locationerror", () => {
                this._getIpLocation();
            });

            // Prevent the event from propagating to the map
            L.DomEvent.disableClickPropagation(this.container);

            return this.container;
        },

        /**
         * Removes the locate control from the specified Leaflet map and cleans up event listeners.
         *
         * @param {L.Map} map - The Leaflet map instance from which the control will be removed.
         */
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
