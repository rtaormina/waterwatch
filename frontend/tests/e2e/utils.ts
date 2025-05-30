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
