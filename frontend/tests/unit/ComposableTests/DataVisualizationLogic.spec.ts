import { describe, it, expect, beforeEach, vi } from "vitest";
import { Window } from "happy-dom";

import {
    kernelEpanechnikov,
    kernelDensityEstimator,
    createSVGContainer,
    getGraphData,
    drawHistogramWithKDE,
    drawComparisonGraph,
} from "../../../src/composables/DataVisualizationLogic";

describe("kernelEpanechnikov", () => {
    it("returns correct density inside bandwidth and zero outside", () => {
        const bandwidth = 2;
        const kernel = kernelEpanechnikov(bandwidth);

        // At v = 0, u = 0 -> density = 0.75 * (1 - 0) / 2 = 0.375
        expect(kernel(0)).toBeCloseTo(0.375);

        // At v = bandwidth (=2), u = 1 -> density = (0.75 * (1 - 1))/2 = 0
        expect(kernel(bandwidth)).toBeCloseTo(0);

        // At v > bandwidth -> density = 0
        expect(kernel(bandwidth * 1.5)).toBeCloseTo(0);

        // At v = bandwidth/2 (=1), u = 0.5 -> density = 0.75 * (1 - 0.25) / 2 = 0.28125
        expect(kernel(bandwidth / 2)).toBeCloseTo((0.75 * (1 - 0.25)) / bandwidth);
    });
});

describe("kernelDensityEstimator", () => {
    it("computes densities as mean of kernel values", () => {
        // Use a trivial kernel f(x) = x^2 to make expectations easy
        const kernel = (x: number) => x * x;
        const X = [1, 2, 3];
        const estimator = kernelDensityEstimator(kernel, X);

        // For V = [1, 2]:
        // - At x=1: kernel(1−1)=0, kernel(1−2)=1 -> mean = 0.5
        // - At x=2: kernel(2−1)=1, kernel(2−2)=0 -> mean = 0.5
        // - At x=3: kernel(3−1)=4, kernel(3−2)=1 -> mean = 2.5
        const result = estimator([1, 2]);
        expect(result).toEqual([
            [1, 0.5],
            [2, 0.5],
            [3, 2.5],
        ]);
    });
});

describe("createSVGContainer", () => {
    let container: HTMLElement;
    let window: Window;

    beforeEach(() => {
        // Create a new Happy DOM window for each test
        window = new Window();
        global.document = window.document as any;
        global.window = window as any;

        // Set up the DOM structure
        window.document.body.innerHTML = '<div id="root"></div>';
        container = window.document.getElementById("root") as unknown as HTMLElement;

        // Mock container dimensions for D3 scales
        Object.defineProperty(container, "clientWidth", {
            value: 400,
            configurable: true,
        });
        Object.defineProperty(container, "clientHeight", {
            value: 300,
            configurable: true,
        });
    });

    it("appends an <svg> with correct width/height and returns a <g> translated by margins", () => {
        const margin = { top: 10, right: 10, bottom: 10, left: 10 };
        const width = 100;
        const height = 80;

        const gSelection = createSVGContainer(container, width, height, margin);

        // After calling createSVGContainer, an <svg> should be appended under `container`
        const svg = container.querySelector("svg");
        expect(svg).not.toBeNull();
        expect(svg!.getAttribute("width")).toBe((width + margin.left + margin.right).toString());
        expect(svg!.getAttribute("height")).toBe((height + margin.top + margin.bottom).toString());

        // The returned D3 selection should be a <g> element with a translate(...) transform
        const gElement = container.querySelector("svg > g");
        expect(gElement).not.toBeNull();
        expect(gElement!.getAttribute("transform")).toBe(`translate(${margin.left},${margin.top})`);
    });
});

describe("getGraphData", () => {
    beforeEach(() => {
        // Reset global.fetch before each test
        (global.fetch as any) = vi.fn();
    });

    it("returns empty array if WKT is falsy", async () => {
        const data = await getGraphData("");
        expect(data).toEqual([]);
    });

    it("fetches data and converts to numbers", async () => {
        const mockJson = vi.fn().mockResolvedValue(["1", "2", "3"]);
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: mockJson,
        });

        const data = await getGraphData("MULTIPOLYGON((...))");
        expect(global.fetch).toHaveBeenCalledWith(`/api/measurements/?boundary_geometry=MULTIPOLYGON((...))`);
        // Since JSON returned ["1","2","3"], getGraphData maps each to Number
        expect(data).toEqual([1, 2, 3]);
    });

    it("returns empty array on fetch error", async () => {
        (global.fetch as any).mockRejectedValue(new Error("Network Error"));
        const data = await getGraphData("POLYGON((...))");
        expect(data).toEqual([]);
    });
});

describe("drawHistogramWithKDE", () => {
    let container: HTMLElement;
    let window: Window;

    beforeEach(() => {
        // Create a new Happy DOM window for each test
        window = new Window();
        global.document = window.document as any;
        global.window = window as any;

        // Set up the DOM structure
        window.document.body.innerHTML = '<div id="chart"></div>';
        container = window.document.getElementById("chart") as unknown as HTMLElement;

        // Mock container dimensions
        Object.defineProperty(container, "clientWidth", {
            value: 500,
            configurable: true,
        });
        Object.defineProperty(container, "clientHeight", {
            value: 400,
            configurable: true,
        });
    });

    it("does nothing when data array is empty", () => {
        drawHistogramWithKDE(container, [], "#000", "#fff");
        // No children should be appended under `container`
        expect(container.children.length).toBe(0);
    });

    it("draws histogram bars and a single KDE <path> when data is provided", () => {
        const data = [1, 2, 3, 4, 5];
        drawHistogramWithKDE(container, data, "steelblue", "tomato", {
            numBins: 5,
            numKdePoints: 10,
        });

        // Should have histogram bars (excluding legend rectangle)
        const svg = container.querySelector("svg");
        let histogramBars: NodeListOf<Element> = [] as any;
        if (svg) {
            const g = svg.querySelector("g");
            if (g) {
                histogramBars = g.querySelectorAll("rect");
            }
        }
        expect(histogramBars.length).toBeGreaterThan(0);
        histogramBars.forEach((rect) => {
            expect(rect.getAttribute("fill")).toBe("steelblue");
        });

        // Should have a single KDE path
        const paths = container.querySelectorAll("path");
        expect(paths.length).toBeGreaterThan(0);

        // Should have legend and axis labels with the correct text
        const allTexts = container.querySelectorAll("text");
        const allTextContent = Array.from(allTexts).map((t) => t.textContent);

        // Check for axis labels
        expect(allTextContent).toContain("Frequency");
        expect(allTextContent).toContain("Measurement Value");

        // Check for KDE legend
        expect(allTextContent).toContain("KDE (density)");

        // Should have the legend rectangle
        const legendRect = container.querySelector("rect[fill='tomato']");
        expect(legendRect).not.toBeNull();
    });
});

describe("drawComparisonGraph", () => {
    let container: HTMLElement;
    let window: Window;

    beforeEach(() => {
        // Create a new Happy DOM window for each test
        window = new Window();
        global.document = window.document as any;
        global.window = window as any;

        // Set up the DOM structure
        window.document.body.innerHTML = '<div id="comparison"></div>';
        container = window.document.getElementById("comparison") as unknown as HTMLElement;

        // Mock container dimensions
        Object.defineProperty(container, "clientWidth", {
            value: 600,
            configurable: true,
        });
        Object.defineProperty(container, "clientHeight", {
            value: 500,
            configurable: true,
        });
    });

    it("does nothing when both value arrays are empty", () => {
        drawComparisonGraph(container, [], [], {});
        expect(container.children.length).toBe(0);
    });

    it("draws two histograms, two KDE paths, and a two-entry legend", () => {
        const vals1 = [1, 2, 3, 4, 5];
        const vals2 = [2, 3, 4, 5, 6];
        drawComparisonGraph(container, vals1, vals2, {
            numBins: 5,
            numKdePoints: 10,
        });

        // Test for the presence of specific elements rather than counting all

        // Should have histogram bars for both groups
        const rectsGroup1 = container.querySelectorAll("rect.group1");
        const rectsGroup2 = container.querySelectorAll("rect.group2");
        expect(rectsGroup1.length).toBeGreaterThan(0);
        expect(rectsGroup2.length).toBeGreaterThan(0);

        // Should have legend with specific text
        const allTexts = container.querySelectorAll("text");
        const allTextContent = Array.from(allTexts).map((t) => t.textContent);
        expect(allTextContent).toContain("Group 1");
        expect(allTextContent).toContain("Group 2");

        // Should have paths
        const paths = container.querySelectorAll("path");
        expect(paths.length).toBeGreaterThan(0);

        // Should have the legend background
        const legendBg = container.querySelector("rect[fill='white'][stroke='#ccc']");
        expect(legendBg).not.toBeNull();
    });
});
