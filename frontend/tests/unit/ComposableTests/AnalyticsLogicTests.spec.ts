import { drawHistogramWithKDE } from '../../../src/composables/Analysis/DataVisualizationLogic';
import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe('drawHistogramWithKDE', () => {
    let container: HTMLDivElement;

    /**
     * Create DOM element to render the histogram into.
     */
    beforeEach(() => {
        container = document.createElement('div');
        container.style.width = '400px';
        container.style.height = '300px';
        document.body.appendChild(container);
    });

    /**
     * Remove the container to clean up DOM.
     */
    afterEach(() => {
        document.body.removeChild(container);
    });

    it('renders a histogram and KDE line - multiple measurements', () => {
        const data = [1, 2, 2, 3, 3, 3, 4, 5];
        drawHistogramWithKDE(container, data, "steelblue", "orange");

        const svg = container.querySelector('svg');
        expect(svg).not.toBeNull();

        const rects = svg!.querySelectorAll('rect');
        expect(rects.length).toBeGreaterThan(0);

        const path = svg!.querySelector('path');
        expect(path).not.toBeNull();
    });

    it('renders a histogram and KDE line - single measurement', () => {
        const data = [1];
        drawHistogramWithKDE(container, data, "steelblue", "orange");

        const svg = container.querySelector('svg');
        expect(svg).not.toBeNull();

        const rects = svg!.querySelectorAll('rect');
        expect(rects.length).toBeGreaterThan(0);

        const path = svg!.querySelector('path');
        expect(path).not.toBeNull();
    });
});
