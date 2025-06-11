import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";
import HexAnalysis from "../../../../src/components/Analysis/HexAnalysis.vue";


describe("HexAnalysis.vue", () => {
    const onOpenDetails = vi.fn();
    const onClose = vi.fn();

    it("calls close and openDetails", async () => {
        const points = [
            {
                o: {
                    temperature: 12,
                    min: 5,
                    max: 32,
                    count: 7,
                },
            },
        ];
        const wrapper = mount(HexAnalysis, {
            props: { points, onOpenDetails, onClose },
        });

        const submit = wrapper.findAll('[data-testid="submit"]')[0];
        await submit.trigger("click");
        expect(onOpenDetails).toHaveBeenCalledOnce();
        expect(onClose).toHaveBeenCalledOnce();
    });

    it("computes count correctly across one value", () => {
        const points = [
            {
                o: {
                    temperature: 12,
                    min: 5,
                    max: 32,
                    count: 7,
                },
            },
        ];
        const wrapper = mount(HexAnalysis, {
            props: { points, onOpenDetails, onClose },
        });
        const count = wrapper.findAll('[data-testid="count"]')[0];
        expect(count.text()).toBe("7 Measurements");
    });

    it("computes count correctly across multiple values", () => {
        const points = [
            {
                o: {
                    temperature: 12,
                    min: 5,
                    max: 32,
                    count: 7,
                },
            },
            {
                o: {
                    temperature: 15,
                    min: 14,
                    max: 16,
                    count: 3,
                },
            },
        ];
        const wrapper = mount(HexAnalysis, {
            props: { points, onOpenDetails, onClose },
        });
        const count = wrapper.findAll('[data-testid="count"]')[0];
        expect(count.text()).toBe("10 Measurements");
    });

    it("computes average correctly across one value", () => {
        const points = [
            {
                o: {
                    temperature: 12,
                    min: 5,
                    max: 32,
                    count: 7,
                },
            },
        ];
        const wrapper = mount(HexAnalysis, {
            props: { points, onOpenDetails, onClose },
        });
        const avgVal = wrapper.findAll('[data-testid="avg"]')[0];
        expect(avgVal.text()).toBe("Avg: 12.0°C");
    });

    it("computes average correctly across multiple values", () => {
        const points = [
            {
                o: {
                    temperature: 12,
                    min: 5,
                    max: 32,
                    count: 7,
                },
            },
            {
                o: {
                    temperature: 15,
                    min: 14,
                    max: 16,
                    count: 3,
                },
            },
        ];
        const wrapper = mount(HexAnalysis, {
            props: { points, onOpenDetails, onClose },
        });
        const avgVal = wrapper.findAll('[data-testid="avg"]')[0];
        expect(avgVal.text()).toBe("Avg: 12.9°C");
    });

    it("computes min/max correctly across one value", () => {
        const points = [
            {
                o: {
                    temperature: 12,
                    min: 5,
                    max: 32,
                    count: 7,
                },
            },
        ];
        const wrapper = mount(HexAnalysis, {
            props: { points, onOpenDetails, onClose },
        });
        const minVal = wrapper.findAll('[data-testid="min"]')[0];
        const maxVal = wrapper.findAll('[data-testid="max"]')[0];
        expect(minVal.text()).toBe("Min: 5.0°C");
        expect(maxVal.text()).toBe("Max: 32.0°C");
    });

    it("computes average correctly across multiple values", () => {
        const points = [
            {
                o: {
                    temperature: 12,
                    min: 5,
                    max: 32,
                    count: 7,
                },
            },
            {
                o: {
                    temperature: 15,
                    min: 14,
                    max: 50,
                    count: 3,
                },
            },
        ];
        const wrapper = mount(HexAnalysis, {
            props: { points, onOpenDetails, onClose },
        });
        const minVal = wrapper.findAll('[data-testid="min"]')[0];
        const maxVal = wrapper.findAll('[data-testid="max"]')[0];
        expect(minVal.text()).toBe("Min: 5.0°C");
        expect(maxVal.text()).toBe("Max: 50.0°C");
    });
});
