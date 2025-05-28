import * as d3 from "d3";

/**
 * Creates a kernel density estimator function.
 *
 * @param kernel the kernel function to use for the density estimation.
 * @param X the x values for which to estimate the density.
 * @returns the kernel density estimator function.
 */
function kernelDensityEstimator(kernel, X) {
    return (V) => X.map((x) => [x, d3.mean(V, (v) => kernel(x - v))]);
}

/**
 * Creates an Epanechnikov kernel function with a specified bandwith.
 *
 * @param k The bandwidth parameter for the Epanechnikov kernel.
 * @returns The Epanechnikov kernel function.
 */
function kernelEpanechnikov(k) {
    return (v) => (Math.abs((v /= k)) <= 1 ? (0.75 * (1 - v * v)) / k : 0);
}

/**
 * Creates an SVG container for the graphs.
 *
 * @param {HTMLElement} el The HTML element to append the SVG to.
 * @param {number} width the width of the SVG container.
 * @param {number} height the height of the SVG container.
 * @param margin the margins of the SVG container.
 * @returns The created SVG container as a D3 selection.
 */
function createSVGContainer(
    el: HTMLElement,
    width: number,
    height: number,
    margin: { top: number; right: number; bottom: number; left: number },
) {
    return d3
        .select(el)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
}

/**
 * Draws a histogram with the x axis being the measurement data points and the y axis their frequency.
 * It also estimates the kernel density of the data using a Epanechnikov kernel and draws it as a line on top of the histogram.
 *
 * @param {HTMLElement} el The HTML element to draw the histogram in.
 * @param {number[]} data The data to visualize in the histogram.
 */
export function drawHistogram(el: HTMLElement, data: number[]) {
    const margin = { top: 30, right: 30, bottom: 30, left: 30 };
    const width = el.clientWidth - margin.left - margin.right;
    const height = el.clientHeight - margin.top - margin.bottom;

    d3.select(el).selectAll("*").remove();

    const svg = createSVGContainer(el, width, height, margin);

    let xDomain = d3.extent(data);
    if (xDomain[0] === xDomain[1]) {
        xDomain = [xDomain[0] - 0.5, xDomain[1] + 0.5];
    }
    const x = d3.scaleLinear().domain(xDomain).nice().range([0, width]);

    let thresholds = x.ticks(20);
    if (thresholds.length < 2) {
        thresholds = [xDomain[0], xDomain[1]];
    }

    // Create bins on histogram
    const bins = d3.bin().domain(x.domain()).thresholds(thresholds)(data);

    // Create y-axis
    const y = d3
        .scaleLinear()
        .domain([0, d3.max(bins, (d) => d.length)])
        .nice()
        .range([height, 0]);

    // Add bars to the svg
    svg.selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
        .attr("x", (d) => x(d.x0))
        .attr("y", (d) => y(d.length))
        .attr("width", (d) => x(d.x1) - x(d.x0) - 1)
        .attr("height", (d) => height - y(d.length))
        .attr("fill", "#69b3a2");

    // Create KDE line
    const kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(100));
    const density = kde(data);

    const yKde = d3
        .scaleLinear()
        .domain([0, d3.max(density, (d) => d[1])])
        .range([height, 0]);

    const line = d3
        .line()
        .curve(d3.curveBasis)
        .x((d) => x(d[0]))
        .y((d) => yKde(d[1]));

    // Add KDE line to svg
    svg.append("path")
        .datum(density)
        .attr("fill", "none")
        .attr("stroke", "#ff6600")
        .attr("stroke-width", 2)
        .attr("d", line);

    // Add axes to svg and format them
    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
    svg.append("g").call(
        d3
            .axisLeft(y)
            .ticks(y.domain()[1])
            .tickFormat((d) => (Number.isInteger(d) ? d : "")),
    );
}
