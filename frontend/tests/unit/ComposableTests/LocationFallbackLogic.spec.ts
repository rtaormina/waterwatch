import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref, nextTick, Ref } from "vue";
import * as L from "leaflet";
import { createMarker, createMap, getLocateControl } from "../../../src/composables/LocationFallback";

// Mock leaflet and DOM-related APIs
vi.mock("leaflet", async () => {
    return {
        marker: vi.fn((latlng, opts) => {
            let _latlng = latlng; // mock storage for marker latlng
            const events: Record<string, Function> = {}; // allow mocking event handlers
            return {
                setLatLng: vi.fn((newLatLng) => {
                    _latlng = newLatLng;
                }),
                getLatLng: vi.fn(() => _latlng),
                on: vi.fn((event, cb) => {
                    events[event] = cb;
                }),
                addTo: vi.fn(),
                _events: events,
            };
        }),
        tileLayer: vi.fn(() => ({
            addTo: vi.fn(),
        })),
        map: vi.fn(() => ({
            setView: vi.fn(),
            on: vi.fn(),
            once: vi.fn(),
            off: vi.fn(),
            locate: vi.fn(),
        })),
        DomUtil: {
            create: vi.fn((tag) => {
                const el = {
                    style: {},
                    appendChild: vi.fn(),
                    removeAttribute: vi.fn(),
                } as unknown as HTMLElement;
                return el;
            }),
        },
        DomEvent: {
            on: vi.fn(),
            off: vi.fn(),
            disableClickPropagation: vi.fn(),
        },
        Util: {
            setOptions: vi.fn(),
        },
        Control: {
            extend: vi.fn((def) => {
                function C(opts: any) {
                    Object.assign(this, def);
                    if (typeof this.initialize === "function") this.initialize(opts);
                }
                C.prototype = def;
                return C as any;
            }),
        },
        latLng: vi.fn((lat, lng) => ({ lat, lng })),

        Icon: {
            Default: {
                prototype: {
                    options: {
                        iconUrl: "",
                        iconRetinaUrl: "",
                        shadowUrl: "",
                    },
                },
                imagePath: "",
            },
        },
    };
});

// Mock Spinner
vi.mock("spin.js", () => ({
    Spinner: vi.fn().mockImplementation(() => ({
        spin: vi.fn(),
        stop: vi.fn(),
    })),
}));

describe("LocationFallback composable", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("createMarker", () => {
        it("should create a draggable marker and sync with location ref", async () => {
            const location = ref({ lat: 1, lng: 2 } as L.LatLng);
            const marker = createMarker(location);

            expect(L.marker).toHaveBeenCalledWith(location.value, {
                draggable: true,
                autoPan: true,
            });

            // Simulate location ref change
            const newLoc = { lat: 3, lng: 4 } as L.LatLng;
            location.value = newLoc;
            await nextTick();
            // The watcher should call setLatLng
            expect(marker.setLatLng).toHaveBeenCalledWith(newLoc);
            expect(marker.getLatLng()).toEqual(newLoc);

            // Simulate dragend event
            const dragLocation = { lat: 5, lng: 6 } as L.LatLng;
            marker.setLatLng(dragLocation);
            marker._events["dragend"]({ target: marker });
            expect(location.value).toEqual({ lat: 5, lng: 6 });
        });
    });

    describe("createMap", () => {
        it("should create a map centered at the given location with worldCopyJump set to true", () => {
            const el = {} as HTMLElement;
            const loc = { lat: 10, lng: 20 } as L.LatLng;
            createMap(el, loc);
            expect(L.map).toHaveBeenCalledWith(
                el,
                expect.objectContaining({
                    center: loc,
                    worldCopyJump: true, // this makes the map reorient when crossing the antemeridian
                }),
            );
        });
    });

    describe("getLocateControl", () => {
        let location: Ref<L.LatLng>;
        beforeEach(() => {
            location = ref({ lat: 0, lng: 0 } as L.LatLng);
        });

        it("should start spinner on _startSpinner", () => {
            const control = getLocateControl(location);
            control._startSpinner();
            expect(control.spinner?.spin).toHaveBeenCalled();
        });

        it("should stop spinner on _endSpinner", () => {
            const control = getLocateControl(location);
            control._endSpinner();
            expect(control.spinner?.stop).toHaveBeenCalled();
        });

        it("should call map.locate and start spinner on _getGeoLocation", () => {
            const control = getLocateControl(location);
            const fakeMap = { locate: vi.fn() } as any;
            control._startSpinner = vi.fn();
            control._getGeoLocation(fakeMap);
            expect(fakeMap.locate).toHaveBeenCalledWith(
                expect.objectContaining({
                    setView: true, // ensures the map view is centered to the found location
                }),
            );
            expect(control._startSpinner).toHaveBeenCalled();
        });

        it("should update location and set view on _handleLocationFound", () => {
            const control = getLocateControl(location);
            control._endSpinner = vi.fn();
            const map = { setView: vi.fn() } as any;
            const ev = { latlng: { lat: 42, lng: 24 } };
            control.map = map;
            control._handleLocationFound(ev as any);
            expect(control._endSpinner).toHaveBeenCalled();
            expect(location.value).toEqual({ lat: 42, lng: 24 });
            expect(map.setView).toHaveBeenCalledWith(ev.latlng, 14);
        });

        it("should stop spinner and alert on _handleLocationError", () => {
            const control = getLocateControl(location);
            control._endSpinner = vi.fn();
            globalThis.alert = vi.fn();
            const err = { message: "fail" };
            control._handleLocationError(err as any);
            expect(control._endSpinner).toHaveBeenCalled();
            expect(globalThis.alert).toHaveBeenCalledWith(expect.stringContaining("fail"));
        });

        it("should fetch IP location and update location/map", async () => {
            const control = getLocateControl(location);
            control.map = { setView: vi.fn() } as any;
            globalThis.fetch = vi.fn().mockResolvedValue({
                json: () => Promise.resolve({ latitude: 11, longitude: 22 }),
            });
            control._getIpLocation();
            await new Promise((r) => setTimeout(r)); // wait for fetch to resolve
            expect(location.value).toEqual({ lat: 11, lng: 22 });
            expect(control.map?.setView).toHaveBeenCalledWith({ lat: 11, lng: 22 }, 9);
        });

        it("should setup container and event listeners on onAdd", () => {
            const control = getLocateControl(location);
            const map = {
                on: vi.fn(),
                once: vi.fn(),
            } as any;
            expect(control.onAdd).toBeDefined();
            if (control.onAdd) {
                control.onAdd(map);
            }
            expect(map.on).toHaveBeenCalledWith("locationfound", control._handleLocationFound, control);
            expect(map.on).toHaveBeenCalledWith("locationerror", control._handleLocationError, control);
        });

        it("should remove event listeners on onRemove", () => {
            const control = getLocateControl(location);
            const map = {
                off: vi.fn(),
            } as any;
            control.container = {} as HTMLElement;
            expect(control.onRemove).toBeDefined();
            if (control.onRemove) {
                control.onRemove(map);
            }
            expect(L.DomEvent.off).toHaveBeenCalledWith(control.container);
            expect(map.off).toHaveBeenCalledWith("locationfound", control._handleLocationFound, control);
            expect(map.off).toHaveBeenCalledWith("locationerror", control._handleLocationError, control);
        });
    });
});
