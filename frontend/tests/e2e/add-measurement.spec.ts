import { test, expect, Page } from "@playwright/test";
import { clickButton, selectFromDropdown, fillOutTextField } from "./utils";

const url = "http://localhost/";

test.describe("Add Measurement Tests", () => {

    // Go to map page and open the add measurement sidebar
    test.beforeEach(async ({ page }) => {
        await page.goto(url, { waitUntil: "domcontentloaded" });
        await clickButton(page, "add-measurement-button");
    });

    test("Add a measurement with valid data", async ({ page }) => {
        await fillOutMeasurementForm(page, "Network", "Analog Thermometer", "21.4", true, "2", "0");
        await clickButton(page, "submit-measurement-button");

        expect(page.getByTestId("add-measurement-modal-message")).toHaveText("Are you sure you would like to submit this measurement?");

        await clickButton(page, "submit-modal-button");
        await expectToastToAppear(page, "Measurement successfully submitted!");
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
    await selectFromDropdown(page, "water-source-dropdown", waterSource);
    await selectFromDropdown(page, "sensor-type-dropdown", sensorType);
    await fillOutTextField(page, "temperature-value-input", tempValue);
    (celsius)
        ? await clickButton(page, "celsius-checkbox")
        : await clickButton(page, "fahrenheit-checkbox");
    await fillOutTextField(page, "time-waited-min-input", timeWaitedMin);
    await fillOutTextField(page, "time-waited-sec-input", timeWaitedSec);
};

/**
 * Checks if a toast message appears.
 * @param page the current page
 * @param message the message of the toast
 */
async function expectToastToAppear(page: Page, message: string) {
    await expect(page.getByText(message)).toBeVisible();
}
