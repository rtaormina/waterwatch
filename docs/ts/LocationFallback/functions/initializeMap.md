# Function: initializeMap()

> **initializeMap**(`mapElement`, `location`): `Map`

Defined in: src/composables/LocationFallback.ts:75

Initializes a Leaflet map on the specified HTML element, centers it at the given location,
adds an OpenStreetMap tile layer, and places a marker at the location.

## Parameters

### mapElement

`HTMLElement`

The HTML element where the map will be rendered.

### location

`Ref`\<`LatLng`\>

A Vue Ref containing the latitude and longitude to center the map and place the marker.

## Returns

`Map`

The initialized Leaflet map instance.
