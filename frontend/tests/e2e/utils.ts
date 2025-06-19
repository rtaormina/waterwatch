import type { Page } from "@playwright/test";

export interface AddMeasurementOpts {
    timestamp: string; // e.g. "2025-05-26T14:30:00Z"
    localDate: string; // e.g. "2025-05-26"
    localTime: string; // e.g. "14:30:00"
    latitude: number; // e.g. 52.3676
    longitude: number; // e.g. 4.9041
    waterSource: string; // e.g. "Well"
    temperature?: {
        // optional nested object
        sensor: string; // e.g. "Analog Thermometer"
        value: number; // e.g. 18.3
        time_waited: number; // e.g. 5
    };
}

/**
 * Adds a new measurement to the database.
 *
 * @param page Playwright Page object to interact with the browser.
 * @param opts Options for the measurement to be added.
 * @param url Base URL for the application.
 */
export async function addMeasurement(page: Page, opts: AddMeasurementOpts, url: string) {
    await page.goto(url + "login");

    const err = await page.evaluate(async (m) => {
        const match = document.cookie.match(/csrftoken=([^;]+)/);
        if (!match) return "no csrf cookie";
        const token = match[1];
        const resp = await fetch("/api/measurements/", {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": token,
            },
            body: JSON.stringify({
                timestamp: m.timestamp,
                local_date: m.localDate,
                local_time: m.localTime,
                water_source: m.waterSource,
                location: { type: "Point", coordinates: [m.longitude, m.latitude] },
                ...(m.temperature && { temperature: m.temperature }),
            }),
        });
        if (!resp.ok) {
            const text = await resp.text();
            return `status ${resp.status}: ${text}`;
        }
        return null;
    }, opts);

    if (err) throw new Error("addMeasurement failed: " + err);
}

/**
 * Clicks a button identified by a test ID.
 * @param page the current page
 * @param testId the test ID of the button
 */
export async function clickButton(page: Page, testId: string) {
    await page.getByTestId(testId).click();
}

/**
 * Select an option from a dropdown
 * @param page the current page
 * @param testId the test ID of the dropdown
 * @param option the option to select from the dropdown
 */
async function selectFromDropdown(page:Page, testId: string, option: string) {
    await page.getByTestId(testId).click();
    await page.waitForSelector(`text=${option}`);
    await page.locator(`text=${option}`).click();
}

/**
 * Fills out a text field with the provided value.
 * @param page the current page
 * @param testId the test ID of the text field
 * @param value the text to fill in the field
 */
async function fillOutTextField(page: Page, testId: string, value: string) {
    await page.getByTestId(testId).fill(value);
}

/**
 * Adds a new preset with the provided options.
 * @param page the current page
 * @param zoomLevel the zoom level
 */
export async function zoomToLevel(page: Page, zoomLevel: number) {
    // Zoom in to the specified level
    await page.evaluate((zl) => {
        // If you have animations on, wait until the map has actually zoomed:
        return new Promise<void>((resolve) => {
            window.map.once("zoomend", () => resolve());
            window.map.setZoom(zl);
        });
    }, zoomLevel);
}

/**
 * move to the specified coordinates on the map.
 * @param page the current page
 * @param latitude the latitude to move to
 * @param longitude the longitude to move to
 */
export async function moveToCoordinates(page: Page, latitude: number, longitude: number) {
    await page.evaluate(
        ([lat, lng]) => {
            return new Promise<void>((resolve) => {
                window.map.once("moveend", () => resolve());
                window.map.setView([lat, lng]);
            });
        },
        // Pack both values into one array argument:
        [latitude, longitude],
    );
}

/**
 * Clicks the nth hexagon on the map.
 * @param page the current page
 * @param n the index of the hexagon to click (0-based)
 */
export async function clickNthHexagonOnMap(page: Page, n: number) {
    await page.waitForSelector("path.hexbin-grid", { state: "visible" });
            await page.locator("path.hexbin-grid").nth(n).click();
}

export interface AddPresetOpts {
    name: string; // e.g. "My Preset"
    description: string; // e.g. "A description of my preset"
    filters: {
        continents?: string[]; // e.g. ["Europe", "Asia"]
        countries?: string[]; // e.g. ["Netherlands", "Germany"]
        waterSources?: string[]; // e.g. ["Well", "Rooftop Tank"]
        temperatureEnabled?: boolean; // e.g. true
        temperatureRange?: [number|null, number|null]; // e.g. [10, 30]
        temperatureUnit?: "C" | "F"; // e.g. "C" for Celsius
        dateRange?: [string|null, string|null]; // e.g. ["2025-01-01", "2025-12-31"]
        timeSlots?: {
            start: string|null; // e.g. "08:00"
            end: string|null; // e.g. "18:00"
        }[]; // e.g. [{ start: "08:00", end: "18:00" }]
    };
    isPublic: boolean; // e.g. true
}
