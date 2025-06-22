import { test, expect, Page } from "@playwright/test";
import { a } from "vitest/dist/chunks/suite.d.FvehnV49.js";

const url = "http://localhost/";

async function login(page: Page, username: string, password: string) {
    await page.goto(url + "login", { waitUntil: "domcontentloaded" });
    await page.fill('input[placeholder="Your Username"]', username);
    await page.fill('input[placeholder="Your Password"]', password);
    await page.click('button[type="submit"]');
}

async function loginResearcher(page: Page) {
    await login(page, "researcher", "researcher");
    await page.waitForURL(url + "export", { waitUntil: "domcontentloaded" });
}

async function loginAdmin(page: Page) {
    await login(page, "admin", "admin");
    await page.waitForURL(url, { waitUntil: "domcontentloaded" });
}

async function logout(page: Page) {
    await page.goto(url + "contact", { waitUntil: "domcontentloaded" });
    await page.getByTestId("user-icon-wrapper").click();
    await page.getByRole("menuitem", { name: "Log Out" }).click();
    await page.waitForURL(url, { waitUntil: "domcontentloaded" });
}

test.describe("Privileged Endpoints and Pages", () => {
    test.describe("Privileged Endpoints", () => {
        test("Non-authorized user cannot access /api/measurements/ endpoint", async ({ page }) => {
            // send a request to the endpoint
            const response = await page.request.get(url + "/api/measurements/");
            expect(response.status()).toBe(403);
            const responseBody = await response.json();
            expect(responseBody).toEqual({ error: "Forbidden: insufficient permissions" });
        });
        test("Researcher can access /api/measurements/ endpoint", async ({ page }) => {
            await loginResearcher(page);
            const response = await page.request.get(url + "/api/measurements/");
            expect(response.status()).toBe(200);
            const responseBody = await response.json();
            // Response should be an array of measurements
            expect(Array.isArray(responseBody)).toBe(true);
        });
        test("Admin can access /api/measurements/ endpoint", async ({ page }) => {
            await loginAdmin(page);
            const response = await page.request.get(url + "/api/measurements/");
            expect(response.status()).toBe(200);
            const responseBody = await response.json();
            // Response should be an array of measurements
            expect(Array.isArray(responseBody)).toBe(true);
        });
        test("Non-authorized user cannot access /api/measurements/search/ endpoint", async ({ page }) => {
            // Get the CSRF token from cookies
            const cookies = await page.context().cookies();
            const csrfToken = cookies.find((cookie) => cookie.name === "csrftoken")?.value;

            const response = await page.request.post(url + "/api/measurements/search/", {
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrfToken ?? "",
                },
            });
            expect(response.status()).toBe(403);
            const responseBody = await response.json();
            expect(responseBody).toEqual({ error: "Forbidden: insufficient permissions" });
        });
        test("Researcher can access /api/measurements/search/ endpoint", async ({ page }) => {
            await loginResearcher(page);

            // Get the CSRF token from cookies
            const cookies = await page.context().cookies();
            const csrfToken = cookies.find((cookie) => cookie.name === "csrftoken")?.value;

            const response = await page.request.post(url + "/api/measurements/search/", {
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrfToken ?? "",
                },
            });
            expect(response.status()).toBe(200);
            const responseBody = await response.json();
            expect(responseBody).toEqual(
                expect.objectContaining({
                    count: expect.any(Number),
                    avgTemp: expect.any(Number),
                }),
            );
        });
        test("Admin can access /api/measurements/search/ endpoint", async ({ page }) => {
            await loginAdmin(page);

            // Get the CSRF token from cookies
            const cookies = await page.context().cookies();
            const csrfToken = cookies.find((cookie) => cookie.name === "csrftoken")?.value;

            const response = await page.request.post(url + "/api/measurements/search/", {
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrfToken ?? "",
                },
                data: {
                    json: { format: "csv" },
                },
            });
            expect(response.status()).toBe(200);
            const responseBody = await response.json();
            expect(responseBody).toEqual(
                expect.objectContaining({
                    count: expect.any(Number),
                    avgTemp: expect.any(Number),
                }),
            );
        });
    });

    test.describe("Privileged Pages", () => {
        test("Non-logged in user cannot access admin page", async ({ page }) => {
            await page.goto(url + "admin", { waitUntil: "domcontentloaded" });
            await expect(page).toHaveURL(url + "admin/login/?next=/admin/");
        });

        test("Researcher cannot access admin page", async ({ page }) => {
            await loginResearcher(page);
            await page.goto(url + "admin", { waitUntil: "domcontentloaded" });
            await expect(page).toHaveURL(url + "admin/login/?next=/admin/");
        });

        test("Admin can access admin page", async ({ page }) => {
            await loginAdmin(page);
            await page.goto(url + "admin", { waitUntil: "domcontentloaded" });
            await expect(page).toHaveURL(url + "admin/");
        });

        test("Non-logged in user cannot access export page", async ({ page }) => {
            await page.goto(url + "export", { waitUntil: "domcontentloaded" });
            await expect(page).toHaveURL(url + "unauthorized");
        });
        test("Researcher can access export page", async ({ page }) => {
            await loginResearcher(page);
            await page.goto(url + "export", { waitUntil: "domcontentloaded" });
            await expect(page).toHaveURL(url + "export");
        });
        test("Admin can access export page", async ({ page }) => {
            await loginAdmin(page);
            await page.goto(url + "export", { waitUntil: "domcontentloaded" });
            await expect(page).toHaveURL(url + "export");
        });

        test("Non-logged in user cannot access export map page", async ({ page }) => {
            await page.goto(url + "export/map", { waitUntil: "domcontentloaded" });
            await expect(page).toHaveURL(url + "unauthorized");
        });

        test("Researcher can access export map page", async ({ page }) => {
            await loginResearcher(page);
            await page.goto(url + "export/map", { waitUntil: "domcontentloaded" });
            await expect(page).toHaveURL(url + "export/map");
        });

        test("Admin can access export map page", async ({ page }) => {
            await loginAdmin(page);
            await page.goto(url + "export/map", { waitUntil: "domcontentloaded" });
            await expect(page).toHaveURL(url + "export/map");
        });

        test("Researchers logs out and cannot access export page", async ({ page }) => {
            await loginResearcher(page);
            await logout(page);
            await page.goto(url + "export", { waitUntil: "domcontentloaded" });
            await expect(page).toHaveURL(url + "unauthorized");
        });
        test("Researchers logs out and cannot access export map page", async ({ page }) => {
            await loginResearcher(page);
            await logout(page);
            await page.goto(url + "export/map", { waitUntil: "domcontentloaded" });
            await expect(page).toHaveURL(url + "unauthorized");
        });
        test("Admin logs out and cannot access admin page", async ({ page }) => {
            await loginAdmin(page);
            await logout(page);
            await page.goto(url + "admin", { waitUntil: "domcontentloaded" });
            await expect(page).toHaveURL(url + "admin/login/?next=/admin/");
        });
        test("Admin logs out and cannot access export page", async ({ page }) => {
            await loginAdmin(page);
            await logout(page);
            await page.goto(url + "export", { waitUntil: "domcontentloaded" });
            await expect(page).toHaveURL(url + "unauthorized");
        });
        test("Admin logs out and cannot access export map page", async ({ page }) => {
            await loginAdmin(page);
            await logout(page);
            await page.goto(url + "export/map", { waitUntil: "domcontentloaded" });
            await expect(page).toHaveURL(url + "unauthorized");
        });
    });
});
