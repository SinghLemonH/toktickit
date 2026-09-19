import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const SCREENSHOTS_DIR = path.resolve(process.cwd(), "docs/lab-03/screenshots");
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

test.describe.serial("Administrator User Management & Safety Guards (E2E-04)", () => {
  test("E2E-04: User table, provision user, self-deactivation guard, and password reset", async ({ page }) => {
    // 1. Login as Administrator
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@toktickit.com");
    await page.fill('input[type="password"]', "Admin123!");
    await page.click('button[type="submit"]');

    // 2. Navigate to User Management
    await page.click("a:has-text('User Management'), a:has-text('Users')");
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.locator("h2, h1")).toContainText(/User Management/i);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "04-admin-users-table.png") });

    // 3. Search and Role filter
    const searchInput = page.locator('input[placeholder*="Search users"]');
    await searchInput.fill("Jennifer");
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "04-admin-search-users.png") });
    await searchInput.clear();
    await page.waitForTimeout(500);

    // 4. Create New User with Generated Safe Password
    await page.click("button:has-text('+ Create User')");
    await expect(page.locator(".modal")).toBeVisible();
    await page.fill("#create-name", "E2E Test Specialist");
    const uniqueEmail = `e2e.specialist.${Date.now()}@toktickit.com`;
    await page.fill("#create-email", uniqueEmail);
    await page.locator("#create-role").selectOption("IT_STAFF");
    await page.click("button:has-text('Generate Safe Password')");
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "04-admin-create-user-modal.png") });
    await page.click("button:has-text('Save User')");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "04-admin-user-created-success.png") });

    // 5. Verify Self-Deactivation Guard (BR-16) on John Smith
    await page.click("button[aria-label='Edit John Smith']");
    await expect(page.locator(".modal")).toBeVisible();
    await expect(page.locator("text=You cannot deactivate your own account")).toBeVisible();
    const activeToggle = page.locator("#edit-active");
    await expect(activeToggle).toBeDisabled();
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "04-admin-self-deactivation-guard.png") });
    await page.locator(".modal .btn-close").click();

    // 6. Reset Password Dialog on the newly created user
    await searchInput.fill("Specialist");
    await page.waitForTimeout(600);
    await page.click("button[aria-label='Edit E2E Test Specialist']");
    await page.click("button:has-text('Reset Initial Password')");
    await expect(page.locator("#reset-pass-title")).toBeVisible();
    await page.fill("#reset-pass-input", "ResetTempPass123!");
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "04-admin-reset-password-modal.png") });
    await page.click("button:has-text('Set Password')");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "04-admin-password-reset-success.png") });
  });
});
