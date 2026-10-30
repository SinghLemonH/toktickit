import { test, expect, type Page } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import { mockDashboardResponses } from "./dashboard-fixtures.js";

const SCREENSHOTS = path.resolve(process.cwd(), "artifacts/lab-04/screenshots/dashboards");
fs.mkdirSync(SCREENSHOTS, { recursive: true });
const dashboardStateScreenshots = path.resolve(process.cwd(), "artifacts/lab-04/screenshots/dashboard-states");
fs.mkdirSync(dashboardStateScreenshots, { recursive: true });

const accounts = {
  requester: { email: "jennifer.anderson@example.com", password: "Password123!", heading: "Welcome back, Jennifer Anderson" },
  staff: { email: "michael.brown@example.com", password: "Password123!", heading: "Welcome back, Michael Brown" },
  administrator: { email: "admin@toktickit.com", password: "Admin123!", heading: "Welcome back, John Smith" },
};

async function signIn(page: Page, role: keyof typeof accounts) {
  const account = accounts[role];
  await mockDashboardResponses(page);
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(account.email);
  await page.locator("#password").fill(account.password);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: account.heading })).toBeVisible();
}

test.describe("Lab 4 role dashboards and responsive access", () => {
  test("each role receives its dashboard and matching navigation", async ({ page }) => {
    await signIn(page, "requester");
    await expect(page.getByText("My Open Tickets")).toBeVisible();
    await expect(page.getByRole("link", { name: "Create Ticket" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Ticket Queue" })).toHaveCount(0);
    await page.screenshot({ path: path.join(SCREENSHOTS, "requester-dashboard-1280.png"), fullPage: true });
    await page.locator('a[href="/tickets?statusGroup=active"]').click();
    await expect(page).toHaveURL(/\/tickets\?statusGroup=active/);

    await page.goto("/login");
    await signIn(page, "staff");
    await expect(page.getByText("My Assigned")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ticket Queue" })).toBeVisible();
    await expect(page.getByRole("link", { name: "User Management" })).toHaveCount(0);
    await page.screenshot({ path: path.join(SCREENSHOTS, "staff-dashboard-1280.png"), fullPage: true });
    await page.locator('a[href="/staff/queue?currentStatus=NEW"]').click();
    await expect(page).toHaveURL(/\/staff\/queue\?currentStatus=NEW/);

    await page.goto("/login");
    await signIn(page, "administrator");
    await expect(page.getByText("User Accounts")).toBeVisible();
    await expect(page.getByRole("link", { name: "User Management" })).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOTS, "administrator-dashboard-1280.png"), fullPage: true });
  });

  test("dashboard layouts have no page-level horizontal overflow at supported widths", async ({ page }) => {
    const viewports = [
      { name: "desktop", width: 1280, height: 900 },
      { name: "tablet", width: 768, height: 1024 },
      { name: "mobile", width: 375, height: 812 },
    ];

    for (const role of ["requester", "staff"] as const) {
      await signIn(page, role);
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForLoadState("networkidle");
        const dimensions = await page.evaluate(() => ({
          width: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
        }));
        expect(dimensions.scrollWidth, `${role} dashboard overflows at ${viewport.width}px`).toBeLessThanOrEqual(dimensions.width);
        await page.screenshot({
          path: path.join(SCREENSHOTS, `${role}-dashboard-${viewport.width}.png`),
          fullPage: true,
        });
      }
      await page.goto("/login");
    }
  });

  test("unauthorized role routes return to the role-appropriate dashboard", async ({ page }) => {
    await signIn(page, "requester");
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: "Access Denied" })).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOTS, "forbidden-access-1280.png"), fullPage: true });
    await page.getByRole("link", { name: "Return to Dashboard" }).click();
    await expect(page.getByRole("heading", { name: accounts.requester.heading })).toBeVisible();

    await page.goto("/login");
    await signIn(page, "staff");
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: "Access Denied" })).toBeVisible();
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ path: path.join(SCREENSHOTS, "forbidden-access-375.png"), fullPage: true });
    await page.getByRole("link", { name: "Return to Dashboard" }).click();
    await expect(page.getByRole("heading", { name: accounts.staff.heading })).toBeVisible();
  });

  test("captures dashboard loading, empty, and safe-failure states", async ({ page }) => {
    await signIn(page, "staff");
    await page.route("**/api/dashboard/staff", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          metrics: { newTickets: 0, openTickets: 0, inProgress: 0, waitingForRequester: 0, myAssigned: 0, unassigned: 0 },
          links: { newTickets: "/staff/queue", openTickets: "/staff/queue", inProgress: "/staff/queue", waitingForRequester: "/staff/queue", myAssigned: "/staff/queue", unassigned: "/staff/queue" },
          recentTickets: [],
          timeZone: "Asia/Bangkok",
          generatedAt: "2026-10-29T04:00:00.000Z",
        }),
      });
    });
    const loading = page.reload();
    await expect(page.locator(".placeholder").first()).toBeVisible();
    await page.screenshot({ path: path.join(dashboardStateScreenshots, "staff-dashboard-loading-1280.png"), fullPage: true });
    await loading;
    await expect(page.getByText("No tickets in queue.")).toBeVisible();
    await page.screenshot({ path: path.join(dashboardStateScreenshots, "staff-dashboard-empty-1280.png"), fullPage: true });

    await page.route("**/api/dashboard/staff", (route) => route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: { message: "Service unavailable" } }),
    }));
    await page.reload();
    await expect(page.getByText("Error loading dashboard")).toBeVisible();
    await expect(page.getByRole("button", { name: /retry/i })).toBeVisible();
    await page.screenshot({ path: path.join(dashboardStateScreenshots, "staff-dashboard-failure-1280.png"), fullPage: true });

    await page.goto("/login");
    await signIn(page, "requester");
    await page.route("**/api/dashboard/requester", (route) => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        metrics: { myOpenTickets: 0, waitingForRequester: 0, inProgress: 0, resolved: 0, closed: 0 },
        links: { myOpenTickets: "/tickets", waitingForRequester: "/tickets", inProgress: "/tickets", resolved: "/tickets", closed: "/tickets" },
        attentionTickets: [],
        recentTickets: [],
        timeZone: "Asia/Bangkok",
        generatedAt: "2026-10-29T04:00:00.000Z",
      }),
    }));
    await page.reload();
    await expect(page.getByText("You have no active support requests.")).toBeVisible();
    await page.screenshot({ path: path.join(dashboardStateScreenshots, "requester-dashboard-empty-1280.png"), fullPage: true });
  }, 90_000);
});
