import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const SCREENSHOTS = path.resolve(process.cwd(), "artifacts/lab-04/screenshots/ticket-workflow");
fs.mkdirSync(SCREENSHOTS, { recursive: true });

async function signIn(page: Page, email: string, password = "Password123!") {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.locator("#password").fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test("a complete action satisfies the resolution gate and the requester can reopen the ticket", async ({ page }) => {
  const summary = `E2E lifecycle ${Date.now()}`;

  await signIn(page, "jennifer.anderson@example.com");
  await page.goto("/tickets/create");
  await page.locator("#category").selectOption({ label: "Hardware" });
  await page.locator("#relatedSystem").selectOption({ label: "Corporate Laptop" });
  await page.locator("#priority").selectOption("MEDIUM");
  await page.locator("#summary").fill(summary);
  await page.locator("#description").fill("Validate the final ticket resolution workflow from creation through requester reopen.");
  await page.locator('button[type="submit"]').click();
  await expect(page.locator(".display-6")).toBeVisible();
  const ticketNumber = (await page.locator(".display-6").textContent())?.trim();
  expect(ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
  await page.getByRole("button", { name: /my tickets/i }).click();
  await expect(page).toHaveURL(/\/tickets/);
  const ticketLink = page.getByRole("link", { name: ticketNumber! }).first();
  await expect(ticketLink).toBeVisible();
  const ticketId = (await ticketLink.getAttribute("href"))?.split("/").pop();
  expect(ticketId).toBeTruthy();

  await signIn(page, "michael.brown@example.com");
  await page.goto(`/staff/tickets/${ticketId}`);
  await page.getByLabel("Reassign Staff").selectOption({ label: "Michael Brown (Staff)" });
  await page.getByRole("button", { name: "Reassign" }).click();
  await expect(page.getByText("Ticket reassigned successfully.")).toBeVisible();

  await page.locator("#ticket-status-select").selectOption("IN_PROGRESS");
  await expect(page.locator("#ticket-status-select")).toHaveValue("IN_PROGRESS");
  await page.getByRole("button", { name: "Change Status" }).click();
  await page.getByRole("button", { name: "Confirm Change" }).click();
  await expect(page.getByText("Ticket status updated to IN PROGRESS.")).toBeVisible();

  await page.getByRole("button", { name: /add action/i }).click();
  await page.locator("#action-status-select").selectOption("COMPLETED");
  await page.locator("#action-description-input").fill("Completed the requested diagnostic check.");
  await page.locator("#action-result-input").fill("Hardware passed the diagnostic check.");
  await page.getByTestId("save-action-button").click();
  await expect(page.getByText("Completed the requested diagnostic check.")).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await page.locator("#ticket-status-select").selectOption("RESOLVED");
  await expect(page.locator("#ticket-status-select")).toHaveValue("RESOLVED");
  const changeStatusButton = page.getByRole("button", { name: "Change Status" });
  await expect(changeStatusButton).toBeEnabled();
  await page.screenshot({ path: path.join(SCREENSHOTS, "resolution-gate-satisfied-1280.png"), fullPage: false });
  await changeStatusButton.click();
  await expect(page.getByRole("button", { name: "Confirm Change" })).toBeEnabled();
  await page.getByRole("button", { name: "Confirm Change" }).click();
  await expect(page.getByText("Ticket status updated to RESOLVED.")).toBeVisible();
  await expect(page.getByText("Status History")).toBeVisible();

  await signIn(page, "jennifer.anderson@example.com");
  await page.goto(`/tickets/${ticketId}`);
  await expect(page.getByRole("button", { name: "Reopen Ticket" })).toBeVisible();
  await page.getByRole("button", { name: "Reopen Ticket" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.locator("#reopen-reason-input").fill("The issue has returned during normal use.");
  await page.getByRole("button", { name: /confirm reopen/i }).click();
  await expect(page.getByText("REOPENED", { exact: true })).toBeVisible();
  await page.screenshot({ path: path.join(SCREENSHOTS, "requester-reopened-ticket-1280.png"), fullPage: false });
});
