import { test, expect } from "@playwright/test";
import { addMeasurement, clickButton, clickNthHexagonOnMap, moveToCoordinates, zoomToLevel } from "./utils";

const url = "http://localhost/";

test.use({
  // allow geolocation to be used in the tests
  permissions: ["geolocation"],
  // stub position to be Amsterdam
  geolocation: { latitude: 52.0, longitude: 4.0 },
});

test.describe("Map user flows", () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(url, { waitUntil: "domcontentloaded" });

        await page.waitForTimeout(2500);

        //create measurement 1
        await addMeasurement(
            page,
            {
                timestamp: "2025-05-26T14:30:00Z",
                localDate: "2025-05-26",
                localTime: "14:30:00",
                latitude: 52.0,
                longitude: 4.0,
                waterSource: "well",
                temperature: {
                    sensor: "Analog Thermometer",
                    value: 30,
                    time_waited: 5,
                },
            }
        );

        //create measurement 2
        await addMeasurement(
            page,
            {
                timestamp: "2025-05-26T14:30:00Z",
                localDate: "2025-05-26",
                localTime: "14:30:00",
                latitude: 52.0,
                longitude: 4.0,
                waterSource: "well",
                temperature: {
                    sensor: "Analog Thermometer",
                    value: 10,
                    time_waited: 5,
                },
            }
        );

        await page.goto(url, { waitUntil: "domcontentloaded" });

    });

    test("see hexagon info", async ({ page }) => {

        //add measurement by hand
        await clickButton(page, "add-measurement-button");

        //select water source
        await page.getByTestId("select-water-source").click();
        await page.locator("text=Well").click();

        //select sensor
        await page.getByTestId("sensor-type").click();
        await page.locator("text=Analog Thermometer").click();
        //enter temperature

        const tempInput = await page.getByTestId("temp-val");
        await tempInput.fill("20");

        //enter time waited
        const timeWaited = await page.getByTestId("time-waited-mins");
        await timeWaited.fill("5");

        //click submit
        await clickButton(page, "submit-measurement");

        //click pop up submit button
        await clickButton(page, "submit-button");

        //zoom in to the map
        await zoomToLevel(page, 10);

        //move to the first measurement
        moveToCoordinates(page, 52, 4);

        //select the first hexagon
        clickNthHexagonOnMap(page, 0);

        //assert the pop up by finding text
        await expect(page.locator('text="See Details"')).toBeVisible();

        //assert temp in pop up
        await expect(page.locator('text="Min: 10.0°C"')).toBeVisible();
        await expect(page.locator('text="Max: 30.0°C"')).toBeVisible();

        //assert avg correct in pop up
        await expect(page.locator('text="Avg: 20.0°C"')).toBeVisible();

        //assert correct number of measurements
        await expect(page.locator('text="3 Measurements"')).toBeVisible();

        //click see details
        await clickButton(page, "submit");

        //assert the details page is loaded
        await expect(page.locator('text="Data Analytics"')).toBeVisible();

        //close the details page
        await clickButton(page, "close-global-analytics");

        //assert that the pop up is closed
        await expect(page.locator('text="See Details"')).not.toBeVisible();

    });
});

test.describe("Map legend tests", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(url, { waitUntil: "domcontentloaded" });

        await page.waitForTimeout(2500);

        //create measurement 1
        await addMeasurement(
            page,
            {
                timestamp: "2025-05-26T14:30:00Z",
                localDate: "2025-05-26",
                localTime: "14:30:00",
                latitude: 52.0,
                longitude: 4.0,
                waterSource: "well",
                temperature: {
                    sensor: "Analog Thermometer",
                    value: 30,
                    time_waited: 5,
                },
            }
        );

        //create measurement 2
        await addMeasurement(
            page,
            {
                timestamp: "2025-05-26T14:30:00Z",
                localDate: "2025-05-26",
                localTime: "14:30:00",
                latitude: 52.0,
                longitude: 4.0,
                waterSource: "well",
                temperature: {
                    sensor: "Analog Thermometer",
                    value: 10,
                    time_waited: 5,
                },
            }
        );

        await addMeasurement(
            page,
            {
                timestamp: "2025-05-26T14:30:00Z",
                localDate: "2025-03-26",
                localTime: "14:30:00",
                latitude: 52.0,
                longitude: 4.0,
                waterSource: "well",
                temperature: {
                    sensor: "Analog Thermometer",
                    value: 19,
                    time_waited: 5,
                },
            }
        );

        await page.goto(url, { waitUntil: "domcontentloaded" });
    });

    test("open legend and toggle date range", async ({ page }) => {
        await page.waitForTimeout(1000);
        await zoomToLevel(page, 10);

        moveToCoordinates(page, 52.0, 4.0);

        //open map options
        await page.getByTestId("open-button").click();

        //open legend
        await page.getByTestId("map-settings-button").click();

        //select may in the date range selector
        await page.getByTestId("time-range-select").click();
        await page.locator("text=May").click();

        //select the first hexagon
        clickNthHexagonOnMap(page, 0);

        //assert the pop up by finding text
        await expect(page.locator('text="See Details"')).toBeVisible();

        //assert temp in pop up
        await expect(page.locator('text="Min: 10.0°C"')).toBeVisible();
        await expect(page.locator('text="Max: 30.0°C"')).toBeVisible();
        await expect(page.locator('text="Avg: 20.0°C"')).toBeVisible();

        //assert correct number of measurements
        await expect(page.locator('text="2 Measurements"')).toBeVisible();

        //open legend again
        await page.getByTestId("map-settings-button").click();

        //select march in the date range selector
        await page.getByTestId("time-range-select").click();
        await page.locator("text=March").click();

        //select the first hexagon
        clickNthHexagonOnMap(page, 0);

        //assert the correct number of measurements is present
        await expect(page.locator('text="3 Measurements"')).toBeVisible();

        //open legend
        await page.getByTestId("map-settings-button").click();

        //select may in the date range selector to only filter to march
        await page.getByTestId("time-range-select").click();
        await page.locator('text=/^May$/').click();

        //select the first hexagon
        clickNthHexagonOnMap(page, 0);

        //assert temp in pop up is only the one measurement in may
        await expect(page.locator('text="Min: 19.0°C"')).toBeVisible();
        await expect(page.locator('text="Max: 19.0°C"')).toBeVisible();

        //assert avg correct in pop up
        await expect(page.locator('text="Avg: 19.0°C"')).toBeVisible();

        //assert correct number of measurements
        await expect(page.locator('text="1 Measurement"')).toBeVisible();

    });

});
