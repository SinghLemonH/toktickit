import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const SCREENSHOTS_DIR = path.resolve(process.cwd(), "docs/lab-03/screenshots");
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

test.describe.serial("IT Staff Ticket Queue & Operational Details (E2E-03)", () => {
  test("E2E-03: Queue search, claim ticket, update priority/status, confidential notes & public comments", async ({ page }) => {
    // 1. Login as IT Staff
    await page.goto("/login");
    await page.fill('input[type="email"]', "michael.brown@example.com");
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');

    // 2. Arrive at Staff Ticket Queue
    await expect(page).toHaveURL(/\/(staff\/queue|queue)/);
    await expect(page.locator(".navbar")).toContainText("Michael Brown");
    await expect(page.locator(".navbar")).toContainText("IT Staff");
    // Verify non-admins do NOT see User Management
    await expect(page.locator(".navbar")).not.toContainText("User Management");
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "03-staff-queue-page.png") });

    // 3. Search and filtering
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill("battery");
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "03-staff-queue-search-filter.png") });
    await searchInput.clear();
    await page.waitForTimeout(600);

    // 4. Open first ticket details
    const openBtn = page.locator("a:has-text('Open'), button:has-text('Open')").first();
    await openBtn.click();
    await expect(page).toHaveURL(/\/staff\/tickets\/\d+/);
    await expect(page.locator("text=Operational Controls")).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "03-staff-ticket-detail-initial.png") });

    // 5. Claim Ticket
    const claimBtn = page.locator("button:has-text('Claim Ticket')");
    if (await claimBtn.isVisible()) {
      await claimBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator("text=Ticket Ownership")).toBeVisible();
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "03-staff-ticket-claimed.png") });
    }

    // 6. Update IT Priority
    const prioritySelect = page.locator('select[aria-label="IT Priority"]');
    await prioritySelect.selectOption("HIGH");
    await page.click("button:has-text('Update')");
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "03-staff-priority-updated.png") });

    // 7. Change Status with confirmation modal
    const statusSelect = page.locator('select[aria-label="Ticket Status"], #ticket-status-select');
    const options = await statusSelect.locator("option").allInnerTexts();
    if (options.length > 1) {
      await statusSelect.selectOption({ index: 1 });
      await page.click("button:has-text('Change Status')");
      await expect(page.locator(".modal")).toBeVisible();
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "03-status-change-modal.png") });
      await page.click(".modal button:has-text('Confirm Change'), .modal button:has-text('Confirm')");
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "03-status-changed-success.png") });
    }

    // 8. Confidential Internal Notes
    await page.click("button[role='tab']:has-text('Internal Notes')");
    await expect(page.locator("text=Internal Notes are private and never visible to Requesters")).toBeVisible();
    const noteTextarea = page.locator("textarea[placeholder*='confidential']");
    await noteTextarea.fill("Verified hardware logs. Battery cell degradation confirmed; replacement part requested.");
    await page.click("button:has-text('Add Internal Note'), button:has-text('Saving')");
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "03-internal-note-added.png") });

    // 9. Public Comments
    await page.click("button[role='tab']:has-text('Public Comments')");
    const commentTextarea = page.locator("textarea[placeholder*='public comment']");
    await commentTextarea.fill("Hello! We have diagnosed the battery issue and placed an order for replacement parts.");
    await page.click("button:has-text('Post Comment')");
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "03-public-comment-posted.png") });
  });
});
