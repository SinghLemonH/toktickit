import type { Page } from "@playwright/test";

const timestamp = "2026-10-29T04:00:00.000Z";

export async function mockDashboardResponses(page: Page) {
  await page.route("**/api/dashboard/requester", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      metrics: { myOpenTickets: 2, waitingForRequester: 1, inProgress: 1, resolved: 2, closed: 1 },
      links: {
        myOpenTickets: "/tickets?statusGroup=active",
        waitingForRequester: "/tickets?currentStatus=WAITING_FOR_REQUESTER",
        inProgress: "/tickets?currentStatus=IN_PROGRESS",
        resolved: "/tickets?currentStatus=RESOLVED",
        closed: "/tickets?currentStatus=CLOSED",
      },
      attentionTickets: [
        { id: 3, ticketNumber: "TKT-2026-000003", title: "Grade export requires requester confirmation", currentStatus: "WAITING_FOR_REQUESTER", updatedAt: timestamp },
      ],
      recentTickets: [
        { id: 1, ticketNumber: "TKT-2026-000001", title: "Laptop battery drains unusually fast", currentStatus: "IN_PROGRESS", updatedAt: timestamp },
        { id: 3, ticketNumber: "TKT-2026-000003", title: "Grade export requires requester confirmation", currentStatus: "WAITING_FOR_REQUESTER", updatedAt: timestamp },
      ],
      timeZone: "Asia/Bangkok",
      generatedAt: timestamp,
    }),
  }));

  await page.route("**/api/dashboard/staff", async (route) => {
    const isAdmin = await page.locator(".navbar").getByText("Admin", { exact: true }).count();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        metrics: { newTickets: 2, openTickets: 3, inProgress: 1, waitingForRequester: 1, myAssigned: 2, unassigned: 1 },
        links: {
          newTickets: "/staff/queue?currentStatus=NEW",
          openTickets: "/staff/queue?currentStatus=OPEN",
          inProgress: "/staff/queue?currentStatus=IN_PROGRESS",
          waitingForRequester: "/staff/queue?currentStatus=WAITING_FOR_REQUESTER",
          myAssigned: "/staff/queue?ownership=mine&statusGroup=active",
          unassigned: "/staff/queue?ownership=unassigned&statusGroup=active",
        },
        recentTickets: [
          { id: 1, ticketNumber: "TKT-2026-000001", title: "Laptop battery drains unusually fast", currentStatus: "IN_PROGRESS", updatedAt: timestamp },
          { id: 2, ticketNumber: "TKT-2026-000002", title: "Cannot connect to Tokyo branch VPN", currentStatus: "OPEN", updatedAt: timestamp },
        ],
        ...(isAdmin ? { userCounts: { totalUsers: 14, activeUsers: 13, inactiveUsers: 1 } } : {}),
        timeZone: "Asia/Bangkok",
        generatedAt: timestamp,
      }),
    });
  });
}
