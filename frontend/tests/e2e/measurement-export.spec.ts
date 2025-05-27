import { test, expect, Page } from "@playwright/test";
import { addMeasurement } from "./utils";

const url = "http://localhost/";

test.describe("Export View Tests", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(url + "export");
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
        await page.goto(url + "export");
    });

    test("should display all filter sections", async ({ page }) => {
        await expect(page.getByText("Location", { exact: true })).toBeVisible();
        await expect(page.getByText("Continent", { exact: true })).toBeVisible();
        await expect(page.getByText("Country", { exact: true })).toBeVisible();
        await expect(page.getByText("Measurement Type", { exact: true })).toBeVisible();
        await expect(page.getByText("Water Source", { exact: true })).toBeVisible();
        await expect(page.getByText("Date", { exact: true })).toBeVisible();
        await expect(page.getByText("Time", { exact: true })).toBeVisible();
    });

    test("should open and close continent dropdown", async ({ page }) => {
        const continentDropdown = page.locator(".multiselect-custom-wrapper").first();
        await continentDropdown.click();

        // Check if dropdown options are visible
        await expect(page.locator(".multiselect-custom-dropdown").first()).toBeVisible();

        // Click outside to close
        await page.locator("body").click();
        await expect(page.locator(".multiselect-custom-dropdown").first()).not.toBeVisible();
    });

    test("should select and deselect continents", async ({ page }) => {
        const continentDropdown = page.locator(".multiselect-custom-wrapper").first();
        await continentDropdown.click();

        // Select first continent option if available
        const firstOption = page.locator(".multiselect-option").first();
        if (await firstOption.isVisible()) {
            await firstOption.click();
            await expect(firstOption).toHaveClass(/multiselect-option-selected/);

            // Deselect
            await firstOption.click();
            await expect(firstOption).not.toHaveClass(/multiselect-option-selected/);
        } else {
            throw new Error("No continent options available to select");
        }
    });

    test("should use select all/deselect all for continents", async ({ page }) => {
        const continentDropdown = page.locator(".multiselect-custom-wrapper").first();
        await continentDropdown.click();

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

        const countryDropdown = page.locator(".multiselect-custom-wrapper").nth(1);
        await countryDropdown.click();

        const searchInput = page.locator('input[placeholder="Search countries..."]');
        await expect(searchInput).toBeVisible();

        await searchInput.fill("United");

        // Countries should be filtered based on search
        const countryOptions = page.locator("#country-option");
        // assert that at least one country option appears within 5s
        await expect(countryOptions).toHaveCount(6, { timeout: 5_000 });

        const firstCountry = countryOptions.first();
        const countryText = (await firstCountry.textContent())?.toLowerCase() ?? "";
        expect(countryText).toContain("united");
    });

    test("should clear country search when dropdown closes", async ({ page }) => {
        const countryDropdown = page.locator(".multiselect-custom-wrapper").nth(1);
        await countryDropdown.click();

        const searchInput = page.locator('input[placeholder="Search countries..."]');
        await searchInput.fill("test search");

        // Close dropdown
        await page.locator("body").click();

        // Reopen dropdown
        await countryDropdown.click();
        await expect(searchInput).toHaveValue("");
    });

    test("should open and select water sources", async ({ page }) => {
        const wrapper = page.locator(".multiselect-custom-wrapper").nth(2);
        await wrapper.click();

        const dropdown = page.locator(".multiselect-custom-dropdown").nth(2);
        await expect(dropdown).toBeVisible();

        const options = dropdown.locator(".multiselect-option");
        // wait for at least one option
        await expect(options).not.toHaveCount(0);

        const firstOption = options.first();
        await expect(firstOption).toBeVisible();
        await firstOption.click();

        await expect(firstOption).toHaveClass(/multiselect-option-selected/);
    });

    test("should enable and configure temperature filter", async ({ page }) => {
        const tempCheckbox = page.getByRole("checkbox", { name: "Temperature" }).first();
        await tempCheckbox.check();
        await expect(tempCheckbox).toBeChecked();

        // Temperature unit buttons should be visible
        await expect(page.locator("button", { hasText: "°C" })).toBeVisible();
        await expect(page.locator("button", { hasText: "°F" })).toBeVisible();

        // Temperature input fields should be visible
        await expect(page.locator('input[placeholder="Min temperature"]')).toBeVisible();
        await expect(page.locator('input[placeholder="Max temperature"]')).toBeVisible();
    });

    test("should switch temperature units", async ({ page }) => {
        const tempCheckbox = page.getByRole("checkbox", { name: "Temperature" }).first();
        await tempCheckbox.check();

        const celsiusButton = page.locator("button", { hasText: "°C" });
        const fahrenheitButton = page.locator("button", { hasText: "°F" });

        await fahrenheitButton.click();
        await expect(fahrenheitButton).toHaveClass(/bg-main/);

        await celsiusButton.click();
        await expect(celsiusButton).toHaveClass(/bg-main/);
    });

    test("should validate temperature range", async ({ page }) => {
        const tempCheckbox = page.getByRole("checkbox", { name: "Temperature" }).first();
        await tempCheckbox.check();

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
        const removeButton = page.getByRole("button").filter({ hasText: /^$/ }).nth(2);
        await removeButton.click();
        await expect(page.locator('input[type="time"]')).toHaveCount(2);
    });

    test("should validate time slots", async ({ page }) => {
        const addTimeSlotButton = page.locator("button", { hasText: "Add time slot" });
        await addTimeSlotButton.click();

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
        const firstFromTime = page.locator('input[type="time"]').first();
        const firstToTime = page.locator('input[type="time"]').nth(1);
        await firstFromTime.fill("10:00");
        await firstToTime.fill("12:00");

        // Add second time slot
        await addTimeSlotButton.click();
        const secondFromTime = page.locator('input[type="time"]').nth(2);
        const secondToTime = page.locator('input[type="time"]').nth(3);

        // Overlapping times
        await secondFromTime.fill("11:00");
        await secondToTime.fill("13:00");

        await expect(page.locator("text=Time slots must not overlap.")).toBeVisible();

        // Non-overlapping times
        await secondFromTime.fill("13:00");
        await secondToTime.fill("15:00");

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
        const tempCheckbox = page.getByRole("checkbox", { name: "Temperature" }).first();
        await tempCheckbox.check();

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

    test("should reset all filters", async ({ page }) => {
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
        await tempCheckbox.check();

        const minTempInput = page.locator('input[placeholder="Min temperature"]');
        await minTempInput.fill("25");

        const maxTempInput = page.locator('input[placeholder="Max temperature"]');
        await maxTempInput.fill("50");

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
        await expect(continentDropdown).toHaveText("Select continents");
        await expect(countryDropdown).toHaveText("Select countries");
        await expect(waterSourceDropdown).toHaveText("Select water sources");
        await expect(tempCheckbox).not.toBeChecked();
        await tempCheckbox.check();
        await expect(minTempInput).toHaveValue("");
        await expect(maxTempInput).toHaveValue("");
        await expect(fromDateInput).toHaveValue("");
        await expect(toDateInput).toHaveValue("");
        await expect(page.locator('input[type="time"]')).toHaveCount(0); // No time slots
    });
});

test.describe("Search Results Tests", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(url + "export");
    });

    test("should display summary section", async ({ page }) => {
        await expect(page.locator("text=Summary")).toBeVisible();
    });

    test("should disable download format selector if not logged in", async ({ page }) => {
        const formatSelect = page.locator("select#format");
        await expect(formatSelect).toBeVisible();
        await expect(formatSelect).toBeDisabled();
    });

    test("should show download format selector if logged in", async ({ page }) => {
        await login(page);

        const formatSelect = page.locator("select#format");
        await expect(formatSelect).toBeVisible();
        await expect(formatSelect).toBeEnabled();

        await expect(formatSelect).toHaveValue("csv"); // Default value

        // verify the 4 options are in the DOM
        const options = formatSelect.locator("option");
        await expect(options).toHaveCount(4);
        await expect(options).toHaveText(["CSV", "XML", "JSON", "GeoJSON"]);
    });

    test("should change download format", async ({ page }) => {
        await login(page);

        const formatSelect = page.locator("select#format");

        await formatSelect.selectOption("csv");
        await expect(formatSelect).toHaveValue("csv");
        await formatSelect.selectOption("xml");
        await expect(formatSelect).toHaveValue("xml");
        await formatSelect.selectOption("json");
        await expect(formatSelect).toHaveValue("json");
        await formatSelect.selectOption("geojson");
        await expect(formatSelect).toHaveValue("geojson");
    });

    test("should disable download button and icon when not logged in", async ({ page }) => {
        const downloadButton = page.locator("button", { hasText: "Download" });
        await expect(downloadButton).toBeVisible();
        await expect(downloadButton).toBeDisabled();
        await expect(downloadButton).toHaveClass(/cursor-not-allowed/);

        const downloadIcon = page.locator("#download-icon");
        await expect(downloadIcon).toBeVisible();
        await expect(downloadIcon).toBeDisabled();
        await expect(downloadIcon).toHaveClass(/cursor-not-allowed/);
    });

    test("should disable download when no search performed", async ({ page }) => {
        await login(page);

        const downloadButton = page.locator("button", { hasText: "Download" });
        await expect(downloadButton).toBeVisible();
        await expect(downloadButton).toBeDisabled();
        await expect(downloadButton).toHaveClass(/cursor-not-allowed/);

        const downloadIcon = page.locator("#download-icon");
        await expect(downloadIcon).toBeVisible();
        await expect(downloadIcon).toBeDisabled();
        await expect(downloadIcon).toHaveClass(/cursor-not-allowed/);
    });

    test("should enable download after search when logged in", async ({ page }) => {
        await login(page);

        // Perform a search first
        const searchButton = page.locator("button", { hasText: "Search" });
        await searchButton.click();

        // Download should be enabled after search
        const downloadButton = page.locator("button", { hasText: "Download" });
        await expect(downloadButton).toBeVisible();
        await expect(downloadButton).toBeEnabled();
        await expect(downloadButton).toHaveClass(/cursor-pointer/);

        const downloadIcon = page.locator("#download-icon");
        await expect(downloadIcon).toBeVisible();
        await expect(downloadIcon).toBeEnabled();
        await expect(downloadIcon).toHaveClass(/cursor-pointer/);
    });

    test("should disable download when filters out of sync", async ({ page }) => {
        await login(page);

        // Perform a search first
        const searchButton = page.locator("button", { hasText: "Search" });
        await searchButton.click();

        // Change a filter after search
        const tempCheckbox = page.getByRole("checkbox", { name: "Temperature" }).first();
        await tempCheckbox.check();

        // Download should be disabled due to filters being out of sync
        const downloadButton = page.locator("button", { hasText: "Download" });
        await expect(downloadButton).toBeVisible();
        await expect(downloadButton).toBeDisabled();
        await expect(downloadButton).toHaveClass(/cursor-not-allowed/);

        const downloadIcon = page.locator("#download-icon");
        await expect(downloadIcon).toBeVisible();
        await expect(downloadIcon).toBeDisabled();
        await expect(downloadIcon).toHaveClass(/cursor-not-allowed/);
    });
});

test.describe("Integration Tests", () => {
    test("add data & then export - no filters", async ({ page }) => {
        await page.goto(url + "export");
        const before = await getSummary(page);

        // add two measurements to the database
        await addMeasurement(
            page,
            {
                timestamp: "2024-01-01T09:00:00Z",
                localDate: "2024-01-01",
                localTime: "09:00:00",
                latitude: 52.0,
                longitude: 5.0,
                waterSource: "well",
                temperature: { sensor: "analog thermometer", value: 12.5, time_waited: 3 },
            },
            url,
        );
        await addMeasurement(
            page,
            {
                timestamp: "2024-06-01T15:30:00Z",
                localDate: "2024-06-01",
                localTime: "15:30:00",
                latitude: 52.1,
                longitude: 5.1,
                waterSource: "network",
                // no temperature key → serializer just ignores it
            },
            url,
        );

        await page.goto(url + "export");
        const after = await getSummary(page);

        expect(after.count).toBe(before.count + 2);
        expect(after.avgTemp).toBeCloseTo((before.avgTemp * before.count + 12.5) / (before.count + 1), 1);
    });
});

/**
 * Logs in a user with the given credentials.
 *
 * @param page Playwright Page object to interact with the browser.
 */
async function login(page: Page) {
    await page.goto(url + "login");
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
    const [response] = await Promise.all([
        page.waitForResponse("**/api/measurements/search/**", { timeout: 10_000 }),
        page.click("button:has-text('Search')"),
    ]);

    if (!response.ok()) {
        throw new Error(`Search API failed: ${response.status()}`);
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
