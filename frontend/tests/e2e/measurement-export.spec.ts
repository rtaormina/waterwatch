import { test as base, expect, Page, BrowserContext } from "@playwright/test";
import { addMeasurement } from "./utils";
import fs from "fs/promises";

const url = "http://localhost/";

let storageState: any;
let sharedContext: BrowserContext;
let loginCount = 0;

// Create a new test fixture that uses the shared context
const test = base.extend<{ page: Page }>({
    page: async ({ browser }, use) => {
        if (!sharedContext) {
            sharedContext = await browser.newContext({ storageState });
        }
        const page = await sharedContext.newPage();
        await use(page);
        await page.close();
    },
});

test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page);
    await interceptDataForExportPage(page, true);

    loginCount++;

    storageState = await ctx.storageState();
    await ctx.close();
});

test.afterAll(async () => {
    await sharedContext?.close();
    expect(loginCount).toBe(1);
});

test.describe("Measurement Export Page Tests", () => {
    test.describe("Export View Tests", () => {
        test.beforeEach(async ({ page }) => {
            await interceptDataForExportPage(page);
        });

        test("should display the correct page title", async ({ page }) => {
            await expect(page.locator("h1")).toHaveText("Data Download");
        });

        test("should display filter panel and search results sections", async ({ page }) => {
            await expect(page.getByText("Filter By", { exact: true })).toBeVisible();
            await expect(page.getByText("Search Results", { exact: true })).toBeVisible();
        });

        test("should have search input", async ({ page }) => {
            const searchInput = page.locator('input[type="text"]').first();
            await expect(searchInput).toBeVisible();
        });
    });

    test.describe("Filter Panel Tests", () => {
        test.beforeEach(async ({ page }) => {
            await interceptDataForExportPage(page);
        });

        test("should display all filter sections", async ({ page }) => {
            await expect(page.getByText("Location", { exact: true })).toBeVisible();
            await expect(page.getByText("Region", { exact: true })).toBeVisible();
            await expect(page.getByText("Subregion", { exact: true })).toBeVisible();
            await expect(page.getByText("Measurement Type", { exact: true })).toBeVisible();
            await expect(page.getByText("Water Source", { exact: true })).toBeVisible();
            await expect(page.getByText("Date", { exact: true })).toBeVisible();
            await expect(page.getByText("Time", { exact: true })).toBeVisible();
        });

        test("should open and close continent dropdown", async ({ page }) => {
            await page.locator(".multiselect-custom-wrapper").first().click();

            // Check if dropdown options are visible
            await expect(page.locator(".multiselect-custom-dropdown").first()).toBeVisible();

            // Click outside to close
            await page.locator("body").click();
            await expect(page.locator(".multiselect-custom-dropdown").first()).not.toBeVisible();
        });

        test("should select and deselect continents", async ({ page }) => {
            await page.locator(".multiselect-custom-wrapper").first().click();

            // Select first continent option if available
            const firstOption = page.locator(".multiselect-option").first();
            await expect(firstOption).toBeVisible();
            await firstOption.click();
            await expect(firstOption).toHaveClass(/multiselect-option-selected/);

            await firstOption.click();
            await expect(firstOption).not.toHaveClass(/multiselect-option-selected/);
        });

        test("should use select all/deselect all for continents", async ({ page }) => {
            await page.locator(".multiselect-custom-wrapper").first().click();

            const selectAllButton = page.locator(".multiselect-select-all").first();
            await expect(selectAllButton).toContainText("Select All");

            await selectAllButton.click();
            await expect(selectAllButton).toContainText("Deselect All");

            await selectAllButton.click();
            await expect(selectAllButton).toContainText("Select All");
        });

        test("should open and search countries", async ({ page }) => {
            const continentDropdown = page.locator(".multiselect-custom-wrapper").first();
            await continentDropdown.click();

            const selectAllButton = page.locator(".multiselect-select-all").first();
            await selectAllButton.click();

            await continentDropdown.click(); // Close dropdown

            const countryDropdown = page.locator(".multiselect-custom-wrapper").nth(1);
            await countryDropdown.click();

            const searchInput = page.locator('input[placeholder="Search subregions..."]');
            await expect(searchInput).toBeVisible();

            await searchInput.fill("United");

            // Countries should be filtered based on search
            const countryOptions = page.getByTestId("country-option");
            await expect(countryOptions.first()).toBeVisible();

            const countryText = (await countryOptions.first().textContent())!.toLowerCase();
            expect(countryText).toContain("united");
        });

        test("should clear country search when dropdown closes", async ({ page }) => {
            const countryDropdown = page.locator(".multiselect-custom-wrapper").nth(1);
            await countryDropdown.click();

            const searchInput = page.locator('input[placeholder="Search subregions..."]');
            await searchInput.fill("test search");

            // Close dropdown
            await page.locator("body").click();

            // Reopen dropdown
            await countryDropdown.click();
            await expect(searchInput).toHaveValue("");
        });

        test("should open and select water sources", async ({ page }) => {
            await page.locator(".multiselect-custom-wrapper").nth(2).click();

            const waterSourceDropdown = page.locator(".multiselect-custom-dropdown").nth(2);
            await expect(waterSourceDropdown).toBeVisible();

            const options = waterSourceDropdown.locator(".multiselect-option");
            // wait for at least one option
            await expect(options).not.toHaveCount(0);

            const firstOption = options.first();
            await expect(firstOption).toBeVisible();
            await firstOption.click();

            await expect(firstOption).toHaveClass(/multiselect-option-selected/);
        });

        test("should enable and configure temperature filter", async ({ page }) => {
            const tempCheckbox = page.getByRole("checkbox", { name: "Temperature" }).first();
            await expect(tempCheckbox).toHaveAttribute("aria-checked", "true");

            // Temperature unit buttons should be visible
            await expect(page.locator("button", { hasText: "°C" })).toBeVisible();
            await expect(page.locator("button", { hasText: "°F" })).toBeVisible();

            // Temperature input fields should be visible
            await expect(page.locator('input[placeholder="Min temperature"]')).toBeVisible();
            await expect(page.locator('input[placeholder="Max temperature"]')).toBeVisible();
        });

        test("should switch temperature units", async ({ page }) => {
            const celsiusButton = page.locator("button", { hasText: "°C" });
            const fahrenheitButton = page.locator("button", { hasText: "°F" });

            await fahrenheitButton.click();
            await expect(fahrenheitButton).toHaveClass(/bg-main/);

            await celsiusButton.click();
            await expect(celsiusButton).toHaveClass(/bg-main/);
        });

        test("should validate temperature range", async ({ page }) => {
            const minTempInput = page.locator('input[placeholder="Min temperature"]');
            const maxTempInput = page.locator('input[placeholder="Max temperature"]');

            // Invalid range: min > max
            await minTempInput.fill("50");
            await maxTempInput.fill("25");

            await expect(page.locator("text=Temperature range is invalid.")).toBeVisible();

            // Valid range
            await minTempInput.fill("25");
            await maxTempInput.fill("50");

            await expect(page.locator("text=Temperature range is invalid.")).not.toBeVisible();
        });

        test("should set date range", async ({ page }) => {
            const fromDateInput = page.locator('input[type="date"]').first();
            const toDateInput = page.locator('input[type="date"]').nth(1);

            await fromDateInput.fill("2024-01-01");
            await toDateInput.fill("2024-12-31");

            await expect(fromDateInput).toHaveValue("2024-01-01");
            await expect(toDateInput).toHaveValue("2024-12-31");
        });

        test("should validate date range", async ({ page }) => {
            const fromDateInput = page.locator('input[type="date"]').first();
            const toDateInput = page.locator('input[type="date"]').nth(1);

            // Invalid range: from date after to date
            await fromDateInput.fill("2024-12-31");
            await toDateInput.fill("2024-01-01");

            await expect(page.locator("text=Date range is invalid.")).toBeVisible();

            // Valid range
            await fromDateInput.fill("2024-01-01");
            await toDateInput.fill("2024-12-31");

            await expect(page.locator("text=Date range is invalid.")).not.toBeVisible();
        });

        test("should add and remove time slots", async ({ page }) => {
            const addTimeSlotButton = page.locator("button", { hasText: "Add time slot" });

            // Add a time slot
            await addTimeSlotButton.click();

            const timeInputs = page.locator('input[type="time"]');
            await expect(timeInputs).toHaveCount(2); // from and to

            // Add another time slot
            await addTimeSlotButton.click();
            await expect(page.locator('input[type="time"]')).toHaveCount(4); // 2 slots with from/to each

            // Remove a time slot
            await page.getByRole("button").filter({ hasText: /^$/ }).nth(2).click();
            await expect(page.locator('input[type="time"]')).toHaveCount(2);
        });

        test("should validate time slots", async ({ page }) => {
            await page.locator("button", { hasText: "Add time slot" }).click();

            const fromTimeInput = page.locator('input[type="time"]').first();
            const toTimeInput = page.locator('input[type="time"]').nth(1);

            // Invalid time range: from after to
            await fromTimeInput.fill("15:00");
            await toTimeInput.fill("10:00");

            await expect(page.locator("text=Time range is invalid.")).toBeVisible();

            // Valid time range
            await fromTimeInput.fill("10:00");
            await toTimeInput.fill("15:00");

            await expect(page.locator("text=Time range is invalid.")).not.toBeVisible();
        });

        test("should detect overlapping time slots", async ({ page }) => {
            const addTimeSlotButton = page.locator("button", { hasText: "Add time slot" });

            // Add first time slot
            await addTimeSlotButton.click();
            page.locator('input[type="time"]').first().fill("10:00");
            page.locator('input[type="time"]').nth(1).fill("12:00");

            // Add second time slot
            await addTimeSlotButton.click();

            // Overlapping times
            await page.locator('input[type="time"]').nth(2).fill("11:00");
            await page.locator('input[type="time"]').nth(3).fill("13:00");

            await expect(page.locator("text=Time slots must not overlap.")).toBeVisible();

            // Non-overlapping times
            await page.locator('input[type="time"]').nth(2).fill("13:00");
            await page.locator('input[type="time"]').nth(3).fill("15:00");

            await expect(page.locator("text=Time slots must not overlap.")).not.toBeVisible();
        });

        test("should limit time slots to maximum of 3", async ({ page }) => {
            const addTimeSlotButton = page.locator("button", { hasText: "Add time slot" });

            // Add 3 time slots
            await addTimeSlotButton.click();
            await addTimeSlotButton.click();
            await addTimeSlotButton.click();

            // Button should not be visible after 3 slots
            await expect(addTimeSlotButton).not.toBeVisible();
        });

        test("should disable search button when temperature validation fails", async ({ page }) => {
            const searchButton = page.locator("button", { hasText: "Search" });

            // Enable temperature with invalid range
            const minTempInput = page.locator('input[placeholder="Min temperature"]');
            const maxTempInput = page.locator('input[placeholder="Max temperature"]');

            await minTempInput.fill("50");
            await maxTempInput.fill("25");

            await expect(searchButton).toBeDisabled();

            // Fix the temperature range
            await minTempInput.fill("25");
            await maxTempInput.fill("50");
            await expect(searchButton).toBeEnabled();
        });

        test("should disable search button when date validation fails", async ({ page }) => {
            const searchButton = page.locator("button", { hasText: "Search" });

            // Enable date with invalid range
            const fromDateInput = page.locator('input[type="date"]').first();
            const toDateInput = page.locator('input[type="date"]').nth(1);

            await fromDateInput.fill("2024-12-31");
            await toDateInput.fill("2024-01-01");

            await expect(searchButton).toBeDisabled();

            // Fix the date range
            await fromDateInput.fill("2024-01-01");
            await toDateInput.fill("2024-12-31");
            await expect(searchButton).toBeEnabled();
        });

        test("should disable search button when time validation fails", async ({ page }) => {
            const searchButton = page.locator("button", { hasText: "Search" });
            const addTimeSlotButton = page.locator("button", { hasText: "Add time slot" });
            await addTimeSlotButton.click();
            const fromTimeInput = page.locator('input[type="time"]').first();
            const toTimeInput = page.locator('input[type="time"]').nth(1);
            await fromTimeInput.fill("15:00");
            await toTimeInput.fill("10:00");
            await expect(searchButton).toBeDisabled();
            // Fix the time range
            await fromTimeInput.fill("10:00");
            await toTimeInput.fill("15:00");
            await expect(searchButton).toBeEnabled();
        });

        test("should disable search button when timeslots overlap", async ({ page }) => {
            const searchButton = page.locator("button", { hasText: "Search" });
            const addTimeSlotButton = page.locator("button", { hasText: "Add time slot" });
            await addTimeSlotButton.click();
            const firstFromTime = page.locator('input[type="time"]').first();
            const firstToTime = page.locator('input[type="time"]').nth(1);
            await firstFromTime.fill("10:00");
            await firstToTime.fill("12:00");
            await addTimeSlotButton.click();
            const secondFromTime = page.locator('input[type="time"]').nth(2);
            const secondToTime = page.locator('input[type="time"]').nth(3);
            await secondFromTime.fill("11:00");
            await secondToTime.fill("13:00");
            await expect(searchButton).toBeDisabled();

            await secondFromTime.fill("12:00");
            await secondToTime.fill("15:00");
            await expect(searchButton).toBeDisabled();

            // Fix the overlapping times
            await secondFromTime.fill("13:00");
            await secondToTime.fill("15:00");
            await expect(searchButton).toBeEnabled();
        });

        test("should reset all filters and results", async ({ page }) => {
            const continentDropdown = page.locator(".multiselect-custom-wrapper").first();
            await continentDropdown.click();

            const selectAllContinentsButton = page.locator(".multiselect-select-all").first();
            await selectAllContinentsButton.click();

            await continentDropdown.click(); // Close dropdown

            const countryDropdown = page.locator(".multiselect-custom-wrapper").nth(1);

            const waterSourceDropdown = page.locator(".multiselect-custom-wrapper").nth(2);
            await waterSourceDropdown.click();

            const selectAllWaterSourcesButton = page.locator(".multiselect-select-all").nth(2);
            await selectAllWaterSourcesButton.click();

            await waterSourceDropdown.click(); // Close dropdown

            const tempCheckbox = page.getByRole("checkbox", { name: "Temperature" }).first();

            const minTempInput = page.locator('input[placeholder="Min temperature"]');
            await minTempInput.fill("25");

            const maxTempInput = page.locator('input[placeholder="Max temperature"]');
            await maxTempInput.fill("50");

            const fahrenheitButton = page.locator("button", { hasText: "°F" });
            await fahrenheitButton.click();

            const celsiusButton = page.locator("button", { hasText: "°C" });

            const fromDateInput = page.locator('input[type="date"]').first();
            await fromDateInput.fill("2024-01-01");

            const toDateInput = page.locator('input[type="date"]').nth(1);
            await toDateInput.fill("2024-12-31");

            const addTimeSlotButton = page.locator("button", { hasText: "Add time slot" });
            await addTimeSlotButton.click();
            const fromTimeInput = page.locator('input[type="time"]').first();
            const toTimeInput = page.locator('input[type="time"]').nth(1);
            await fromTimeInput.fill("10:00");
            await toTimeInput.fill("15:00");

            // Reset
            const resetButton = page.locator("button", { hasText: "Reset" });
            await resetButton.click();

            // Check that filters are reset
            await expect(continentDropdown).toHaveText("Select regions");
            await expect(countryDropdown).toHaveText("Select subregions");
            await expect(waterSourceDropdown).toHaveText("Select water sources");
            await expect(tempCheckbox).toHaveAttribute("aria-checked", "true");
            await expect(celsiusButton).toHaveClass(/bg-main/);
            await expect(fahrenheitButton).not.toHaveClass(/bg-main/);
            await expect(minTempInput).toHaveValue("");
            await expect(maxTempInput).toHaveValue("");
            await expect(fromDateInput).toHaveValue("");
            await expect(toDateInput).toHaveValue("");
            await expect(page.locator('input[type="time"]')).toHaveCount(0); // No time slots
        });
    });

    test.describe("Search Results Tests", () => {
        test.beforeEach(async ({ page }) => {
            await interceptDataForExportPage(page);
        });

        test("should display summary section", async ({ page }) => {
            await expect(page.locator("text=Summary")).toBeVisible();
        });

        test("should show download format selector", async ({ page }) => {
            const formatSelect = page.getByTestId("format");
            await expect(formatSelect).toBeVisible();
            await expect(formatSelect).toBeEnabled();

            await expect(formatSelect).toHaveValue("csv"); // Default value

            // verify the 4 options are in the DOM
            const options = formatSelect.locator("option");
            await expect(options).toHaveCount(4);
            await expect(options).toHaveText(["CSV", "XML", "JSON", "GeoJSON"]);
        });

        test("should change download format", async ({ page }) => {
            const formatSelect = page.getByTestId("format");

            await formatSelect.selectOption("csv");
            await expect(formatSelect).toHaveValue("csv");
            await formatSelect.selectOption("xml");
            await expect(formatSelect).toHaveValue("xml");
            await formatSelect.selectOption("json");
            await expect(formatSelect).toHaveValue("json");
            await formatSelect.selectOption("geojson");
            await expect(formatSelect).toHaveValue("geojson");
        });

        test("should disable download when no search performed", async ({ page }) => {
            const downloadButton = page.locator("button", { hasText: "Download" });
            await expect(downloadButton).toBeVisible();
            await expect(downloadButton).toBeDisabled();
            await expect(downloadButton).toHaveClass(/cursor-not-allowed/);

            const downloadIcon = page.getByTestId("download-icon");
            await expect(downloadIcon).toBeVisible();
            await expect(downloadIcon).toBeDisabled();
            await expect(downloadIcon).toHaveClass(/cursor-not-allowed/);
        });

        test("should enable download after search", async ({ page }) => {
            // Perform a search first
            await getSummary(page); // This will trigger the search

            // Download should be enabled after search
            const downloadButton = page.locator("button", { hasText: "Download" });
            await expect(downloadButton).toBeVisible();
            await expect(downloadButton).toBeEnabled();
            await expect(downloadButton).toHaveClass(/cursor-pointer/);

            const downloadIcon = page.getByTestId("download-icon");
            await expect(downloadIcon).toBeVisible();
            await expect(downloadIcon).toBeEnabled();
            await expect(downloadIcon).toHaveClass(/cursor-pointer/);
        });

        test("should enable download after search when logged in as admin", async ({ page }) => {
            await page.goto(url + "login", { waitUntil: "domcontentloaded" });
            await page.fill('input[placeholder="Your Username"]', "admin");
            await page.fill('input[placeholder="Your Password"]', "admin");
            await page.click('button[type="submit"]');

            await page.waitForURL(url, { waitUntil: "domcontentloaded" });

            interceptDataForExportPage(page);

            // Perform a search first
            await getSummary(page); // This will trigger the search

            // Download should be enabled after search
            const downloadButton = page.locator("button", { hasText: "Download" });
            await expect(downloadButton).toBeVisible();
            await expect(downloadButton).toBeEnabled();
            await expect(downloadButton).toHaveClass(/cursor-pointer/);

            const downloadIcon = page.getByTestId("download-icon");
            await expect(downloadIcon).toBeVisible();
            await expect(downloadIcon).toBeEnabled();
            await expect(downloadIcon).toHaveClass(/cursor-pointer/);
        });

        test("should disable download when filters out of sync", async ({ page }) => {
            // Perform a search first
            await getSummary(page); // This will trigger the search

            // Change a filter after search
            const tempCheckbox = page.getByRole("checkbox", { name: "Temperature" }).first();
            await tempCheckbox.click();

            // Download should be disabled due to filters being out of sync
            const downloadButton = page.locator("button", { hasText: "Download" });
            await expect(downloadButton).toBeVisible();
            await expect(downloadButton).toBeDisabled();
            await expect(downloadButton).toHaveClass(/cursor-not-allowed/);

            const downloadIcon = page.getByTestId("download-icon");
            await expect(downloadIcon).toBeVisible();
            await expect(downloadIcon).toBeDisabled();
            await expect(downloadIcon).toHaveClass(/cursor-not-allowed/);
        });
    });

    test.describe.configure({ mode: "serial" });

    test.describe("Full User Flow Tests", () => {
        let measurementWithTemp;
        let measurementTheHague;
        let measurementBoston;
        let measurementWell;
        let measurementNetwork;
        let measurement20Degrees;
        let measurement30Degrees;
        let measurement2024;
        let measurement2025;
        let measurementMorning;
        let measurementAfternoon;
        let measurementAll;

        test.beforeAll(async () => {
            measurementWithTemp = {
                timestamp: "2024-01-01T09:00:00Z",
                localDate: "2024-01-01",
                localTime: "09:00:00",
                latitude: 52.0,
                longitude: 5.0,
                waterSource: "well",
                temperature: { sensor: "analog thermometer", value: 12.5, time_waited: 3 },
            };

            measurementTheHague = {
                timestamp: "2024-01-01T09:00:00Z",
                localDate: "2024-01-01",
                localTime: "09:00:00",
                latitude: 52.08,
                longitude: 4.32,
                waterSource: "well",
                temperature: { sensor: "analog thermometer", value: 20.0, time_waited: 3 },
            };

            measurementBoston = {
                timestamp: "2025-06-01T15:30:00Z",
                localDate: "2025-06-01",
                localTime: "15:30:00",
                latitude: 42.33,
                longitude: -71.09,
                waterSource: "network",
                temperature: { sensor: "digital thermometer", value: 30.0, time_waited: 3 },
            };

            measurementWell = measurementTheHague;
            measurementNetwork = measurementBoston;
            measurement20Degrees = measurementTheHague;
            measurement30Degrees = measurementBoston;
            measurement2024 = measurementTheHague;
            measurement2025 = measurementBoston;
            measurementMorning = measurementTheHague;
            measurementAfternoon = measurementBoston;
            measurementAll = measurementTheHague;
        });

        test("add data & then search - no filters", async ({ page }) => {
            interceptDataForExportPage(page);

            const before = await getSummary(page);

            // add measurement to the database
            await addMeasurement(page, measurementWithTemp);

            const after = await getSummary(page);

            expect(after.count).toBe(before.count + 1);
            const expectedAvgTemp = Math.round(((before.avgTemp * before.count + 12.5) * 10) / (before.count + 1)) / 10;
            expect(after.avgTemp).toBeCloseTo(expectedAvgTemp, 0);
        });

        test("add data & then search - continent filtering, added measurement not included", async ({ page }) => {
            interceptDataForExportPage(page);

            const continentDropdown = page.locator(".multiselect-custom-wrapper").first();
            await continentDropdown.click();

            const asia = page.getByText("Asia").first();
            await asia.click();

            const before = await getSummary(page);

            // add two measurements to the database
            await addMeasurement(page, measurementTheHague);
            await addMeasurement(page, measurementBoston);

            const after = await getSummary(page);

            expect(after.count).toBe(before.count);
            expect(after.avgTemp).toBeCloseTo(before.avgTemp, 0);
        });

        test("add data & then search - continent filtering, added measurement included", async ({ page }) => {
            interceptDataForExportPage(page);

            const continentDropdown = page.locator(".multiselect-custom-wrapper").first();
            await continentDropdown.click();

            const europe = page.getByText("Europe").first();
            await europe.click();

            const before = await getSummary(page);

            // add two measurements to the database
            await addMeasurement(page, measurementTheHague);
            await addMeasurement(page, measurementBoston);

            const after = await getSummary(page);

            expect(after.count).toBe(before.count + 1);
            const expectedAvgTemp = Math.round(((before.avgTemp * before.count + 20.0) * 10) / after.count) / 10;
            expect(after.avgTemp).toBeCloseTo(expectedAvgTemp, 0);
        });

        test("add data & then search - continent and country filtering, added measurements not included", async ({
            page,
        }) => {
            interceptDataForExportPage(page);

            const continentDropdown = page.locator(".multiselect-custom-wrapper").first();
            await continentDropdown.click();

            const europe = page.getByText("Europe").first();
            await europe.click();

            const northAmerica = page.getByText("North America").first();
            await northAmerica.click();

            await continentDropdown.click(); // close dropdown

            const countryDropdown = page.locator(".multiselect-custom-wrapper").nth(1);
            await countryDropdown.click();

            const searchInput = page.locator('input[placeholder="Search subregions..."]');
            await searchInput.fill("Netherlands");
            const netherlands = page.getByText("Netherlands").first();
            await netherlands.click();

            await searchInput.fill("United States of America");
            const unitedStates = page.getByText("United States of America").first();
            await unitedStates.click();

            countryDropdown.click(); // close dropdown

            const before = await getSummary(page);

            // add two measurements to the database
            await addMeasurement(page, measurementTheHague);
            await addMeasurement(page, measurementBoston);

            const after = await getSummary(page);

            expect(after.count).toBe(before.count);
            expect(after.avgTemp).toBeCloseTo(before.avgTemp, 0);
        });

        test("add data & then search - continent and country filtering, added measurements included", async ({
            page,
        }) => {
            interceptDataForExportPage(page);

            const continentDropdown = page.locator(".multiselect-custom-wrapper").first();
            await continentDropdown.click();

            const europe = page.getByText("Europe").first();
            await europe.click();

            const northAmerica = page.getByText("North America").first();
            await northAmerica.click();

            await continentDropdown.click(); // close dropdown

            const countryDropdown = page.locator(".multiselect-custom-wrapper").nth(1);
            await countryDropdown.click();

            const selectAllCountriesButton = page.locator(".multiselect-select-all").nth(1);
            await selectAllCountriesButton.click();

            const searchInput = page.locator('input[placeholder="Search subregions..."]');
            await searchInput.fill("Netherlands");
            const netherlands = page.getByText("Netherlands").first();
            await netherlands.click();

            await searchInput.fill("United States of America");
            const unitedStates = page.getByText("United States of America").first();
            await unitedStates.click();

            countryDropdown.click(); // close dropdown

            const before = await getSummary(page);

            // add two measurements to the database
            await addMeasurement(page, measurementTheHague);
            await addMeasurement(page, measurementBoston);

            const after = await getSummary(page);

            expect(after.count).toBe(before.count + 2);
            const expectedAvgTemp = Math.round(((before.avgTemp * before.count + 20.0 + 30.0) * 10) / after.count) / 10;
            expect(after.avgTemp).toBeCloseTo(expectedAvgTemp, 0);
        });

        test("add data & then search - water source filtering, added measurements not included", async ({ page }) => {
            await page.goto(url + "export", { waitUntil: "domcontentloaded" });

            const waterSourceDropdown = page.locator(".multiselect-custom-wrapper").nth(2);
            await waterSourceDropdown.click();

            const rooftopTank = page.getByText("Rooftop Tank").first();
            await rooftopTank.click();

            const before = await getSummary(page);

            // add two measurements to the database
            await addMeasurement(page, measurementWell);
            await addMeasurement(page, measurementNetwork);

            const after = await getSummary(page);

            expect(after.count).toBe(before.count);
            expect(after.avgTemp).toBeCloseTo(before.avgTemp, 0);
        });

        test("add data & then search - water source filtering, added measurement included", async ({ page }) => {
            await page.goto(url + "export", { waitUntil: "domcontentloaded" });

            const waterSourceDropdown = page.locator(".multiselect-custom-wrapper").nth(2);
            await waterSourceDropdown.click();

            const network = page.getByText("Network").first();
            await network.click();

            const before = await getSummary(page);

            // add two measurements to the database
            await addMeasurement(page, measurementWell);
            await addMeasurement(page, measurementNetwork);

            const after = await getSummary(page);

            expect(after.count).toBe(before.count + 1);
            const expectedAvgTemp = Math.round(((before.avgTemp * before.count + 30.0) * 10) / after.count) / 10;
            expect(after.avgTemp).toBeCloseTo(expectedAvgTemp, 0);
        });

        test("add data & then search - temperature range filtering celsius, added measurements not included", async ({
            page,
        }) => {
            await page.goto(url + "export", { waitUntil: "domcontentloaded" });

            const minTempInput = page.locator('input[placeholder="Min temperature"]');
            const maxTempInput = page.locator('input[placeholder="Max temperature"]');

            await minTempInput.fill("0");
            await maxTempInput.fill("19");

            const before = await getSummary(page);

            // add two measurements to the database
            await addMeasurement(page, measurement20Degrees);
            await addMeasurement(page, measurement30Degrees);

            const after = await getSummary(page);

            expect(after.count).toBe(before.count);
            expect(after.avgTemp).toBeCloseTo(before.avgTemp, 0);
        });

        test("add data & then search - temperature range filtering fahrenheit, added measurements not included", async ({
            page,
        }) => {
            await page.goto(url + "export", { waitUntil: "domcontentloaded" });

            const fahrenheitButton = page.locator("button", { hasText: "°F" });
            await fahrenheitButton.click();
            const minTempInput = page.locator('input[placeholder="Min temperature"]');
            const maxTempInput = page.locator('input[placeholder="Max temperature"]');
            await minTempInput.fill("32");
            await maxTempInput.fill("66.2");

            const before = await getSummary(page);

            // add two measurements to the database
            await addMeasurement(page, measurement20Degrees);
            await addMeasurement(page, measurement30Degrees);

            const after = await getSummary(page);

            expect(after.count).toBe(before.count);
            expect(after.avgTemp).toBeCloseTo(before.avgTemp, 0);
        });

        test("add data & then search - temperature range filtering celsius, added measurement included", async ({
            page,
        }) => {
            await page.goto(url + "export", { waitUntil: "domcontentloaded" });

            const minTempInput = page.locator('input[placeholder="Min temperature"]');
            const maxTempInput = page.locator('input[placeholder="Max temperature"]');

            await minTempInput.fill("0");
            await maxTempInput.fill("20");

            const before = await getSummary(page);

            // add two measurements to the database
            await addMeasurement(page, measurement20Degrees);
            await addMeasurement(page, measurement30Degrees);

            const after = await getSummary(page);

            expect(after.count).toBe(before.count + 1);
            const expectedAvgTemp = Math.round(((before.avgTemp * before.count + 20.0) * 10) / after.count) / 10;
            expect(after.avgTemp).toBeCloseTo(expectedAvgTemp, 0);
        });

        test("add data & then search - temperature range filtering fahrenheit, added measurement included", async ({
            page,
        }) => {
            await page.goto(url + "export", { waitUntil: "domcontentloaded" });

            const fahrenheitButton = page.locator("button", { hasText: "°F" });
            await fahrenheitButton.click();
            const minTempInput = page.locator('input[placeholder="Min temperature"]');
            const maxTempInput = page.locator('input[placeholder="Max temperature"]');
            await minTempInput.fill("32");
            await maxTempInput.fill("68");

            const before = await getSummary(page);

            // add two measurements to the database
            await addMeasurement(page, measurement20Degrees);
            await addMeasurement(page, measurement30Degrees);

            const after = await getSummary(page);

            expect(after.count).toBe(before.count + 1);
            const expectedAvgTemp = Math.round(((before.avgTemp * before.count + 68) * 10) / after.count) / 10;
            expect(after.avgTemp).toBeCloseTo(expectedAvgTemp, 0);
        });

        test("add data & then search - date filtering, added measurements not included", async ({ page }) => {
            await page.goto(url + "export", { waitUntil: "domcontentloaded" });

            const fromDateInput = page.locator('input[type="date"]').first();
            const toDateInput = page.locator('input[type="date"]').nth(1);

            await fromDateInput.fill("2023-01-01");
            await toDateInput.fill("2023-12-31");

            const before = await getSummary(page);

            // add two measurements to the database
            await addMeasurement(page, measurement2024);
            await addMeasurement(page, measurement2025);

            const after = await getSummary(page);

            expect(after.count).toBe(before.count);
            expect(after.avgTemp).toBeCloseTo(before.avgTemp, 0);
        });

        test("add data & then search - date filtering, added measurement included", async ({ page }) => {
            await page.goto(url + "export", { waitUntil: "domcontentloaded" });

            const fromDateInput = page.locator('input[type="date"]').first();
            const toDateInput = page.locator('input[type="date"]').nth(1);

            await fromDateInput.fill("2024-01-01");
            await toDateInput.fill("2024-12-31");

            const before = await getSummary(page);

            // add two measurements to the database
            await addMeasurement(page, measurement2024);
            await addMeasurement(page, measurement2025);

            const after = await getSummary(page);

            expect(after.count).toBe(before.count + 1);
            const expectedAvgTemp = Math.round(((before.avgTemp * before.count + 20.0) * 10) / after.count) / 10;
            expect(after.avgTemp).toBeCloseTo(expectedAvgTemp, 0);
        });

        test("add data & then search - time filtering 1 slot, added measurements not included", async ({ page }) => {
            await page.goto(url + "export", { waitUntil: "domcontentloaded" });

            const addTimeSlotButton = page.locator("button", { hasText: "Add time slot" });
            await addTimeSlotButton.click();
            const fromTimeInput = page.locator('input[type="time"]').first();
            const toTimeInput = page.locator('input[type="time"]').nth(1);
            await fromTimeInput.fill("18:00");
            await toTimeInput.fill("20:00");

            const before = await getSummary(page);

            // add two measurements to the database
            await addMeasurement(page, measurementMorning);
            await addMeasurement(page, measurementAfternoon);

            const after = await getSummary(page);

            expect(after.count).toBe(before.count);
            expect(after.avgTemp).toBeCloseTo(before.avgTemp, 0);
        });

        test("add data & then search - time filtering 1 slot, added measurement included", async ({ page }) => {
            await page.goto(url + "export", { waitUntil: "domcontentloaded" });

            const addTimeSlotButton = page.locator("button", { hasText: "Add time slot" });
            await addTimeSlotButton.click();
            const fromTimeInput = page.locator('input[type="time"]').first();
            const toTimeInput = page.locator('input[type="time"]').nth(1);
            await fromTimeInput.fill("09:00");
            await toTimeInput.fill("11:00");

            const before = await getSummary(page);

            // add two measurements to the database
            await addMeasurement(page, measurementMorning);
            await addMeasurement(page, measurementAfternoon);

            const after = await getSummary(page);

            expect(after.count).toBe(before.count + 1);
            const expectedAvgTemp = Math.round(((before.avgTemp * before.count + 20.0) * 10) / after.count) / 10;
            expect(after.avgTemp).toBeCloseTo(expectedAvgTemp, 0);
        });

        test("add data & then search - time filtering 3 slots, added measurements not included", async ({ page }) => {
            await page.goto(url + "export", { waitUntil: "domcontentloaded" });

            const addTimeSlotButton = page.locator("button", { hasText: "Add time slot" });
            await addTimeSlotButton.click();
            const fromTimeInputFirst = page.locator('input[type="time"]').first();
            const toTimeInputFirst = page.locator('input[type="time"]').nth(1);
            await fromTimeInputFirst.fill("18:00");
            await toTimeInputFirst.fill("20:00");

            await addTimeSlotButton.click();

            const fromTimeInputSecond = page.locator('input[type="time"]').nth(2);
            const toTimeInputSecond = page.locator('input[type="time"]').nth(3);

            await fromTimeInputSecond.fill("10:00");
            await toTimeInputSecond.fill("12:00");

            await addTimeSlotButton.click();

            const fromTimeInputThird = page.locator('input[type="time"]').nth(4);
            const toTimeInputThird = page.locator('input[type="time"]').nth(5);

            await fromTimeInputThird.fill("14:00");
            await toTimeInputThird.fill("14:30");

            const before = await getSummary(page);

            // add two measurements to the database
            await addMeasurement(page, measurementMorning);
            await addMeasurement(page, measurementAfternoon);

            const after = await getSummary(page);

            expect(after.count).toBe(before.count);
            expect(after.avgTemp).toBeCloseTo(before.avgTemp, 0);
        });

        test("add data & then search - time filtering 3 slots, added measurements included", async ({ page }) => {
            await page.goto(url + "export", { waitUntil: "domcontentloaded" });

            const addTimeSlotButton = page.locator("button", { hasText: "Add time slot" });
            await addTimeSlotButton.click();
            const fromTimeInputFirst = page.locator('input[type="time"]').first();
            const toTimeInputFirst = page.locator('input[type="time"]').nth(1);
            await fromTimeInputFirst.fill("09:00");
            await toTimeInputFirst.fill("11:00");
            await addTimeSlotButton.click();
            const fromTimeInputSecond = page.locator('input[type="time"]').nth(2);
            const toTimeInputSecond = page.locator('input[type="time"]').nth(3);
            await fromTimeInputSecond.fill("12:00");
            await toTimeInputSecond.fill("14:00");
            await addTimeSlotButton.click();
            const fromTimeInputThird = page.locator('input[type="time"]').nth(4);
            const toTimeInputThird = page.locator('input[type="time"]').nth(5);
            await fromTimeInputThird.fill("15:00");
            await toTimeInputThird.fill("16:00");

            const before = await getSummary(page);

            // add two measurements to the database
            await addMeasurement(page, measurementMorning);
            await addMeasurement(page, measurementAfternoon);

            const after = await getSummary(page);

            expect(after.count).toBe(before.count + 2);
            const expectedAvgTemp = Math.round(((before.avgTemp * before.count + 20.0 + 30.0) * 10) / after.count) / 10;
            expect(after.avgTemp).toBeCloseTo(expectedAvgTemp, 0);
        });

        test("full user flow - add data, filter, search, download", async ({ page }) => {
            await interceptDataForExportPage(page);

            // Wait for both API calls to complete and the UI to be ready
            const continentDropdown = page.locator(".multiselect-custom-wrapper").first();
            await continentDropdown.click();

            const europe = page.getByText("Europe").first();
            await europe.click();

            await continentDropdown.click(); // close dropdown

            const countryDropdown = page.locator(".multiselect-custom-wrapper").nth(1);
            await countryDropdown.click();
            const selectAllCountriesButton = page.locator(".multiselect-select-all").nth(1);
            await selectAllCountriesButton.click();

            const searchInput = page.locator('input[placeholder="Search subregions..."]');
            await searchInput.fill("Netherlands");
            const netherlands = page.getByText("Netherlands").first();
            await netherlands.click();

            countryDropdown.click(); // close dropdown

            const waterSourceDropdown = page.locator(".multiselect-custom-wrapper").nth(2);
            await waterSourceDropdown.click();
            const well = page.getByText("Well").first();
            await well.click();

            waterSourceDropdown.click(); // close dropdown

            const fahrenheitButton = page.locator("button", { hasText: "°F" });
            await fahrenheitButton.click();
            const minTempInput = page.locator('input[placeholder="Min temperature"]');
            await minTempInput.fill("68");
            const maxTempInput = page.locator('input[placeholder="Max temperature"]');
            await maxTempInput.fill("68");

            const fromDateInput = page.locator('input[type="date"]').first();
            const toDateInput = page.locator('input[type="date"]').nth(1);

            await fromDateInput.fill("2024-01-01");
            await toDateInput.fill("2024-01-01");

            const addTimeSlotButton = page.locator("button", { hasText: "Add time slot" });
            await addTimeSlotButton.click();
            const fromTimeInput = page.locator('input[type="time"]').first();
            const toTimeInput = page.locator('input[type="time"]').nth(1);
            await fromTimeInput.fill("09:00");
            await toTimeInput.fill("09:00");

            // Perform a search
            const before = await getSummary(page);

            // Add a measurement
            await addMeasurement(page, measurementAll);

            const formatSelect = page.locator("select[data-testid=format]");

            // Wait for the format select to be enabled again
            await expect(formatSelect).toBeEnabled({ timeout: 10000 });

            // Perform the search again
            const after = await getSummary(page);

            expect(after.count).toBe(before.count + 1);
            const expectedAvgTemp = Math.round(((before.avgTemp * before.count + 68) * 10) / after.count) / 10;
            expect(after.avgTemp).toBeCloseTo(expectedAvgTemp, 0);

            // The format select should already be enabled at this point
            await expect(formatSelect).toBeEnabled();

            await page.selectOption("select[data-testid=format]", "json");
            const downloadButton = page.locator("button", { hasText: "Download" });
            const [download] = await Promise.all([
                page.waitForEvent("download"), // <-- waits for the next download
                downloadButton.click(), // <-- triggers it
            ]);

            // Verify the download
            const tempFilePath = await download.path();
            expect(tempFilePath).toBeTruthy();

            const raw = await fs.readFile(tempFilePath!, "utf-8");
            const jsonData = JSON.parse(raw);

            // Check if the downloaded data is an array and has at least one measurement
            expect(Array.isArray(jsonData)).toBe(true);
            expect(jsonData.length).toBeGreaterThan(0);

            // Check if measurement is included in the downloaded data
            const found = jsonData.some(
                (m) =>
                    m.local_date === "2024-01-01" &&
                    m.local_time === "09:00:00" &&
                    m.latitude === 52.08 &&
                    m.longitude === 4.32 &&
                    m.flag === false &&
                    m.water_source === "well" &&
                    m.country === "Netherlands" &&
                    m.continent === "Europe" &&
                    m.metrics &&
                    m.metrics.length > 0 &&
                    m.metrics.some(
                        (metric) =>
                            metric.metric_type === "temperature" &&
                            metric.sensor === "analog thermometer" &&
                            Math.abs(metric.value - 20.0) < 0.001 &&
                            metric.time_waited === "0:00:03",
                    ),
            );
            expect(found).toBe(true);
        });

        test("export failure - modal shows", async ({ page }) => {
            // Login
            await login(page);

            await interceptDataForExportPage(page, true);

            // Get summary to ensure the page is loaded
            await getSummary(page);

            await page.route("**/api/measurements/search/", (route) => {
                if (route.request().method() === "POST") {
                    route.fulfill({
                        status: 500,
                        contentType: "application/json",
                        body: JSON.stringify({ error: "Internal Server Error" }),
                    });
                } else {
                    route.continue(); // allow other requests through
                }
            });

            // Try to download without any measurements
            const downloadButton = page.locator("button", { hasText: "Download" });
            await downloadButton.click();

            const modal = page.getByTestId("export-failed-modal");
            await expect(modal).toBeVisible();
            await expect(modal).toContainText("Export Failed");
            const closeButton = modal.locator("button", { hasText: "Okay" });
            await closeButton.click();
            await expect(modal).toBeHidden();
        });
    });
});

/**
 * Logs in a user as a researcher.
 *
 * @param page Playwright Page object to interact with the browser.
 */
async function login(page: Page) {
    await page.goto(url + "login", { waitUntil: "domcontentloaded" });
    await page.fill('input[placeholder="Your Username"]', "researcher");
    await page.fill('input[placeholder="Your Password"]', "researcher");
    await page.click('button[type="submit"]');
}

/**
 * Retrieves the summary of measurements from the export page.
 *
 * @param page Playwright Page object to interact with the browser.
 * @returns A promise that resolves to the summary data.
 */
async function getSummary(page: Page) {
    const searchPromise = page.waitForResponse(
        (response) => response.url().includes("/api/measurements/search/") && response.status() === 200,
    );

    await page.click("button:has-text('Search')");

    const response = await Promise.allSettled([searchPromise]);

    if (response[0].status !== "fulfilled") {
        throw new Error(`Search API failed: ${response[0].reason}`);
    }

    await page.locator("text=Number of Results:").waitFor();

    const countText = await page
        .locator("text=Number of Results:")
        .locator("xpath=..") // up to the <div>
        .locator("span") // the second span
        .last() // one that holds the number
        .textContent();
    const count = parseInt(countText ?? "0", 10);

    const avgText = await page
        .locator("text=Average Temperature:")
        .locator("xpath=..")
        .locator("span")
        .last()
        .textContent();
    // strip off “°C” or “°F”
    const avgTemp = parseFloat((avgText ?? "").replace(/[^0-9.-]/g, ""));

    return { count, avgTemp };
}

/**
 * Intercepts API calls for locations and permissions on the export page.
 *
 * @param page Playwright Page object to interact with the browser.
 * @param loginResearcher Flag indicating whether there has been a login as a researcher.
 */
async function interceptDataForExportPage(page: Page, loginResearcher: boolean = false) {
    const locationsPromise = page.waitForResponse("**/api/locations/", { timeout: 15000 }).catch(() => null);
    const permissionsPromise = page.waitForResponse("**/api/user-permissions/", { timeout: 15000 }).catch(() => null);

    // Navigate back to export page after login
    if (loginResearcher) {
        await page.waitForURL(url + "export", { waitUntil: "domcontentloaded" });
    } else {
        await page.goto(url + "export", { waitUntil: "domcontentloaded" });
    }

    // Wait for the API responses (if they happen) or continue if they don't
    await Promise.allSettled([locationsPromise, permissionsPromise]);
}
