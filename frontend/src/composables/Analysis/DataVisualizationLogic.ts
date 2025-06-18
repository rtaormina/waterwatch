// DataVisualizationLogic.ts
import axios from "axios";
import * as d3 from "d3";
import Cookies from "universal-cookie";
import { flattenSearchParams, type MeasurementSearchParams } from "../Export/useSearch";

const cookies = new Cookies();

/**
 * Creates an Epanechnikov kernel function with a specified bandwidth.
 *
 * @param bandwidth  The smoothing bandwidth (h). Larger h → smoother curve.
 * @returns {Function} A kernel function that takes a value v and returns the kernel density estimate.
 */
export function kernelEpanechnikov(bandwidth: number): (v: number) => number {
    return (v: number) => {
        const u = v / bandwidth;
        if (Math.abs(u) <= 1) {
            return (0.75 * (1 - u * u)) / bandwidth;
        } else {
            return 0;
        }
    };
}

/**
 * Creates a kernel density estimator function.
 *
 * @param kernel  A kernel function (e.g. kernelEpanechnikov(bandwidth)).
 * @param X       An array of x-values at which to evaluate the density.
 * @returns {Function} A function that takes an array of values V and returns an array of [x, density] pairs.
 */
export function kernelDensityEstimator(
    kernel: (x: number) => number,
    X: number[],
): (V: number[]) => Array<[number, number]> {
    return (V: number[]) =>
        X.map((x) => {
            const meanDensity = d3.mean(V, (v: number) => kernel(x - v)) || 0;
            return [x, meanDensity];
        });
}

/**
 * Utility: Creates an SVG container and a top‐level <g> group translated by the margins.
 *
 * @param el       The HTML element to append the <svg> to.
 * @param width    The inner width (excluding left/right margins).
 * @param height   The inner height (excluding top/bottom margins).
 * @param margin   An object with { top, right, bottom, left } margins.
 * @returns {d3.Selection<SVGGElement, unknown, null, undefined>} The top‐level <g> group.
 */
export function createSVGContainer(
    el: HTMLElement,
    width: number,
    height: number,
    margin: { top: number; right: number; bottom: number; left: number },
): d3.Selection<SVGGElement, unknown, null, undefined> {
    return d3
        .select(el)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
}

/**
 * Fetches numeric values for the given location and returns them.
 *
 * @param {string} location The location for the measurements.
 * @param {string} month The month for which to fetch the measurements.
 * @returns the numeric values for the temperatures
 */
export async function getGraphData(location?: string, month?: string): Promise<number[]> {
    try {
        const response = location
            ? await axios.post(
                  `/api/measurements/temperatures/`,
                  { boundary_geometry: location, month: month },
                  {
                      headers: {
                          "Content-Type": "application/json",
                          "X-CSRFToken": cookies.get("csrftoken"),
                      },
                  },
              )
            : await axios.post(
                  `/api/measurements/temperatures/`,
                  { month: month },
                  {
                      headers: {
                          "Content-Type": "application/json",
                          "X-CSRFToken": cookies.get("csrftoken"),
                      },
                  },
              );
        const data = response.data;

        return data.map(Number);
    } catch (error) {
        console.error("Error fetching hexbin data:", error);
        return [];
    }
}

/**
 * Fetches numeric values for the given location and returns them.
 *
 * @param {string} location The location for the measurements.
 * @returns the numeric values for the temperatures
 */
export async function getGraphDataExportMapView(
    exportFilters: MeasurementSearchParams,
    hexagon?: string,
    legendMonth?: string,
): Promise<number[]> {
    const bodyData = {
        ...flattenSearchParams(exportFilters),
        boundary_geometry: hexagon,
        month: legendMonth,
        format: "analysis-format",
    };

    console.log("Right endpoint called");

    const res = await fetch("/api/measurements/search/", {
        method: "POST",
        headers: {
            "X-CSRFToken": cookies.get("csrftoken"),
            "Content-Type": "application/json", // Set Content-Type for JSON payload
        },
        credentials: "same-origin",
        body: JSON.stringify(bodyData), // Send data as a JSON string in the body
    });

    if (!res.ok) throw new Error(`Status: ${res.status}`);
    return await res.json();
}

/**
 * Draws a single‐group histogram with an overlaid KDE curve.
 *
 * @param el          The container HTMLElement.
 * @param data        An array of numeric values (e.g. temperatures).
 * @param barColor    CSS color for the histogram bars (e.g. "#1f449c").
 * @param lineColor   CSS color for the KDE curve (e.g. "#f05039").
 * @param options?    Optional settings:
 *   - barOpacity?: number     Opacity for the bars, between 0.0 and 1.0 (default: 1.0).
 *   - bandwidth?: number      If provided, overrides default (extent/30).
 *   - numBins?: number        Number of histogram bins (default: 20).
 *   - numKdePoints?: number   Number of points at which to evaluate KDE (default: 100).
 * @returns {void}
 */
export function drawHistogramWithKDE(
    el: HTMLElement,
    data: number[],
    barColor: string,
    lineColor: string,
    options?: {
        barOpacity?: number;
        bandwidth?: number;
        numBins?: number;
        numKdePoints?: number;
    },
) {
    // 1. Set up margins and dimensions
    const margin = { top: 40, right: 20, bottom: 40, left: 50 };
    const width = el.clientWidth - margin.left - margin.right;
    const height = el.clientHeight - margin.top - margin.bottom;

    const numBins = options?.numBins ?? 20;
    const numKdePoints = options?.numKdePoints ?? 100;
    const barOpacity = options?.barOpacity ?? 1.0; // default to fully opaque

    // Clear any old content
    d3.select(el).selectAll("*").remove();

    if (!data || data.length === 0) {
        // Nothing to draw
        return;
    }

    // 2. Create the SVG container (appends <svg> + <g translated by margins>)
    const svg = createSVGContainer(el, width, height, margin);

    // 3. Compute x‐domain (with padding of ±1)
    let xExtent: [number, number] = d3.extent(data) as [number, number];
    xExtent = [xExtent[0] - 1, xExtent[1] + 1];
    const x = d3.scaleLinear().domain(xExtent).nice().range([0, width]);

    // 4. Create histogram bins
    const histogramGenerator = d3
        .bin<number, number>()
        .domain(x.domain() as [number, number])
        .thresholds(x.ticks(numBins));
    const bins = histogramGenerator(data);

    // 5. Y‐scale for histogram (frequency)
    const maxFreq = d3.max(bins, (d) => d.length) || 0;
    const yFreq = d3.scaleLinear().domain([0, maxFreq]).nice().range([height, 0]);

    // 6. Draw histogram bars
    svg.selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
        .attr("x", (d) => x(d.x0!))
        .attr("y", (d) => yFreq(d.length))
        .attr("width", (d) => x(d.x1!) - x(d.x0!) - 1)
        .attr("height", (d) => height - yFreq(d.length))
        .attr("fill", barColor)
        .attr("fill-opacity", barOpacity);

    // 7. Compute bandwidth (either user‐supplied or rule‐of‐thumb)
    const domainSpan = xExtent[1] - xExtent[0];
    const bandwidth = options?.bandwidth ?? domainSpan / 30;

    // 8. Compute the KDE curve on a grid of numKdePoints
    const xTicksArr = x.ticks(numKdePoints);
    const kdeEstimator = kernelDensityEstimator(kernelEpanechnikov(bandwidth), xTicksArr);
    const density: Array<[number, number]> = kdeEstimator(data);

    // 9. Y‐scale for KDE (density)
    const maxDensity = d3.max(density, (d) => d[1]) || 0;
    const yKde = d3.scaleLinear().domain([0, maxDensity]).nice().range([height, 0]);

    // 10. Draw KDE line
    const kdeLine: d3.Line<[number, number]> = d3
        .line<[number, number]>()
        .curve(d3.curveBasis)
        .x((d) => x(d[0]))
        .y((d) => yKde(d[1]));

    svg.append("path")
        .datum(density)
        .attr("fill", "none")
        .attr("stroke", lineColor)
        .attr("stroke-width", 2)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("d", kdeLine as any);

    // 11. Draw axes and labels
    // Y‐axis (frequency)
    svg.append("g").call(
        d3
            .axisLeft(yFreq)
            .ticks(6)
            .tickFormat((d) => (Number.isInteger(d as number) ? d : "") as string),
    );
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("text-anchor", "middle")
        .attr("fill", "var(--text-color-default)")
        .text("Frequency");

    // X‐axis (measurement)
    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 5)
        .attr("text-anchor", "middle")
        .attr("fill", "var(--text-color-default)")
        .text("Measurement Value");

    // 12. Add a small legend for "KDE (density)" in the top‐right corner
    const outerSvg = d3.select(el).select("svg");
    outerSvg
        .append("rect")
        .attr("x", width + margin.left - 28)
        .attr("y", margin.top - 16)
        .attr("width", 18)
        .attr("height", 6)
        .attr("fill", lineColor);

    outerSvg
        .append("text")
        .attr("x", width + margin.left - 33)
        .attr("y", margin.top - 10)
        .attr("alignment-baseline", "middle")
        .attr("text-anchor", "end")
        .attr("fill", "var(--text-color-default)")
        .style("font-size", "12px")
        .text("KDE (density)");
}

/**
 * Draws two semi‐transparent histograms (Group 1 + Group 2) plus their overlaid KDE curves.
 *
 * @param el        The container HTMLElement.
 * @param vals1     Numeric values for Group 1 (e.g. [11, 12, 12, 13, …]).
 * @param vals2     Numeric values for Group 2 (e.g. [20, 21, 22, …]).
 * @param options?  Optional settings:
 *   - barOpacity?: number     Opacity for both groups' bars (default: 0.15).
 *   - barColor1?: string      Color for Group 1 bars (default: "steelblue").
 *   - lineColor1?: string     Color for Group 1 KDE line (default: "steelblue").
 *   - barColor2?: string      Color for Group 2 bars (default: "crimson").
 *   - lineColor2?: string     Color for Group 2 KDE line (default: "crimson").
 *   - bandwidth?: number      If provided, overrides default (extent/30).
 *   - numBins?: number        Number of histogram bins (default: 20).
 *   - numKdePoints?: number   Number of points at which to evaluate KDE (default: 100).
 * @return {void}
 */
export function drawComparisonGraph(
    el: HTMLElement,
    vals1: number[],
    vals2: number[],
    options?: {
        barOpacity?: number;
        barColor1?: string;
        lineColor1?: string;
        barColor2?: string;
        lineColor2?: string;
        bandwidth?: number;
        numBins?: number;
        numKdePoints?: number;
    },
) {
    // 1. Set up margins and dimensions
    const margin = { top: 60, right: 20, bottom: 40, left: 50 };
    const width = el.clientWidth - margin.left - margin.right;
    const height = el.clientHeight - margin.top - margin.bottom;

    const numBins = options?.numBins ?? 20;
    const numKdePoints = options?.numKdePoints ?? 100;
    const barOpacity = options?.barOpacity ?? 0.15;

    // Default colors if not provided
    const barColor1 = options?.barColor1 ?? "steelblue";
    const lineColor1 = options?.lineColor1 ?? "steelblue";
    const barColor2 = options?.barColor2 ?? "crimson";
    const lineColor2 = options?.lineColor2 ?? "crimson";

    // Clear any previous content
    d3.select(el).selectAll("*").remove();

    // If both groups are empty, do nothing
    if ((!vals1 || vals1.length === 0) && (!vals2 || vals2.length === 0)) {
        return;
    }

    // 2. Compute a common x‐domain over both groups (with ±1 padding)
    const allVals = (vals1 || []).concat(vals2 || []);
    let xExtent = d3.extent(allVals) as [number, number];
    xExtent = [xExtent[0] - 1, xExtent[1] + 1];
    const x = d3.scaleLinear().domain(xExtent).nice().range([0, width]);

    // 3. Create the SVG container
    const svg = createSVGContainer(el, width, height, margin);

    // 4. Generate histogram bins for each group using the same thresholds
    const histogramGenerator = d3
        .bin<number, number>()
        .domain(x.domain() as [number, number])
        .thresholds(x.ticks(numBins));

    const bins1 = histogramGenerator(vals1 || []);
    const bins2 = histogramGenerator(vals2 || []);

    // 5. Find max frequency across both groups
    const maxFreq1 = d3.max(bins1, (d) => d.length) || 0;
    const maxFreq2 = d3.max(bins2, (d) => d.length) || 0;
    const maxFreq = Math.max(maxFreq1, maxFreq2);

    // Y‐scale for frequency
    const yFreq = d3.scaleLinear().domain([0, maxFreq]).nice().range([height, 0]);

    // 6. Draw semi‐transparent bars for Group 1
    svg.selectAll("rect.group1")
        .data(bins1)
        .enter()
        .append("rect")
        .attr("class", "group1")
        .attr("x", (d) => x(d.x0!))
        .attr("y", (d) => yFreq(d.length))
        .attr("width", (d) => x(d.x1!) - x(d.x0!) - 1)
        .attr("height", (d) => height - yFreq(d.length))
        .attr("fill", barColor1)
        .attr("fill-opacity", barOpacity);

    // 7. Draw semi‐transparent bars for Group 2 (offset by +1 px)
    svg.selectAll("rect.group2")
        .data(bins2)
        .enter()
        .append("rect")
        .attr("class", "group2")
        .attr("x", (d) => x(d.x0!) + 1) // shift right by 1px so you can see overlap
        .attr("y", (d) => yFreq(d.length))
        .attr("width", (d) => x(d.x1!) - x(d.x0!) - 1)
        .attr("height", (d) => height - yFreq(d.length))
        .attr("fill", barColor2)
        .attr("fill-opacity", barOpacity);

    // 8. Draw Y‐axis (frequency)
    svg.append("g").call(
        d3
            .axisLeft(yFreq)
            .ticks(6)
            .tickFormat((d) => (Number.isInteger(d as number) ? d : "") as string),
    );
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("text-anchor", "middle")
        .attr("fill", "var(--text-color-default)")
        .text("Frequency");

    // 9. Draw X‐axis (measurement)
    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 5)
        .attr("text-anchor", "middle")
        .attr("fill", "var(--text-color-default)")
        .text("Measurement Value");

    // 10. Compute shared bandwidth and KDE curves for both groups
    const domainSpan = xExtent[1] - xExtent[0];
    const bandwidth = options?.bandwidth ?? domainSpan / 30;
    const xTicksArr = x.ticks(numKdePoints);

    const kdeEstimator = kernelDensityEstimator(kernelEpanechnikov(bandwidth), xTicksArr);
    const kde1: Array<[number, number]> = kdeEstimator(vals1 || []);
    const kde2: Array<[number, number]> = kdeEstimator(vals2 || []);

    // Y‐scale for density (so both curves share the same vertical scale)
    const maxDensity1 = d3.max(kde1, (d) => d[1]) || 0;
    const maxDensity2 = d3.max(kde2, (d) => d[1]) || 0;
    const maxDensity = Math.max(maxDensity1, maxDensity2);
    const yKde = d3.scaleLinear().domain([0, maxDensity]).nice().range([height, 0]);

    // 11. Draw KDE lines
    const kdeLine: d3.Line<[number, number]> = d3
        .line<[number, number]>()
        .curve(d3.curveBasis)
        .x((d) => x(d[0]))
        .y((d) => yKde(d[1]));

    // Group 1 KDE
    svg.append("path")
        .datum(kde1)
        .attr("fill", "none")
        .attr("stroke", lineColor1)
        .attr("stroke-width", 2)
        .attr("opacity", 0.6)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("d", kdeLine as any);

    // Group 2 KDE
    svg.append("path")
        .datum(kde2)
        .attr("fill", "none")
        .attr("stroke", lineColor2)
        .attr("stroke-width", 2)
        .attr("opacity", 0.6)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("d", kdeLine as any);

    // 12. Add a two‐entry legend in the top‐right corner
    const legendWidth = 100;
    const legendHeight = 50;
    const legendX = width - legendWidth;
    const legendY = -60; // place inside the top margin

    const legend = svg.append("g").attr("transform", `translate(${legendX}, ${legendY})`);

    // Background rectangle for legend
    legend
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .attr("fill", "var(--background-color-muted)")
        .attr("stroke", "var(--text-color-toned)")
        .attr("rx", 4);

    // Group 1 legend entry
    legend
        .append("line")
        .attr("x1", 10)
        .attr("y1", 15)
        .attr("x2", 30)
        .attr("y2", 15)
        .attr("stroke", lineColor1)
        .attr("stroke-width", 2);
    legend
        .append("text")
        .attr("x", 35)
        .attr("y", 18)
        .attr("fill", "var(--text-color-default)")
        .style("font-size", "12px")
        .text("Group 1");

    // Group 2 legend entry
    legend
        .append("line")
        .attr("x1", 10)
        .attr("y1", 35)
        .attr("x2", 30)
        .attr("y2", 35)
        .attr("stroke", lineColor2)
        .attr("stroke-width", 2);
    legend
        .append("text")
        .attr("x", 35)
        .attr("y", 38)
        .attr("fill", "var(--text-color-default)")
        .style("font-size", "12px")
        .text("Group 2");
}
