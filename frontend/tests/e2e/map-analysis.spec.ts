import { test, expect } from "@playwright/test";
import { addMeasurement, clickButton, clickNthHexagonOnMap, moveToCoordinates, zoomToLevel } from "./utils";

const url = "http://localhost/";

test.describe("Map Analysis Comparing Hexagons", () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(url, { waitUntil: "domcontentloaded" });

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
                latitude: 53.0,
                longitude: 4.0,
                waterSource: "well",
                temperature: {
                    sensor: "Analog Thermometer",
                    value: 10,
                    time_waited: 5,
                },
            }
        );

        await clickButton(page, "view-button");
    });

    test("compare 2 hexagons", async ({ page }) => {

        //open comparing hexagons
        await clickButton(page, "open-button");
        await clickButton(page, "comparing-hexagons-button");

        //zoom in to right level
        await zoomToLevel(page, 8);

        //find measurement 1 hexagon
        await moveToCoordinates(page, 52.0, 4.0);

        //click on it
        await clickNthHexagonOnMap(page, 1);

        //assert blue outline
        await expect(page.locator("path.leaflet-interactive")).toHaveCount(1);

        //click next group
        await clickButton(page, "select-bar-right-button");
        await expect(page.locator("path.leaflet-interactive")).toHaveCount(0);

        //find measurement 2 hexagon
        await moveToCoordinates(page, 53.0, 4.0);

        //click on it
        await clickNthHexagonOnMap(page, 1);

        //assert red outline
        await expect(page.locator("path.leaflet-interactive")).toHaveCount(1);

        //click compare button
        await clickButton(page, "select-bar-right-button");

        //assert Compare Distributions
        await expect(page.locator('text="Compare Distributions"')).toBeVisible();

        //assert Frequency Analysis: Group 1 and Group 2
        await expect(page.locator('text="Frequency Analysis: Group 1 and Group 2"')).toBeVisible();

        //assert presence of graph
        await expect(page.locator('text="Measurement Value"')).toBeVisible();

        //assert Frequency Analysis: Group 1
        await expect(page.locator('text="Frequency Analysis: Group 1"')).toBeVisible();

        //assert Frequency Analysis: Group 2
        await expect(page.locator('text="Frequency Analysis: Group 2"')).toBeVisible();

        //close comparing hexagons
        await clickButton(page, "select-bar-left-button");

        //assert that comparing hexagons is closed
        await expect(page.locator('text="Compare Distributions"')).toHaveCount(0)

    })

    test("compare 2 hexagons at different zoom levels", async ({ page }) => {

        //open comparing hexagons
        await clickButton(page, "open-button");
        await clickButton(page, "comparing-hexagons-button");

        //zoom in to right level
        await zoomToLevel(page, 8);

        //find measurement 1 hexagon
        await moveToCoordinates(page, 52.0, 4.0);

        //click on it
        await clickNthHexagonOnMap(page, 1);

        //assert blue outline
        await expect(page.locator("path.leaflet-interactive")).toHaveCount(1);

        //click next group
        await clickButton(page, "select-bar-right-button");
        await expect(page.locator("path.leaflet-interactive")).toHaveCount(0);

        //zoom to different level
        await zoomToLevel(page, 10);

        //find measurement 2 hexagon
        await moveToCoordinates(page, 53.0, 4.0);

        //click on it
        await clickNthHexagonOnMap(page, 0);

        //assert red outline
        await expect(page.locator("path.leaflet-interactive")).toHaveCount(1);

        //click compare button
        await clickButton(page, "select-bar-right-button");

        //assert Compare Distributions
        await expect(page.locator('text="Compare Distributions"')).toBeVisible();

        //assert Frequency Analysis: Group 1 and Group 2
        await expect(page.locator('text="Frequency Analysis: Group 1 and Group 2"')).toBeVisible();

        //assert presence of graph
        await expect(page.locator('text="Measurement Value"')).toBeVisible();

        //assert Frequency Analysis: Group 1
        await expect(page.locator('text="Frequency Analysis: Group 1"')).toBeVisible();

        //assert Frequency Analysis: Group 2
        await expect(page.locator('text="Frequency Analysis: Group 2"')).toBeVisible();

        //restart comparison
        await clickButton(page, "select-bar-left-button");

        //assert that comparing is back on
        await expect(page.locator('text="Select group 1"')).toBeVisible();
    });

    test("compare multiple hexagons including overlapping", async ({ page }) => {

        //add hexagon 3
        await addMeasurement(
            page,
            {
                timestamp: "2025-05-26T14:30:00Z",
                localDate: "2025-05-26",
                localTime: "14:30:00",
                latitude: 54.0,
                longitude: 4.0,
                waterSource: "well",
                temperature: {
                    sensor: "Analog Thermometer",
                    value: 30,
                    time_waited: 5,
                },
            }
        );

        //go back to map
        await page.goto(url, { waitUntil: "domcontentloaded" });

        //open comparing hexagons
        await clickButton(page, "open-button");
        await clickButton(page, "comparing-hexagons-button");

        //zoom in to right level
        await zoomToLevel(page, 12);

        //find measurement 1 hexagon
        await moveToCoordinates(page, 52.0, 4.0);

        //click on it
        await clickNthHexagonOnMap(page, 0);

        //click on hexagon 3
        await moveToCoordinates(page, 54.0, 4.0);
        await clickNthHexagonOnMap(page, 0);

        //assert blue outline
        await expect(page.locator("path.leaflet-interactive")).toHaveCount(2);

        //click next group
        await clickButton(page, "select-bar-right-button");
        await expect(page.locator("path.leaflet-interactive")).toHaveCount(0);

        //zoom to different level
        await zoomToLevel(page, 10);

        //find measurement 2 hexagon
        await moveToCoordinates(page, 53.0, 4.0);

        //click on it
        await clickNthHexagonOnMap(page, 0);

        //click on hexagon 3
        await moveToCoordinates(page, 54.0, 4.0);
        await clickNthHexagonOnMap(page, 0);

        //assert red outline
        await expect(page.locator("path.leaflet-interactive")).toHaveCount(2);

        //click compare button
        await clickButton(page, "select-bar-right-button");

        //assert Compare Distributions
        await expect(page.locator('text="Compare Distributions"')).toBeVisible();

        //assert Frequency Analysis: Group 1 and Group 2
        await expect(page.locator('text="Frequency Analysis: Group 1 and Group 2"')).toBeVisible();

        //assert presence of graph
        await expect(page.locator('text="Measurement Value"')).toBeVisible();

        //assert Frequency Analysis: Group 1
        await expect(page.locator('text="Frequency Analysis: Group 1"')).toBeVisible();

        //assert Frequency Analysis: Group 2
        await expect(page.locator('text="Frequency Analysis: Group 2"')).toBeVisible();

        //exit comparing hexagons
        await clickButton(page, "select-bar-left-button");

        //assert that comparing hexagons is closed
        await expect(page.locator('text="Compare Distributions"')).toHaveCount(0);
    });

    test("Cancel button", async ({ page }) => {

        //go back to map
        await page.goto(url, { waitUntil: "domcontentloaded" });

        //open comparing hexagons
        await clickButton(page, "open-button");
        await clickButton(page, "comparing-hexagons-button");

        //click cancel button
        await clickButton(page, "select-bar-left-button");

        //no more comparison
        await expect(page.locator('text="Select group 1"')).toHaveCount(0);

        //assert that comparing hexagons is closed
        await expect(page.locator('text="Compare Distributions"')).toHaveCount(0);
    });
});

test.describe("Map Analysis Global Analytics", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(url, { waitUntil: "domcontentloaded" });
    });

    test("Opening global analytics should work and graph should show", async ({ page }) => {

        //close tutorial dialog
        await clickButton(page, "view-button");

        //open global analytics
        await clickButton(page, "open-button");
        await clickButton(page, "global-analytics-button");

        //assert global analytics is open
        await expect(page.locator('text="Data Analytics"')).toBeVisible();

        //click close button
        await clickButton(page, "close-sidebar-button");

        //assert global analytics is closed
        await expect(page.locator('text="Data Analytics"')).toHaveCount(0);
    });
});

test.describe("Map Analysis Select Multiple Hexagons", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(url, { waitUntil: "domcontentloaded" });
    });

    test("Select multiple hexagons", async ({ page }) => {
        //wait for map to load and tutorial dialog to show
        await page.waitForTimeout(2500);

        //add measurement 1
        await addMeasurement(
            page,
            {
                timestamp: "2025-05-26T14:30:00Z",
                localDate: "2025-05-26",
                localTime: "14:30:00",
                latitude: 54.0,
                longitude: 4.0,
                waterSource: "well",
                temperature: {
                    sensor: "Analog Thermometer",
                    value: 30,
                    time_waited: 5,
                },
            }
        );

        //navigate to map
        await page.goto(url, { waitUntil: "domcontentloaded" });

        //open select multiple hexagons
        await clickButton(page, "open-button");
        await clickButton(page, "select-multiple-hexagons-button");

        //opened select multiple hexagons
        await expect(page.locator('text="Select Hexagons"')).toBeVisible();

        //select hexagon 1
        await moveToCoordinates(page, 54.0, 4.0);
        await clickNthHexagonOnMap(page, 0);

        //assert hexagon is selected
        await expect(page.locator("path.leaflet-interactive")).toHaveCount(1);

        //open hexagon selection
        await clickButton(page, "select-bar-right-button");

        //assert analytics show up
        await expect(page.locator('text="Data Analytics"')).toBeVisible();

        //close select multiple hexagons
        await clickButton(page, "select-bar-left-button");

        //assert select multiple hexagons is closed
        await expect(page.locator('text="Select Hexagons"')).toHaveCount(0);

        //assert analytics is closed
        await expect(page.locator('text="Data Analytics"')).toHaveCount(0);
    });

});
