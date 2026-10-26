import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const SCREENSHOTS_DIR = path.resolve(process.cwd(), "artifacts/lab-04/screenshots/actions-taken");
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

test.describe.serial("Lab 4 Actions Taken UI Screenshots", () => {
  test("Capture Actions Taken UI across desktop, tablet, mobile and requester views", async ({ page }) => {
    // 1. Login as IT Staff
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");
    await page.fill('input[type="email"]', "michael.brown@example.com");
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/(staff\/queue|queue)/);

    // 2. Open Ticket 1 details (IN_PROGRESS with completed and planned actions)
    await page.goto("/staff/tickets/1");
    await expect(page.locator("text=Operational Controls")).toBeVisible();
    await expect(page.locator("text=Actions Taken")).toBeVisible();
    await page.waitForTimeout(1000);

    // Always scroll to top before taking screenshots
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    // 01: Desktop 1280px
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "01-actions-taken-desktop-1280px.png"),
      fullPage: false,
    });

    // 02: Open Inline Add Action Form at 1280px
    const addActionBtn = page.locator('button[data-testid="add-action-button"], button:has-text("Add Action")');
    await addActionBtn.click();
    await expect(page.locator('div[data-testid="add-action-form"], h6:has-text("New Action Taken")')).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "02-actions-taken-form-open-1280px.png"),
      fullPage: false,
    });

    // 03: Tablet 768px
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "03-actions-taken-tablet-768px.png"),
      fullPage: false,
    });

    // 04: Mobile 375px
    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "04-actions-taken-mobile-375px.png"),
      fullPage: false,
    });

    // 05: Requester View on Closed Ticket (Ticket 7 owned by Jennifer Anderson)
    // Logout first
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");

    // Login as Requester Jennifer Anderson
    await page.fill('input[type="email"]', "jennifer.anderson@example.com");
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/tickets/);

    // Navigate to ticket 7
    await page.goto("/tickets/7");
    await expect(page.locator("text=Work Performed by IT")).toBeVisible();
    await expect(page.locator("button:has-text('Reopen Ticket')")).toBeVisible();
    await page.waitForTimeout(1000);

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "05-requester-actions-readonly-1280px.png"),
      fullPage: false,
    });
  });
});
