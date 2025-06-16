# Function: getLocateControl()

> **getLocateControl**(`location`, `opts?`): `LocateControl`

Defined in: src/composables/LocationFallback.ts:124

Creates a custom Leaflet control for locating the user's position.

This control attempts to use the browser's geolocation API to determine the user's location.
If geolocation fails, it falls back to an IP-based location service.
The control displays a button with a location icon and a spinner while locating.

## Parameters

### location

`Ref`\<`LatLng`\>

A Vue Ref containing the current location as a Leaflet LatLng object. This will be updated when the location is found.

### opts?

`ControlOptions`

Optional Leaflet control options to customize the control's appearance and behavior.

## Returns

`LocateControl`

An instance of the custom LocateControl, which can be added to a Leaflet map.

## Remarks

- The control listens for `locationfound` and `locationerror` events on the map.
- On success, the map view is set to the found location.
- On error, an alert is shown and the control attempts to use an IP-based geolocation service.
- The control uses a spinner to indicate loading state.

## Example

```typescript
import { getLocateControl } from './composables/LocationFallback';

const location = ref<L.LatLng>(L.latLng(0, 0));
const locateControl = getLocateControl(location);
map.addControl(locateControl);
```
