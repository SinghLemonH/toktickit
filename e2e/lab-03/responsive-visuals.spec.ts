import { test } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const SCREENSHOTS_DIR = path.resolve(process.cwd(), "docs/lab-03/screenshots");
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 375, height: 667 },
];

test.describe("Responsive Visual Evidence across Viewports", () => {
  for (const vp of VIEWPORTS) {
    test(`Capture responsive views on ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // 1. Login Screen
      await page.goto("/login");
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `responsive-login-${vp.name}.png`) });

      // 2. Change Password Screen (login with initial password user)
      await page.fill('input[type="email"]', "sarah.davis@example.com");
      await page.fill('input[type="password"]', "Password123!");
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
      if (page.url().includes("/change-password")) {
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `responsive-change-password-${vp.name}.png`) });
      }

      // 3. Login as Admin / IT Staff to view Queue and Detail
      await page.goto("/login");
      await page.fill('input[type="email"]', "admin@toktickit.com");
      await page.fill('input[type="password"]', "Admin123!");
      await page.click('button[type="submit"]');
      await page.waitForTimeout(600);

      // Staff Ticket Queue
      await page.goto("/staff/queue");
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `responsive-queue-${vp.name}.png`) });

      // Staff Ticket Detail
      const openBtn = page.locator("a:has-text('Open'), button:has-text('Open')").first();
      if (await openBtn.isVisible()) {
        await openBtn.click();
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `responsive-detail-${vp.name}.png`) });
      }

      // Administrator User Management
      await page.goto("/admin/users");
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `responsive-admin-${vp.name}.png`) });
    });
  }
});
