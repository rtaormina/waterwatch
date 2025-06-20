import { test, expect } from "@playwright/test";
import { addMeasurement, clickButton, clickNthHexagonOnMap, moveToCoordinates, zoomToLevel } from "./utils";

const url = "http://localhost/";

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
            },
            url,
        );

        //create measurement 2
        await addMeasurement(
            page,
            {
                timestamp: "2025-05-26T14:30:00Z",
                localDate: "2025-05-26",
                localTime: "14:30:00",
                latitude: 53.0,
                longitude: 4.0,
                waterSource: "well",
                temperature: {
                    sensor: "Analog Thermometer",
                    value: 10,
                    time_waited: 5,
                },
            },
            url,
        );

        await page.goto(url, { waitUntil: "domcontentloaded" });

    });

    test("see hexagon info", async ({ page }) => {

        //add measurement by hand
        await clickButton(page, "add-measurement-button");

        //select water source
        await page.getByTestId("select-water-source").click();
        await page.locator("text=Well").click();

        //maybe scroll??

        //select sensor


        //enter temperature


        //enter time waited
        const timeWaited = await page.getByTestId("time-waited-mins");
        await timeWaited.fill("5");

        //click submit
        await clickButton(page, "submit-button");

        //click pop up submit button
        await clickButton(page, "submit-button");

        //refresh the page to ensure the measurement is saved
        await page.reload({ waitUntil: "domcontentloaded" });

        //zoom in to the map
        await zoomToLevel(page, 10);

        //move to the first measurement
        moveToCoordinates(page, 0, 0);

        //select the first hexagon
        clickNthHexagonOnMap(page, 0);

        //assert the pop up by finding text
        await expect(page.locator('text="See Details"')).toBeVisible();

        //assert temp in pop up
        await expect(page.locator('text="Min: 10.0°C"')).toBeVisible();

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
            },
            url,
        );

        //create measurement 2
        await addMeasurement(
            page,
            {
                timestamp: "2025-05-26T14:30:00Z",
                localDate: "2025-05-26",
                localTime: "14:30:00",
                latitude: 53.0,
                longitude: 4.0,
                waterSource: "well",
                temperature: {
                    sensor: "Analog Thermometer",
                    value: 10,
                    time_waited: 5,
                },
            },
            url,
        );

        await page.goto(url, { waitUntil: "domcontentloaded" });
    });

    test("count selected", async ({ page }) => {

        //move to the first measurement
        moveToCoordinates(page, 52.0, 4.0);

        //select the first hexagon


    });

    test("temp selected", async ({ page }) => {

        //move to the first measurement
        moveToCoordinates(page, 52.0, 4.0);

        //select the first hexagon


    });
});
