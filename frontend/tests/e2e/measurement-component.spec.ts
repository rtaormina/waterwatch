import { test, expect } from "@playwright/test";

const url = "http://localhost/";

test.describe("Temperature Tests", () => {
    let tempBox;

    test.beforeEach(async ({ page }) => {
        await page.goto(url + "measurements", { waitUntil: "domcontentloaded" });
        const checkboxes = page.getByTestId("metric-checkbox");
        tempBox = checkboxes.getByLabel("Temperature");
        await tempBox.check();
    });

    test("should show temperature inputs", async ({ page }) => {
        await expect(tempBox).toHaveCount(1);
        await expect(tempBox).toBeChecked();
        expect(page.locator("h3", { hasText: "Temperature" })).toBeVisible();
    });
    test("should enter valid sensor", async ({ page }) => {
        const sensor = page.getByTestId("sensor-type");
        await sensor.fill("Thermocouple");
        await expect(sensor).toHaveValue("Thermocouple");
    });

    test("should catch empty sensor", async ({ page }) => {
        const sensor = page.getByTestId("sensor-type");
        await sensor.fill("a");
        await page.keyboard.press("Tab");
        await sensor.fill("");
        await page.keyboard.press("Tab");
        await expect(page.locator("p", { hasText: "Sensor type is required" })).toBeVisible();
    });

    test("should allow valid temp", async ({ page }) => {
        const temp = page.getByTestId("temp-val");
        await temp.fill("10");
        await expect(temp).toHaveValue("10");
    });

    test("should accept valid mins", async ({ page }) => {
        const mins = page.getByTestId("time-waited-mins");
        await mins.fill("32");
        await expect(mins).toHaveValue("32");
    });
    test("should accept valid sec", async ({ page }) => {
        const sec = page.getByTestId("time-waited-sec");
        await sec.fill("32");
        await expect(sec).toHaveValue("32");
    });

    test("should reject invalid mins", async ({ page }) => {
        const mins = page.getByTestId("time-waited-mins");
        await mins.fill("320");
        await expect(mins).toHaveValue("320");
    });
    test("should reject invalid sec", async ({ page }) => {
        const sec = page.getByTestId("time-waited-sec");
        await sec.fill("320");
        await expect(sec).toHaveValue("320");
    });
});

test.describe("Record Measurement Page", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(url + "measurements", { waitUntil: "domcontentloaded" });
    });

    test("should display the correct page title", async ({ page }) => {
        await expect(page.locator("h1")).toHaveText("Record Measurement");
    });

    test("should select a water source", async ({ page }) => {
        const dropdown = page.getByTestId("select-water-source");
        await dropdown.selectOption({ label: "Well" });
        const selectedValue = await dropdown.inputValue();
        expect(selectedValue).toBe("well");
    });
});
