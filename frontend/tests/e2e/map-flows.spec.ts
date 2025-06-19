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

        //move to the first measurement
        moveToCoordinates(page, 52.0, 4.0);

        //select the first hexagon

        //assert the pop up

        //assert temp in pop up

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
