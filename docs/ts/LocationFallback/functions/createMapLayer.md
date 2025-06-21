# Function: createMapLayer()
> **createMapLayer**(`options?`): `L.Layer`

Defined in: src/composables/LocationFallback.ts:27

Creates the base map layer for the Leaflet map with high-quality satellite imagery and labels overlay.

## Parameters
### options?
`Object` - Optional parameters for the map layer configuration.

#### noWrap
`boolean` - If true, the map will not wrap around the world. Default: `false`

#### bounds
`L.LatLngBoundsExpression` - The bounds of the map layer.

## Returns
`L.Layer`

A Leaflet layer group containing high-quality satellite imagery from Esri World Imagery service with CartoDB labels overlay for city/town/POI names.
