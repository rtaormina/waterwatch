import { test, expect, Page } from "@playwright/test";
import { AddPresetOpts, AddMeasurementOpts, addMeasurement } from "./utils";

const url = "http://localhost/";

test.describe("Basic Presets Tests", () => {
    test("should display the search bar", async ({ page }) => {
        await page.goto(url + "export", { waitUntil: "domcontentloaded" });
        const searchInput = page.getByTestId("search-input");
        await expect(searchInput).toBeVisible();
        await expect(searchInput).toHaveAttribute("placeholder", "Search for presets...");
        const clearSearchButton = page.getByTestId("clear-search-bar-button");
        await expect(clearSearchButton).toBeVisible();
        await expect(clearSearchButton).toHaveClass(/cursor-pointer/);
        const searchButton = page.getByTestId("search-bar-button");
        await expect(searchButton).toBeVisible();
        await expect(searchButton).toHaveClass(/cursor-pointer/);
    });

    test("should open and close the preset dropdown", async ({ page }) => {
        await page.goto(url + "export", { waitUntil: "domcontentloaded" });
        const searchInput = page.getByTestId("search-input");
        searchInput.click();
        const presetDropdown = page.getByTestId("preset-dropdown");
        await expect(presetDropdown).toBeVisible();
        await page.click("body"); // Click outside to close the dropdown
        await expect(presetDropdown).toBeHidden();
    });

    test("clear search button should clear the search input", async ({ page }) => {
        await page.goto(url + "export", { waitUntil: "domcontentloaded" });
        const searchInput = page.getByTestId("search-input");
        await searchInput.fill("Test Preset");
        const clearSearchButton = page.getByTestId("clear-search-bar-button");
        await clearSearchButton.click();
        await expect(searchInput).toHaveValue("");
    });

    test("should disable search bar button when temperature validation fails", async ({ page }) => {
        await interceptDataForExportPage(page, false);

        const searchBarButton = page.getByTestId("search-bar-button");

        // Enable temperature with invalid range
        await page.getByRole("checkbox", { name: "Temperature" }).first().check();

        const minTempInput = page.locator('input[placeholder="Min temperature"]');
        const maxTempInput = page.locator('input[placeholder="Max temperature"]');

        await minTempInput.fill("50");
        await maxTempInput.fill("25");

        await expect(searchBarButton).toBeDisabled();

        // Fix the temperature range
        await minTempInput.fill("25");
        await maxTempInput.fill("50");
        await expect(searchBarButton).toBeEnabled();
    });

    test("should disable search bar button when date validation fails", async ({ page }) => {
        await interceptDataForExportPage(page, false);

        const searchBarButton = page.getByTestId("search-bar-button");

        // Enable date with invalid range
        const fromDateInput = page.locator('input[type="date"]').first();
        const toDateInput = page.locator('input[type="date"]').nth(1);

        await fromDateInput.fill("2024-12-31");
        await toDateInput.fill("2024-01-01");

        await expect(searchBarButton).toBeDisabled();

        // Fix the date range
        await fromDateInput.fill("2024-01-01");
        await toDateInput.fill("2024-12-31");
        await expect(searchBarButton).toBeEnabled();
    });

    test("should disable search bar button when time validation fails", async ({ page }) => {
        await interceptDataForExportPage(page, false);

        const searchBarButton = page.getByTestId("search-bar-button");
        const addTimeSlotButton = page.locator("button", { hasText: "Add time slot" });
        await addTimeSlotButton.click();
        const fromTimeInput = page.locator('input[type="time"]').first();
        const toTimeInput = page.locator('input[type="time"]').nth(1);
        await fromTimeInput.fill("15:00");
        await toTimeInput.fill("10:00");
        await expect(searchBarButton).toBeDisabled();
        // Fix the time range
        await fromTimeInput.fill("10:00");
        await toTimeInput.fill("15:00");
        await expect(searchBarButton).toBeEnabled();
    });

    test("should disable search bar button when timeslots overlap", async ({ page }) => {
        await interceptDataForExportPage(page, false);

        const searchBarButton = page.getByTestId("search-bar-button");
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
        await expect(searchBarButton).toBeDisabled();

        await secondFromTime.fill("12:00");
        await secondToTime.fill("15:00");
        await expect(searchBarButton).toBeDisabled();

        // Fix the overlapping times
        await secondFromTime.fill("13:00");
        await secondToTime.fill("15:00");
        await expect(searchBarButton).toBeEnabled();
    });
});

test.describe("Preset Creation and Application Test", () => {
    test.describe.configure({ mode: "serial" });

    const presetOneContinent: AddPresetOpts = {
        name: "One Continent",
        description: "Preset for one continent.",
        isPublic: true,
        filters: {
            continents: ["Asia"],
        },
    };

    const presetAllContinents: AddPresetOpts = {
        name: "All Continents",
        description: "Preset for all continents.",
        isPublic: true,
        filters: {
            continents: ["All"],
        },
    };

    const presetOneContinentAllCountries: AddPresetOpts = {
        name: "All Countries",
        description: "Preset for all countries.",
        isPublic: true,
        filters: {
            continents: ["Asia"],
            countries: ["All"],
        },
    };

    const presetOneContinentOneCountry: AddPresetOpts = {
        name: "One Country",
        description: "Preset for one country.",
        isPublic: true,
        filters: {
            continents: ["Asia"],
            countries: ["India"],
        },
    };

    const presetAllContinentsAllCountries: AddPresetOpts = {
        name: "All Continents All Countries",
        description: "Preset for all continents and all countries.",
        isPublic: true,
        filters: {
            continents: ["All"],
            countries: ["All"],
        },
    };

    const presetOneWaterSource: AddPresetOpts = {
        name: "One Water Source",
        description: "Preset for one water source.",
        isPublic: true,
        filters: {
            waterSources: ["Rooftop Tank"],
        },
    };

    const presetAllWaterSources: AddPresetOpts = {
        name: "All Water Sources",
        description: "Preset for all water sources.",
        isPublic: true,
        filters: {
            waterSources: ["All"],
        },
    };

    const presetTemperatureRangeOnlyFrom: AddPresetOpts = {
        name: "Temperature Range Only From",
        description: "Preset for temperature range with only 'from' value.",
        isPublic: true,
        filters: {
            temperatureEnabled: true,
            temperatureRange: [10, null],
            temperatureUnit: "C",
        },
    };

    const presetTemperatureRangeOnlyTo: AddPresetOpts = {
        name: "Temperature Range Only To",
        description: "Preset for temperature range with only 'to' value.",
        isPublic: true,
        filters: {
            temperatureEnabled: true,
            temperatureRange: [null, 30],
            temperatureUnit: "C",
        },
    };

    const presetTemperatureRangeCelsius: AddPresetOpts = {
        name: "Temperature Range Celsius",
        description: "Preset for temperature range.",
        isPublic: true,
        filters: {
            temperatureEnabled: true,
            temperatureRange: [10, 40],
            temperatureUnit: "C",
        },
    };

    const presetTemperatureRangeFahrenheit: AddPresetOpts = {
        name: "Temperature Range Fahrenheit",
        description: "Preset for temperature range.",
        isPublic: true,
        filters: {
            temperatureEnabled: true,
            temperatureRange: [50, 100],
            temperatureUnit: "F",
        },
    };

    const presetDateRangeOnlyFrom: AddPresetOpts = {
        name: "Date Range Only From",
        description: "Preset for date range with only 'from' date.",
        isPublic: true,
        filters: {
            dateRange: ["2024-01-01", null],
        },
    };

    const presetDateRangeOnlyTo: AddPresetOpts = {
        name: "Date Range Only To",
        description: "Preset for date range with only 'to' date.",
        isPublic: true,
        filters: {
            dateRange: [null, "2024-12-31"],
        },
    };

    const presetDateRange: AddPresetOpts = {
        name: "Date Range",
        description: "Preset for date range.",
        isPublic: true,
        filters: {
            dateRange: ["2024-01-01", "2024-12-31"],
        },
    };

    const presetOneTimeSlot: AddPresetOpts = {
        name: "One Time Slot",
        description: "Preset for one time slot.",
        isPublic: true,
        filters: {
            timeSlots: [{ start: "08:00", end: "10:00" }],
        },
    };

    const presetTimeSlotsMixed: AddPresetOpts = {
        name: "Time Slots Mixed",
        description: "Preset for time slots with mixed start and end times.",
        isPublic: true,
        filters: {
            timeSlots: [
                { start: null, end: "10:00" },
                { start: "14:00", end: null },
            ],
        },
    };

    const presetsTimeSlots: AddPresetOpts = {
        name: "Time Slots",
        description: "Preset for time slots.",
        isPublic: true,
        filters: {
            timeSlots: [
                { start: "06:00", end: "12:00" },
                { start: "13:00", end: "19:00" },
                { start: "20:00", end: "22:00" },
            ],
        },
    };

    const presetOptsAllFilters: AddPresetOpts = {
        name: "All Filters",
        description: "This is a test preset for export functionality.",
        isPublic: true,
        filters: {
            continents: ["Europe"],
            countries: ["Netherlands"],
            waterSources: ["Well"],
            temperatureEnabled: true,
            temperatureRange: [10, 30],
            temperatureUnit: "C",
            dateRange: ["2025-01-01", "2025-12-31"],
            timeSlots: [
                { start: "08:00", end: "10:00" },
                { start: "14:00", end: "16:00" },
                { start: "18:00", end: "20:00" },
            ],
        },
    };

    test.beforeEach(async ({ page }) => {
        await adminLogin(page);
        await deleteAllPresets(page);
    });

    test("no presets should be displayed initially", async ({ page }) => {
        await interceptDataForExportPage(page, false);
        const searchInput = page.getByTestId("search-input");
        await searchInput.click();
        const presetList = page.getByTestId("preset-item");
        await expect(presetList).toHaveCount(0);
        const emptyStateIcon = page.getByTestId("empty-state-icon");
        await expect(emptyStateIcon).toBeVisible();
        const noPresetsMessage = page.getByTestId("no-presets-message");
        await expect(noPresetsMessage).toBeVisible();
    });

    test("added public preset should be displayed in the list", async ({ page }) => {
        await addPreset(page, presetOptsAllFilters);
        await interceptDataForExportPage(page, false);
        const searchInput = page.getByTestId("search-input");
        await searchInput.click();
        const presetList = page.getByTestId("preset-item");
        await expect(presetList).toHaveCount(1);
        const presetItem = presetList.first();
        await expect(presetItem).toContainText(presetOptsAllFilters.name);
        await expect(presetItem).toContainText(presetOptsAllFilters.description);
    });

    test("should apply one continent filter", async ({ page }) => {
        await addPresetAndVerify(page, presetOneContinent);
    });

    test("should apply all continents filter", async ({ page }) => {
        await addPresetAndVerify(page, presetAllContinents);
    });

    test("should apply one continent and all countries filter", async ({ page }) => {
        await addPresetAndVerify(page, presetOneContinentAllCountries);
    });

    test("should apply one continent and one country filter", async ({ page }) => {
        await addPresetAndVerify(page, presetOneContinentOneCountry);
    });

    test("should apply all continents and all countries filter", async ({ page }) => {
        await addPresetAndVerify(page, presetAllContinentsAllCountries);
    });

    test("should apply one water source filter", async ({ page }) => {
        await addPresetAndVerify(page, presetOneWaterSource);
    });

    test("should apply all water sources filter", async ({ page }) => {
        await addPresetAndVerify(page, presetAllWaterSources);
    });

    test("should apply temperature range only from filter", async ({ page }) => {
        await addPresetAndVerify(page, presetTemperatureRangeOnlyFrom);
    });

    test("should apply temperature range only to filter", async ({ page }) => {
        await addPresetAndVerify(page, presetTemperatureRangeOnlyTo);
    });

    test("should apply temperature range in Celsius", async ({ page }) => {
        await addPresetAndVerify(page, presetTemperatureRangeCelsius);
    });

    test("should apply temperature range in Fahrenheit", async ({ page }) => {
        await addPresetAndVerify(page, presetTemperatureRangeFahrenheit);
    });

    test("should apply date range only from filter", async ({ page }) => {
        await addPresetAndVerify(page, presetDateRangeOnlyFrom);
    });

    test("should apply date range only to filter", async ({ page }) => {
        await addPresetAndVerify(page, presetDateRangeOnlyTo);
    });

    test("should apply date range filter", async ({ page }) => {
        await addPresetAndVerify(page, presetDateRange);
    });

    test("should apply one time slot filter", async ({ page }) => {
        await addPresetAndVerify(page, presetOneTimeSlot);
    });

    test("should apply mixed time slots filter", async ({ page }) => {
        await addPresetAndVerify(page, presetTimeSlotsMixed);
    });

    test("should apply multiple time slots filter", async ({ page }) => {
        await addPresetAndVerify(page, presetsTimeSlots);
    });

    test("should apply all filters in a single preset", async ({ page }) => {
        await addPresetAndVerify(page, presetOptsAllFilters);
    });

    test("should display multiple searchable presets in the list", async ({ page }) => {
        await addPreset(page, presetTemperatureRangeFahrenheit);
        await addPreset(page, presetDateRangeOnlyFrom);
        await addPreset(page, presetDateRangeOnlyTo);
        await addPreset(page, presetDateRange);
        await interceptDataForExportPage(page, false);
        const searchInput = page.getByTestId("search-input");
        await searchInput.click();
        const presetList = page.getByTestId("preset-item");
        await expect(presetList).toHaveCount(4); // Should match the number of presets added
        await searchInput.fill("Date");
        await expect(presetList).toHaveCount(3); // Should match the number of presets with "Date" in the name
        // Assert that the preset list contains the expected presets in any order
        const expectedPresets = [presetDateRangeOnlyFrom.name, presetDateRangeOnlyTo.name, presetDateRange.name];
        for (const presetName of expectedPresets) {
            const presetItem = presetList.locator(`text=${presetName}`).first();
            await expect(presetItem).toBeVisible();
        }
        await searchInput.fill(""); // Clear the search input
        await expect(presetList).toHaveCount(4); // Should return to the original count
    });
});

/**
 * Add a preset and verify its application.
 *
 * @param page Playwright Page object to interact with the browser.
 * @param presetOpts Options for the preset to be added.
 */
async function addPresetAndVerify(page: Page, presetOpts: AddPresetOpts) {
    // Add the preset
    await addPreset(page, presetOpts);
    // Intercept data for the export page
    await interceptDataForExportPage(page, false);
    // Verify the preset is applied correctly in the UI
    await verifyPresetApplication(page, presetOpts);
}

/**
 * Verify that the preset is correctly applied in the UI.
 *
 * @param page Playwright Page object to interact with the browser.
 * @param presetOpts Options for the preset to be verified.
 */
async function verifyPresetApplication(page: Page, presetOpts: AddPresetOpts) {
    // Search for the preset
    const searchInput = page.getByTestId("search-input");
    await searchInput.fill(presetOpts.name);
    // Wait for the preset to appear in the list
    const presetList = page.getByTestId("preset-item");
    const presetItem = presetList.locator(`text=${presetOpts.name}`).first();
    await presetItem.click();

    // Continents
    if (presetOpts.filters.continents && presetOpts.filters.continents.length > 0) {
        await page.locator("[data-testid=continent-placeholder], [data-testid=continent-text]").first().click();

        if (presetOpts.filters.continents.includes("All")) {
            // Grab all of the <div class="multiselect-option"> elements
            const allOptions = page.getByTestId("continent-options").locator(".multiselect-option");
            // Grab only the ones that have the "multiselect-option-selected" class
            const selectedOptions = page.getByTestId("continent-options").locator(".multiselect-option-selected");
            // Assert that count(selected) === count(all)
            await expect(await selectedOptions.count()).toBe(await allOptions.count());
            // Close the dropdown (click “outside”)
            await page.click("body");
        } else {
            for (const continent of presetOpts.filters.continents) {
                // For each expected continent, find its option and assert it has the "selected" class
                const optionLocator = page
                    .getByTestId("continent-options")
                    .getByText(continent, { exact: true })
                    .locator("..");
                // The parent <div> has class "multiselect-option"; check if it also has "multiselect-option-selected"
                await expect(optionLocator).toHaveClass(/multiselect-option-selected/);
            }
        }

        // Close the continent dropdown
        await page.click("body");
    } else {
        // If no continents were passed, the placeholder should be visible
        await expect(page.getByTestId("continent-placeholder")).toBeVisible();
    }

    // Countries
    if (presetOpts.filters.countries && presetOpts.filters.countries.length > 0) {
        // Open the country dropdown
        await page.locator("[data-testid=country-placeholder], [data-testid=country-text]").first().click();

        if (presetOpts.filters.countries.includes("All")) {
            // Grab all of the <div class="multiselect-option"> elements
            const allOptions = page.getByTestId("country-options").locator(".multiselect-option");
            // Grab only the ones that have the "multiselect-option-selected" class
            const selectedOptions = page.getByTestId("country-options").locator(".multiselect-option-selected");
            // Assert that count(selected) === count(all)
            await expect(await selectedOptions.count()).toBe(await allOptions.count());
        } else {
            for (const country of presetOpts.filters.countries) {
                // Because there’s a search field, sometimes you need to scroll/search
                const countryOptionLocator = page
                    .getByTestId("country-options")
                    .getByText(country, { exact: true })
                    .locator("..");
                await expect(countryOptionLocator).toHaveClass(/multiselect-option-selected/);
            }
        }

        await page.click("body");
    } else {
        await expect(page.getByTestId("country-placeholder")).toBeVisible();
    }

    // Water Sources
    if (presetOpts.filters.waterSources && presetOpts.filters.waterSources.length > 0) {
        // Open the water source dropdown
        await page.locator("[data-testid=water-source-placeholder], [data-testid=water-source-text]").first().click();

        if (presetOpts.filters.waterSources.includes("All")) {
            // Grab all of the <div class="multiselect-option"> elements
            const allOptions = page.getByTestId("water-source-options").locator(".multiselect-option");
            // Grab only the ones that have the "multiselect-option-selected" class
            const selectedOptions = page.getByTestId("water-source-options").locator(".multiselect-option-selected");
            // Assert that count(selected) === count(all)
            await expect(await selectedOptions.count()).toBe(await allOptions.count());
        } else {
            for (const ws of presetOpts.filters.waterSources) {
                const wsOption = page.getByTestId("water-source-options").getByText(ws, { exact: true }).locator("..");
                await expect(wsOption).toHaveClass(/multiselect-option-selected/);
            }
        }

        await page.click("body");
    } else {
        await expect(page.getByTestId("water-source-placeholder")).toBeVisible();
    }

    // Temperature Filter
    const tempEnabled = presetOpts.filters.temperatureEnabled ?? false;
    const temperatureCheckbox = page.getByLabel("Temperature");
    if (tempEnabled) {
        // It should be checked
        await expect(temperatureCheckbox).toBeChecked();

        // Verify unit button: either "°C" or "°F" has the selected classes
        const unit = presetOpts.filters.temperatureUnit ?? "C";
        const cButton = page.getByRole("button", { name: "°C" });
        const fButton = page.getByRole("button", { name: "°F" });

        if (unit === "C") {
            await expect(cButton).toHaveClass(/bg-main\s+text-white/);
            await expect(fButton).not.toHaveClass(/bg-main\s+text-white/);
        } else {
            await expect(fButton).toHaveClass(/bg-main\s+text-white/);
            await expect(cButton).not.toHaveClass(/bg-main\s+text-white/);
        }

        // Verify temperature range inputs
        const [minTemp, maxTemp] = presetOpts.filters.temperatureRange ?? [null, null];
        const minInput = page.locator("input[placeholder='Min temperature']");
        const maxInput = page.locator("input[placeholder='Max temperature']");
        if (minTemp !== null) {
            await expect(minInput).toHaveValue(String(minTemp));
        } else {
            await expect(minInput).toHaveValue(""); // If no minTemp, it should be empty
        }
        if (maxTemp !== null) {
            await expect(maxInput).toHaveValue(String(maxTemp));
        } else {
            await expect(maxInput).toHaveValue(""); // If no maxTemp, it should be empty
        }
    } else {
        await expect(temperatureCheckbox).not.toBeChecked();
        // Ensure the unit buttons are not visible (since v-if="temperatureEnabled")
        await expect(page.locator("button:has-text('°C')")).toBeHidden();
        await expect(page.locator("button:has-text('°F')")).toBeHidden();
        await expect(page.locator("input[placeholder='Min temperature']")).toBeHidden();
        await expect(page.locator("input[placeholder='Max temperature']")).toBeHidden();
    }

    // Date Range
    if (presetOpts.filters.dateRange) {
        const [fromDate, toDate] = presetOpts.filters.dateRange;
        // "From" date input
        const fromDateInput = page.locator("input[type='date']").filter({ hasText: "" }).nth(0);
        const toDateInput = page.locator("input[type='date']").filter({ hasText: "" }).nth(1);

        if (fromDate !== null) {
            await expect(fromDateInput).toHaveValue(fromDate);
        } else {
            await expect(fromDateInput).toHaveValue(""); // If no fromDate, it should be empty
        }
        if (toDate !== null) {
            await expect(toDateInput).toHaveValue(toDate);
        } else {
            await expect(toDateInput).toHaveValue(""); // If no toDate, it should be empty
        }
    } else {
        // If no dateRange passed, both date inputs should be empty
        const dateInputs = page.locator("input[type='date']");
        await expect(dateInputs.nth(0)).toHaveValue("");
        await expect(dateInputs.nth(1)).toHaveValue("");
    }

    // Time Slots
    if (presetOpts.filters.timeSlots && presetOpts.filters.timeSlots.length > 0) {
        // All <input type="time"> fields, in the order they appear
        const allTimeInputs = page.locator("input[type='time']");
        const expectedSlots = presetOpts.filters.timeSlots;

        // Each slot has two inputs: start and end, so total fields should be slots.length * 2
        await expect(allTimeInputs).toHaveCount(expectedSlots.length * 2);

        for (let i = 0; i < expectedSlots.length; i++) {
            const { start, end } = expectedSlots[i];
            const startInput = allTimeInputs.nth(i * 2);
            const endInput = allTimeInputs.nth(i * 2 + 1);

            if (start !== null) {
                await expect(startInput).toHaveValue(start);
            } else {
                await expect(startInput).toHaveValue(""); // If no start time, it should be empty
            }
            if (end !== null) {
                await expect(endInput).toHaveValue(end);
            } else {
                await expect(endInput).toHaveValue(""); // If no end time, it should be empty
            }
        }
    } else {
        // If no timeSlots passed, there should be no <input type="time"> fields
        const allTimeInputs = page.locator("input[type='time']");
        await expect(allTimeInputs).toHaveCount(0);
    }

    // Ensure the search button and search bar button are enabled
    const searchBarButton = page.getByTestId("search-bar-button");
    const searchButton = page.getByTestId("search-button");
    await expect(searchBarButton).toBeEnabled();
    await expect(searchButton).toBeEnabled();
}

/**
 * Logs in as an admin user.
 *
 * @param page Playwright Page object to interact with the browser.
 */
async function adminLogin(page: Page) {
    await page.goto(url + "login");
    await page.fill('input[placeholder="Your Username"]', "admin");
    await page.fill('input[placeholder="Your Password"]', "admin");
    await page.click("button[type='submit']");
    await page.waitForURL(url, { waitUntil: "domcontentloaded" });
}

/**
 * Deletes all presets.
 *
 * @param page Playwright Page object to interact with the browser.
 */
async function deleteAllPresets(page: Page) {
    await page.goto(url + "admin/measurement_export/preset", { waitUntil: "domcontentloaded" });
    const selectAllCheckbox = page.getByRole("checkbox", { name: "Select all objects on this" });
    if ((await selectAllCheckbox.count()) > 0) {
        await selectAllCheckbox.click();
        await page.getByLabel("Action: --------- Delete").selectOption("Delete selected presets");
        await page.getByRole("button", { name: "Go" }).click();
        await page.getByRole("button", { name: "Yes, I’m sure" }).click();
    }
}

/**
 * Adds a new preset.
 *
 * @param page Playwright Page object to interact with the browser.
 * @param opts Options for the preset to be added.
 */
async function addPreset(page: Page, opts: AddPresetOpts) {
    // Navigate to the add preset page
    await page.goto(url + "admin/measurement_export/preset/add/", { waitUntil: "domcontentloaded" });

    // Fill in the preset form
    await page.getByRole("textbox", { name: "Name:", exact: true }).fill(opts.name);
    await page.getByRole("textbox", { name: "Description:", exact: true }).fill(opts.description);
    if (opts.isPublic) {
        await page.getByRole("checkbox", { name: "Is public", exact: true }).check();
    }

    // Set filters
    if (opts.filters) {
        if (opts.filters.continents) {
            if (opts.filters.continents.includes("All")) {
                await page.getByTestId("select-all-toggle").first().click();
            } else {
                await Promise.all(
                    opts.filters.continents.map(async (continent) => {
                        await page.getByText(continent, { exact: true }).click({ force: true });
                    }),
                );
            }
        }
        if (opts.filters.countries) {
            if (opts.filters.countries.includes("All")) {
                await page.getByTestId("select-all-toggle").nth(1).click();
            } else {
                await Promise.all(
                    opts.filters.countries.map(async (country) => {
                        await page.getByText(country, { exact: true }).click({ force: true });
                    }),
                );
            }
        }
        if (opts.filters.waterSources) {
            if (opts.filters.waterSources.includes("All")) {
                await page.getByTestId("select-all-toggle").nth(2).click();
            } else {
                await Promise.all(
                    opts.filters.waterSources.map(async (source) => {
                        await page.getByText(source, { exact: true }).click({ force: true });
                    }),
                );
            }
        }
        if (opts.filters.temperatureEnabled) {
            await page.getByRole("checkbox", { name: "Enable temperature filter" }).check();
            if (opts.filters.temperatureRange) {
                if (opts.filters.temperatureRange[0] !== null && opts.filters.temperatureRange[0] !== undefined) {
                    await page
                        .getByRole("spinbutton", { name: "Minimum temperature:", exact: true })
                        .fill(opts.filters.temperatureRange[0].toString());
                }
                if (opts.filters.temperatureRange[1] !== null && opts.filters.temperatureRange[1] !== undefined) {
                    await page
                        .getByRole("spinbutton", { name: "Maximum temperature:", exact: true })
                        .fill(opts.filters.temperatureRange[1].toString());
                }
            }
            if (opts.filters.temperatureUnit) {
                await page.getByLabel("Unit:", { exact: true }).selectOption(opts.filters.temperatureUnit);
            }
        }
        if (opts.filters.dateRange) {
            if (opts.filters.dateRange[0] !== null && opts.filters.dateRange[0] !== undefined) {
                await page.getByLabel("Date from:", { exact: true }).fill(opts.filters.dateRange[0]);
            }
            if (opts.filters.dateRange[1] !== null && opts.filters.dateRange[1] !== undefined) {
                await page.getByLabel("Date to:", { exact: true }).fill(opts.filters.dateRange[1]);
            }
        }
        if (opts.filters.timeSlots) {
            for (const slot of opts.filters.timeSlots) {
                const timeSlotInput = page.getByRole("textbox", { name: "Time slots:", exact: true });
                const currentValue = await timeSlotInput.inputValue();
                const newValue = currentValue + (currentValue ? ";" : "") + `${slot.start || ""}-${slot.end || ""}`;
                await timeSlotInput.fill(newValue);
            }
        }
    }

    // Submit the form
    await page.getByRole("button", { name: "Save", exact: true }).click();
}

/**
 * Intercepts API calls for locations, permissions, and presets on the export page.
 *
 * @param page Playwright Page object to interact with the browser.
 * @param loginResearcher Flag indicating whether there has been a login as a researcher.
 */
async function interceptDataForExportPage(page: Page, loginResearcher: boolean = false) {
    const locationsPromise = page.waitForResponse("**/api/locations/", { timeout: 15000 }).catch(() => null);
    const permissionsPromise = page.waitForResponse("**/api/user-permissions/", { timeout: 15000 }).catch(() => null);
    const presetsPromise = page.waitForResponse("**/api/presets/", { timeout: 15000 }).catch(() => null);

    // Navigate back to export page after login
    if (loginResearcher) {
        await page.waitForURL(url + "export", { waitUntil: "domcontentloaded" });
    } else {
        await page.goto(url + "export", { waitUntil: "domcontentloaded" });
    }

    // Wait for the API responses (if they happen) or continue if they don't
    await Promise.allSettled([locationsPromise, permissionsPromise, presetsPromise]);
}
