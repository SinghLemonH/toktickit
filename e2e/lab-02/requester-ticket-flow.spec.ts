import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const SCREENSHOTS_DIR = path.resolve(process.cwd(), "artifacts/lab-02/screenshots");
fs.mkdirSync(path.join(SCREENSHOTS_DIR, "create-ticket"), { recursive: true });
fs.mkdirSync(path.join(SCREENSHOTS_DIR, "my-tickets"), { recursive: true });
fs.mkdirSync(path.join(SCREENSHOTS_DIR, "ticket-detail"), { recursive: true });

// Create a dummy file for attachment tests
const DUMMY_ATTACHMENT_PATH = path.resolve(process.cwd(), "artifacts/lab-02/sample_evidence.pdf");
fs.mkdirSync(path.dirname(DUMMY_ATTACHMENT_PATH), { recursive: true });
fs.writeFileSync(DUMMY_ATTACHMENT_PATH, "%PDF-1.4 dummy pdf content for e2e testing");

test.describe.serial("Requester Ticket Flow (E2E)", () => {
  let createdTicketNumber = "";
  let createdTicketId = "";

  test("E2E-01: Select Requester A -> create ticket -> verify in My Tickets -> switch to Requester B -> verify isolation", async ({
    page,
  }) => {
    // 1. Visit selector
    await page.goto("/select-requester");
    await expect(page.locator("h1")).toContainText(/Select Requester/i);

    // 2. Select Requester A (Jennifer Anderson)
    await page.selectOption("#requester-select", { label: "Jennifer Anderson" });
    await page.click("button:has-text('Continue')");

    // 3. Arrive at My Tickets
    await expect(page).toHaveURL(/\/tickets/);
    await expect(page.locator("h1")).toContainText(/My Tickets/i);

    // 4. Navigate to Create Ticket
    await page.click("a:has-text('Create Ticket'), a:has-text('New Ticket')");
    await expect(page).toHaveURL(/\/tickets\/create/);
    await expect(page.locator("h1")).toContainText(/Create Ticket/i);

    // Screenshot initial create ticket
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "create-ticket/initial.png") });

    // 5. Trigger validation error for screenshot evidence
    await page.click("button:has-text('Submit')");
    await expect(page.locator(".invalid-feedback").first()).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "create-ticket/validation-error.png") });

    // 6. Fill valid ticket data
    await page.selectOption("#category", { label: "Hardware" });
    await page.selectOption("#relatedSystem", { label: "Corporate Laptop" });
    await page.selectOption("#priority", "HIGH");
    await page.fill("#summary", "E2E Battery Drain on High Performance");
    await page.fill(
      "#description",
      "Testing end to end ticket creation with attached PDF evidence. Battery drains rapidly under normal load."
    );

    // Attach sample file
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.locator("#attachments").click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(DUMMY_ATTACHMENT_PATH);
    await expect(page.locator("li:has-text('sample_evidence.pdf')")).toBeVisible();

    // 7. Submit form
    await page.click("button:has-text('Submit')");

    // 8. Verify confirmation screen
    const ticketNumEl = page.locator(".display-6");
    await expect(ticketNumEl).toBeVisible();
    createdTicketNumber = (await ticketNumEl.textContent())?.trim() || "";
    expect(createdTicketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "create-ticket/success.png") });

    // 9. Return to My Tickets
    await page.click("button:has-text('My Tickets')");
    await expect(page).toHaveURL(/\/tickets/);
    await expect(page.locator("table a", { hasText: createdTicketNumber })).toBeVisible();

    // Screenshot My Tickets with Requester A
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "my-tickets/requester-a.png") });

    // Save ticket URL/ID for next test
    const ticketLink = page.locator("table a", { hasText: createdTicketNumber });
    const href = await ticketLink.getAttribute("href");
    createdTicketId = href?.split("/").pop() || "";

    // 10. Switch to Requester B (Michael Brown)
    await page.click("button:has-text('Change Requester')");
    await expect(page).toHaveURL(/\/select-requester/);
    await page.selectOption("#requester-select", { label: "Michael Brown" });
    await page.click("button:has-text('Continue')");

    // 11. Confirm Requester A's ticket does NOT appear in Requester B's tickets
    await expect(page).toHaveURL(/\/tickets/);
    await expect(page.locator(`text=${createdTicketNumber}`)).toHaveCount(0);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "my-tickets/requester-b.png") });
  });

  test("E2E-02: Ticket Detail, Add Attachment, Soft Removal with Reason", async ({ page }) => {
    // 1. Select Requester A
    await page.goto("/select-requester");
    await page.selectOption("#requester-select", { label: "Jennifer Anderson" });
    await page.click("button:has-text('Continue')");

    // 2. Open the ticket detail
    await page.goto(`/tickets/${createdTicketId}`);
    await expect(page.locator("h1")).toContainText(/Ticket Details/i);

    // Verify read-only field
    const summaryInput = page.locator("input[value='E2E Battery Drain on High Performance']");
    await expect(summaryInput).toHaveAttribute("readonly", "");

    // Screenshot initial Ticket Detail
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "ticket-detail/active.png") });

    // 3. Upload an additional attachment
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.locator("#add-attachment-input").click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(DUMMY_ATTACHMENT_PATH);

    // Wait for attachment to appear
    await expect(page.locator(".list-group-item:has-text('sample_evidence.pdf')").first()).toBeVisible();

    // 4. Click Remove on the newly attached item
    const removeBtn = page.locator("button[aria-label*='Remove sample_evidence.pdf']").first();
    await removeBtn.click();

    // 5. Removal reason dialog
    const confirmBtn = page.locator("button:has-text('Confirm Remove')");
    await expect(confirmBtn).toBeDisabled();

    // Type removal reason
    await page.fill("#removal-reason", "Replaced with updated diagnostics report");
    await expect(confirmBtn).not.toBeDisabled();
    await confirmBtn.click();

    // 6. Verify soft-removed status
    await expect(page.locator(".badge:has-text('Unavailable')").first()).toBeVisible();
    await expect(page.locator("text=Replaced with updated diagnostics report")).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "ticket-detail/soft-removed.png") });
  });

  test("Cross-Requester Direct Access Protection (AC-03, AC-20)", async ({ page }) => {
    // 1. Select Requester B (Michael Brown)
    await page.goto("/select-requester");
    await page.selectOption("#requester-select", { label: "Michael Brown" });
    await page.click("button:has-text('Continue')");
    await expect(page).toHaveURL(/\/tickets/);

    // 2. Attempt direct URL access to Requester A's ticket
    await page.goto(`/tickets/${createdTicketId}`);

    // 3. Confirm 404 access denied screen
    await expect(page.locator("h1")).toContainText(/Ticket not found or access denied/i);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "ticket-detail/unauthorized.png") });
  });

  test("RESP: Capture Responsive Screenshots at 375px, 850px, 1280px", async ({ page }) => {
    // Select Requester A
    await page.goto("/select-requester");
    await page.selectOption("#requester-select", { label: "Jennifer Anderson" });
    await page.click("button:has-text('Continue')");

    const viewports = [
      { name: "desktop", width: 1280, height: 800 },
      { name: "tablet", width: 850, height: 1100 },
      { name: "mobile", width: 375, height: 667 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // My Tickets
      await page.goto("/tickets");
      await page.waitForLoadState("networkidle");
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, `my-tickets/${vp.name}.png`),
        fullPage: true,
      });

      // Create Ticket
      await page.goto("/tickets/create");
      await page.waitForLoadState("networkidle");
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, `create-ticket/${vp.name}.png`),
        fullPage: true,
      });

      // Ticket Detail
      if (createdTicketId) {
        await page.goto(`/tickets/${createdTicketId}`);
        await page.waitForLoadState("networkidle");
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, `ticket-detail/${vp.name}.png`),
          fullPage: true,
        });
      }
    }
  });
});
