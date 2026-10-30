import { test, expect, type Page } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import { mockDashboardResponses } from "./dashboard-fixtures.js";

const SCREENSHOTS = path.resolve(process.cwd(), "artifacts/lab-04/screenshots");
fs.mkdirSync(SCREENSHOTS, { recursive: true });
const viewports = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 375, height: 812 },
];

async function signIn(page: Page, email: string, password = "Password123!") {
  await mockDashboardResponses(page);
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByLabel(/email/i).fill(email);
  await page.locator("#password").fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function verifyViewport(page: Page, label: string, width: number, height: number, screenshot: string, fullPage = true) {
  await page.setViewportSize({ width, height });
  await page.waitForLoadState("networkidle");
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth,
  }));
  expect(dimensions.page, `${label} has horizontal overflow at ${width}px`).toBeLessThanOrEqual(dimensions.viewport);
  await page.screenshot({ path: screenshot, fullPage });
}

test.describe("Lab 4 responsive and keyboard checks", () => {
  test("captures staff operational screens and requester screens at 1280, 768, and 375 pixels", async ({ page }) => {
    test.setTimeout(180_000);
    await signIn(page, "michael.brown@example.com");
    for (const viewport of viewports) {
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await verifyViewport(page, "Staff dashboard", viewport.width, viewport.height,
        path.join(SCREENSHOTS, `staff-dashboard-${viewport.width}.png`));

      await page.goto("/staff/queue", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading")).toContainText(/Ticket Queue/i);
      await verifyViewport(page, "Staff queue", viewport.width, viewport.height,
        path.join(SCREENSHOTS, `staff-queue-${viewport.width}.png`));

      await page.goto("/staff/tickets/1", { waitUntil: "domcontentloaded" });
      await expect(page.getByText("Actions Taken", { exact: true })).toBeVisible();
      await verifyViewport(page, "Staff ticket detail", viewport.width, viewport.height,
        path.join(SCREENSHOTS, `staff-ticket-detail-${viewport.width}.png`), false);
    }

    await signIn(page, "jennifer.anderson@example.com");
    for (const viewport of viewports) {
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await verifyViewport(page, "Requester dashboard", viewport.width, viewport.height,
        path.join(SCREENSHOTS, `requester-dashboard-${viewport.width}.png`));

      await page.goto("/tickets/1", { waitUntil: "domcontentloaded" });
      await expect(page.getByText("Work Performed by IT")).toBeVisible();
      const readOnlyField = page.locator("input[readonly]").first();
      await expect(readOnlyField).toHaveClass(/form-control-readonly/);
      const readOnlyBackground = await readOnlyField.evaluate((element) => getComputedStyle(element).backgroundColor);
      expect(readOnlyBackground).toBe("rgb(243, 245, 244)");
      const statusBadges = await page.locator(".badge").allTextContents();
      expect(statusBadges.length).toBeGreaterThan(0);
      expect(statusBadges.every((label) => label.trim().length > 0)).toBe(true);
      await verifyViewport(page, "Requester ticket detail", viewport.width, viewport.height,
        path.join(SCREENSHOTS, `requester-ticket-detail-${viewport.width}.png`), false);
    }
  }, 120_000);

  test("mobile navigation traps keyboard focus, supports Escape, and restores trigger focus", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await signIn(page, "michael.brown@example.com");
    const menuButton = page.getByRole("button", { name: "Open menu" });
    await menuButton.click();
    const navigation = page.getByRole("dialog", { name: "Navigation" });
    await expect(navigation).toBeVisible();
    const closeButton = page.getByRole("button", { name: "Close menu" });
    await expect(closeButton).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(page.getByRole("button", { name: "Log Out" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(closeButton).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(navigation).toBeHidden();
    await expect(menuButton).toBeFocused();
  });
});
