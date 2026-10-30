import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const SCREENSHOTS = path.resolve(process.cwd(), "artifacts/lab-04/screenshots/ticket-workflow");
fs.mkdirSync(SCREENSHOTS, { recursive: true });

async function signIn(page: import("@playwright/test").Page, email: string, password = "Password123!") {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.locator("#password").fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("Lab 4 Actions Taken workflow", () => {
  test("staff can record completed work and requesters see it read-only", async ({ page }) => {
    const description = `E2E completed diagnostic ${Date.now()}`;
    await signIn(page, "michael.brown@example.com");
    await page.goto("/staff/tickets/1");
    await expect(page.getByText("Actions Taken", { exact: true })).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOTS, "resolution-gate-not-met-1280.png"), fullPage: false });

    await page.getByRole("button", { name: /add action/i }).click();
    await expect(page.getByTestId("add-action-form")).toBeVisible();
    await page.getByTestId("save-action-button").click();
    await expect(page.locator("#action-description-input")).toHaveAttribute("aria-describedby", "action-desc-error");
    await expect(page.locator("#action-description-input")).toHaveClass(/is-invalid/);
    await page.locator("#action-status-select").selectOption("COMPLETED");
    await page.locator("#action-description-input").fill(description);
    await page.locator("#action-result-input").fill("Diagnostic completed and results verified.");
    await page.getByTestId("save-action-button").click();
    const actionRow = page.getByRole("row").filter({ hasText: description });
    await expect(actionRow).toContainText("Completed");
    await expect(actionRow).toContainText("Completed by: Michael Brown");

    await page.goto("/login");
    await signIn(page, "jennifer.anderson@example.com");
    await page.goto("/tickets/1");
    await expect(page.getByText("Work Performed by IT")).toBeVisible();
    await expect(page.getByText(description)).toBeVisible();
    await expect(page.getByRole("button", { name: /add action/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /complete/i })).toHaveCount(0);
  });

  test("the resolution gate prevents resolving while planned work remains", async ({ page }) => {
    await signIn(page, "michael.brown@example.com");
    await page.goto("/staff/tickets/1");
    await expect(page.getByText("Actions Taken", { exact: true })).toBeVisible();
    await page.getByLabel("Ticket Status").selectOption("RESOLVED");
    await expect(page.getByText(/planned action/i).first()).toBeVisible();
    await page.getByRole("button", { name: "Change Status" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirm Change" })).toBeDisabled();
  });
});
