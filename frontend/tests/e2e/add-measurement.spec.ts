import { test, expect, Page } from "@playwright/test";
import { clickButton, selectFromDropdown, fillOutTextField, moveToCoordinates, zoomToLevel, clearMeasurements } from "./utils";

const url = "http://localhost/";

test.describe.configure({ mode: 'serial' });
test.describe("Add Measurement Tests", () => {

    // Go to map page and open the add measurement sidebar
    test.beforeEach(async ({ page }) => {
        await clearMeasurements(page);
        await page.goto(url, { waitUntil: "domcontentloaded" });
        await clickButton(page, "view-button");
        await clickButton(page, "add-measurement-button");
    });

    test.describe("Good Weather Tests", () => {
        test("Add a measurement with normal data", async ({ page }) => {
            // Fill out the measurement form and submit
            await fillOutMeasurementForm(page, "Network", "Analog Thermometer", "21.4", true, "2", "0");
            await clickButton(page, "submit-measurement");

            // Check that the confirmation modal appears
            expect(page.getByTestId("add-measurement-modal-message")).toHaveText("Are you sure you would like to submit this measurement?");

            // Click the submit button and expect a success toast
            await clickButton(page, "submit-modal-button");
            expect(page.locator('text="Measurement successfully submitted!"')).toHaveCount(1);

            // Wait for page to refresh and check sidebar is closed
            await Promise.all([
                page.waitForURL(url, { waitUntil: "domcontentloaded" }),
                expect(page.locator('text="Record Measurement"')).toHaveCount(0)
            ]);

            // Check that the measurement appears on the map
            const hexagons = page.locator('path.hexbin-hexagon');
            await expect(hexagons).toHaveCount(1);
        });

        test("Add a measurement with very high data", async ({ page }) => {
            // Fill out the measurement form and submit
            await fillOutMeasurementForm(page, "Network", "Analog Thermometer", "60.4", true, "2", "0");
            await clickButton(page, "submit-measurement");

            // Check that the confirmation modal appears
            expect(page.getByTestId("add-measurement-modal-message")).toHaveText("Are you sure you would like to submit the temperature value 60.4°C?");

            // Click the submit button and expect a success toast
            await clickButton(page, "submit-modal-button");
            expect(page.locator('text="Measurement successfully submitted!"')).toHaveCount(1);

            // Wait for page to refresh and check sidebar is closed
            await Promise.all([
                page.waitForURL(url, { waitUntil: "domcontentloaded" }),
                expect(page.locator('text="Record Measurement"')).toHaveCount(0)
            ]);

            // Check that the measurement appears on the map
            const hexagons = page.locator('path.hexbin-hexagon');
            await expect(hexagons).toHaveCount(1);
        });

        test("Add a measurement with manual location set", async ({ page }) => {
            // Convert to pixel coordinates inside the map
            const point = await page.evaluate(([lat, lng]) => {
                const map = window.leafletMap;
                const pixel = map.latLngToContainerPoint([lat, lng]);
                return { x: pixel.x, y: pixel.y };
            }, [52.0, 4.0]);

            // Click on the map at those pixel coordinates
            await page.locator('.map').nth(1).click({ position: { x: point.x, y: point.y } });

            // Fill out the measurement form
            await fillOutMeasurementForm(page, "Network", "Analog Thermometer", "21.4", true, "2", "0");
            await clickButton(page, "submit-measurement");

            // Check that the confirmation modal appears
            expect(page.getByTestId("add-measurement-modal-message")).toHaveText("Are you sure you would like to submit this measurement?");

            // Click the submit button and expect a success toast
            await clickButton(page, "submit-modal-button");
            expect(page.locator('text="Measurement successfully submitted!"')).toHaveCount(1);

            // Wait for page to refresh and check sidebar is closed
            await Promise.all([
                page.waitForURL(url, { waitUntil: "domcontentloaded" }),
                expect(page.locator('text="Record Measurement"')).toHaveCount(0)
            ]);

            // Find measurement
            await zoomToLevel(page, 12);
            await moveToCoordinates(page, 52.0, 4.0);

            // Check that the measurement appears on the map
            const hexagons = page.locator('path.hexbin-hexagon');
            await expect(hexagons).toHaveCount(1);
        });

        test("Clear button clears the form", async ({ page }) => {
            // Fill out the measurement form
            await fillOutMeasurementForm(page, "Network", "Analog Thermometer", "21.4", true, "2", "0");
            await clickButton(page, "clear-form-button");

            // Check that the form is cleared
            expect(page.locator('text="Network"')).toHaveCount(0);
            expect(page.locator('text="Analog Thermometer"')).toHaveCount(0);
            await expect(page.locator('text="21.4"')).toHaveCount(0);

            // Click on submit button to ensure error texts appear then clear them
            await clickButton(page, "submit-measurement");
            await clickButton(page, "clear-form-button");

            //Confirm that the error messages disappear
            expect(page.locator('text="Please fill in all required fields."')).toHaveCount(0);
            expect(page.locator('text="Water source is required."')).toHaveCount(0);
            expect(page.locator('text="Sensor type is required."')).toHaveCount(0);
            expect(page.locator('text="Temperature value is required."')).toHaveCount(0);
            expect(page.locator('text="Time waited is required."')).toHaveCount(0);
        });
    });

    test.describe("Bad Weather Tests", () => {
        test("Try to add a measurement with no data", async ({ page }) => {
            // CLick the submit button without filling out the form
            await clickButton(page, "submit-measurement");

            //Confirm that the error messages appear
            expect(page.locator('text="Please fill in all required fields."')).toHaveCount(1);
            expect(page.locator('text="Water source is required."')).toHaveCount(1);
            expect(page.locator('text="Sensor type is required."')).toHaveCount(1);
            expect(page.locator('text="Temperature value is required."')).toHaveCount(1);
            expect(page.locator('text="Time waited is required."')).toHaveCount(1);
        });

        test("Try to add a measurement with some data", async ({ page }) => {
            // Partially fill out the measurement form and submit
            await selectFromDropdown(page, "select-water-source", "Network");
            await fillOutTextField(page, "temp-val", "21.4");
            await clickButton(page, "submit-measurement");

            //Confirm that the error messages appear
            expect(page.locator('text="Please fill in all required fields."')).toHaveCount(1);
            expect(page.locator('text="Sensor type is required."')).toHaveCount(1);
            expect(page.locator('text="Time waited is required."')).toHaveCount(1);

            // Check that other error messages are not present
            expect(page.locator('text="Temperature value is required."')).toHaveCount(0);
            expect(page.locator('text="Water source is required."')).toHaveCount(0);
        });

        test("Try to fill out incorrect temperature", async ({ page }) => {
            // Fill out too high temperature
            await fillOutTextField(page, "temp-val", "100");
            await clickButton(page, "submit-measurement");
            await expect(page.locator('text="Temperature value must be between 0°C and 100°C."')).toHaveCount(1);

            // Check that the error message disappears when a valid temperature is entered
            await fillOutTextField(page, "temp-val", "99.9");
            await clickButton(page, "submit-measurement");
            await expect(page.locator('text="Temperature value must be between 0°C and 100°C."')).toHaveCount(0);

            // Fill out too low temperature
            await fillOutTextField(page, "temp-val", "0");
            await clickButton(page, "submit-measurement");
            await expect(page.locator('text="Temperature value must be between 0°C and 100°C."')).toHaveCount(1);

            // Check that the error message disappears when a valid temperature is entered
            await fillOutTextField(page, "temp-val", "0.1");
            await clickButton(page, "submit-measurement");
            await expect(page.locator('text="Temperature value must be between 0°C and 100°C."')).toHaveCount(0);
        });
    });

});

/**
 * Fills out the measurement form with the provided data, but does not submit it.
 * @param page the current page
 * @param waterSource the water source to select from the dropdown
 * @param sensorType the sensor type to select from the dropdown
 * @param tempValue the temperature value to fill in the text field
 * @param celsius whether the temperature is in Celsius (true) or Fahrenheit (false)
 * @param timeWaitedMin the minutes waited to fill in the text field
 * @param timeWaitedSec the seconds waited to fill in the text field
 * @returns {Promise<void>}
 */
async function fillOutMeasurementForm(page: Page, waterSource: string, sensorType: string, tempValue: string, celsius: boolean, timeWaitedMin: string, timeWaitedSec: string) {
    await selectFromDropdown(page, "select-water-source", waterSource);
    await selectFromDropdown(page, "sensor-type", sensorType);
    await fillOutTextField(page, "temp-val", tempValue);
    (celsius)
        ? await page.getByTestId('temp-unit').getByText('°C').click()
        : await page.getByTestId('temp-unit').getByText('°F').click();
    await fillOutTextField(page, "time-waited-mins", timeWaitedMin);
    await fillOutTextField(page, "time-waited-sec", timeWaitedSec);
};
