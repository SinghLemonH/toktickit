import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const SCREENSHOTS_DIR = path.resolve(process.cwd(), "docs/lab-03/screenshots");
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

test.describe.serial("Authentication & Mandatory Password Change (E2E-01, E2E-02)", () => {
  test("E2E-01: Valid and invalid login, app shell navigation, role badges, and logout", async ({ page }) => {
    // 1. Visit Login screen
    await page.goto("/login");
    await expect(page.locator("h4, h3, h2, h1")).toContainText(/TokTickIT/i);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "01-login-screen.png") });

    // 2. Test invalid credentials
    await page.fill('input[type="email"]', "wrong@example.com");
    await page.fill('input[type="password"]', "WrongPass123!");
    await page.click('button[type="submit"]');
    await expect(page.locator(".alert-danger, .alert")).toContainText(/Invalid email or password/i);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "01-login-invalid-credentials.png") });

    // 3. Valid login as Administrator
    await page.fill('input[type="email"]', "admin@toktickit.com");
    await page.fill('input[type="password"]', "Admin123!");
    await page.click('button[type="submit"]');

    // 4. Arrive at Queue / App Shell
    await expect(page).toHaveURL(/\/(staff\/queue|queue|admin\/users)/);
    await expect(page.locator(".navbar")).toContainText("John Smith");
    await expect(page.locator(".navbar")).toContainText("Admin");
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "01-admin-app-shell.png") });

    // 5. Test Logout
    await page.click("button:has-text('Log Out'), a:has-text('Log Out')");
    await expect(page).toHaveURL(/\/login/);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "01-after-logout.png") });

    // 6. Direct access to protected route is blocked
    await page.goto("/staff/queue");
    await expect(page).toHaveURL(/\/login/);
  });

  test("E2E-02: Mandatory first-login password change quarantine and completion", async ({ page }) => {
    // 1. Login with user requiring password change (david.lee@example.com)
    await page.goto("/login");
    await page.fill('input[type="email"]', "david.lee@example.com");
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');

    // 2. Quarantined to Change Password screen
    await expect(page).toHaveURL(/\/change-password/);
    await expect(page.locator("h1, h2, h3, h4")).toContainText(/Change Your Password/i);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "02-mandatory-password-change-quarantine.png") });

    // 3. Attempting to bypass by navigating to tickets returns back to change-password
    await page.goto("/tickets");
    await expect(page).toHaveURL(/\/change-password/);

    // 4. Fill weak password: submit button remains disabled
    await page.fill("#currentPassword", "Password123!");
    await page.fill("#newPassword", "weak");
    await page.fill("#confirmPassword", "weak");
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();

    // 5. Fill compliant new password
    const newPass = "DavidNewSecurePass123!";
    await page.fill("#newPassword", newPass);
    await page.fill("#confirmPassword", newPass);
    await expect(submitBtn).toBeEnabled();
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "02-password-requirements-satisfied.png") });

    // 6. Submit new password
    await submitBtn.click();

    // 7. Successfully redirected into normal app screen
    await expect(page).toHaveURL(/\/(tickets|my-tickets)/);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "02-password-change-success.png") });
  });
});
