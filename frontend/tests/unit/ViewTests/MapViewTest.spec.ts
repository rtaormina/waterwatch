import { mount } from "@vue/test-utils";
import { describe, it, expect, beforeEach, vi } from "vitest";

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
vi.mock("../../../src/components/Modal.vue", () => ({
  name: "Modal",
  props: ["visible"],
  template: `
    <div v-if="visible" class="modal" role="dialog">
      <slot></slot>
      <button class="modal-close-btn" @click="$emit('close')">Close</button>
    </div>
  `,
}));
vi.mock("@vuepic/vue-datepicker/dist/main.css", () => ({}));
vi.mock("@vuepic/vue-datepicker", () => ({
    default: {
        name: "VueDatePicker",
        template: `
            <input 
                data-testid="vue-datepicker"
                :value="modelValue" 
                @input="$emit('update:modelValue', $event.target.value)"
                :placeholder="placeholder"
            />
        `,
        props: [
            'modelValue', 
            'enableTimePicker', 
            'timePickerInline', 
            'maxDate', 
            'placeholder', 
            'dark'
        ],
        emits: ['update:modelValue']
    }
}));
vi.mock("@asymmetrik/leaflet-d3", () => {
  return { default: {} };
});
import MapView from "../../../src/views/MapView.vue";


describe("MapView first-time modal appears", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("shows modal on first mount, hides on close, and sets localStorage", async () => {
    const wrapper = mount(MapView, {
      global: {
        stubs: {
          CampaignBannerComponent: true,
          HexMap: true,
          MeasurementComponent: true,
          DataAnalyticsComponent: true,
          Legend: true,
          VueDatePicker: {
                    template: '<input data-testid="vue-datepicker" />',
                    props: ['modelValue', 'enableTimePicker', 'timePickerInline', 'maxDate', 'placeholder', 'dark'],
                    emits: ['update:modelValue']
                }
        },
      },
    });

    expect(localStorage.getItem("mapViewVisited")).toBe("true");

    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="modal"]').isVisible()).toBe(true);

    expect(wrapper.find('[data-testid="view-button"]').exists()).toBe(true);
    await wrapper.find('[data-testid="view-button"]').trigger("click");
    await wrapper.vm.$nextTick();

    expect(localStorage.getItem("mapViewVisited")).toBe("true");
  });

});