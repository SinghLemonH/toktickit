import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { signSessionToken } from "../../src/auth/session.js";

describe("Requester Dashboard API Integration Tests (Sprint 4: Issue #49)", () => {
  const prisma = getPrisma();

  let requesterJenniferCookie: string;
  let requesterDavidCookie: string;
  let jenniferId: number;
  let davidId: number;
  let categoryId: number;
  let relatedSystemId: number;

  beforeAll(async () => {
    // 1. Fetch seeded requesters
    const jennifer = await prisma.user.findUniqueOrThrow({
      where: { email: "jennifer.anderson@example.com" },
    });
    const david = await prisma.user.findUniqueOrThrow({
      where: { email: "david.lee@example.com" },
    });

    jenniferId = jennifer.id;
    davidId = david.id;

    await prisma.user.update({
      where: { id: david.id },
      data: { mustChangePassword: false },
    });

    requesterJenniferCookie = `toktickit_session=${signSessionToken({
      userId: jennifer.id,
      role: jennifer.role,
      mustChangePassword: false,
    })}`;

    requesterDavidCookie = `toktickit_session=${signSessionToken({
      userId: david.id,
      role: david.role,
      mustChangePassword: false,
    })}`;

    const cat = await prisma.category.findFirstOrThrow({ where: { isActive: true } });
    const sys = await prisma.relatedSystem.findFirstOrThrow({ where: { isActive: true } });
    categoryId = cat.id;
    relatedSystemId = sys.id;
  });

  // DASH-01: Requester dashboard metrics isolation
  it("DASH-01: scopes metrics and ticket lists strictly to caller owned tickets (AC-02, BR-22)", async () => {
    const res = await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", requesterJenniferCookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("metrics");
    expect(res.body).toHaveProperty("links");
    expect(res.body).toHaveProperty("attentionTickets");
    expect(res.body).toHaveProperty("recentTickets");
    expect(res.body.timeZone).toBe("Asia/Bangkok");
    expect(res.body).toHaveProperty("generatedAt");

    // Verify all attention and recent tickets belong to Jennifer
    const attentionIds: number[] = res.body.attentionTickets.map((t: any) => t.id);
    const recentIds: number[] = res.body.recentTickets.map((t: any) => t.id);
    const allReturnedIds = [...attentionIds, ...recentIds];

    if (allReturnedIds.length > 0) {
      const ticketsInDb = await prisma.ticket.findMany({
        where: { id: { in: allReturnedIds } },
        select: { id: true, requesterId: true },
      });

      for (const t of ticketsInDb) {
        expect(t.requesterId).toBe(jenniferId);
        expect(t.requesterId).not.toBe(davidId);
      }
    }
  });

  // DASH-02: Requester metric calculation accuracy & drill-down parity
  it("DASH-02: verifies metric counts match independent database queries and drill-down links (FR-12, BR-19, BR-20)", async () => {
    const res = await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", requesterJenniferCookie);

    expect(res.status).toBe(200);
    const { metrics, links, attentionTickets, recentTickets } = res.body;

    const activeStatuses = [
      "NEW",
      "OPEN",
      "IN_PROGRESS",
      "WAITING_FOR_REQUESTER",
      "REOPENED",
      "PENDING",
    ] as const;

    // Independent database counts
    const expectedOpen = await prisma.ticket.count({
      where: { requesterId: jenniferId, currentStatus: { in: [...activeStatuses] } },
    });
    const expectedWaiting = await prisma.ticket.count({
      where: { requesterId: jenniferId, currentStatus: "WAITING_FOR_REQUESTER" },
    });
    const expectedInProgress = await prisma.ticket.count({
      where: { requesterId: jenniferId, currentStatus: "IN_PROGRESS" },
    });
    const expectedResolved = await prisma.ticket.count({
      where: { requesterId: jenniferId, currentStatus: "RESOLVED" },
    });
    const expectedClosed = await prisma.ticket.count({
      where: { requesterId: jenniferId, currentStatus: "CLOSED" },
    });

    expect(metrics.myOpenTickets).toBe(expectedOpen);
    expect(metrics.waitingForRequester).toBe(expectedWaiting);
    expect(metrics.inProgress).toBe(expectedInProgress);
    expect(metrics.resolved).toBe(expectedResolved);
    expect(metrics.closed).toBe(expectedClosed);

    // Verify drill-down parity with GET /api/tickets for all 5 cards
    const toApiUrl = (link: string) => link.replace("/tickets", "/api/tickets");

    const qOpen = await request(app)
      .get(toApiUrl(links.myOpenTickets))
      .set("Cookie", requesterJenniferCookie);
    expect(qOpen.status).toBe(200);
    expect(qOpen.body.totalItems).toBe(metrics.myOpenTickets);

    const qWaiting = await request(app)
      .get(toApiUrl(links.waitingForRequester))
      .set("Cookie", requesterJenniferCookie);
    expect(qWaiting.status).toBe(200);
    expect(qWaiting.body.totalItems).toBe(metrics.waitingForRequester);

    const qInProgress = await request(app)
      .get(toApiUrl(links.inProgress))
      .set("Cookie", requesterJenniferCookie);
    expect(qInProgress.status).toBe(200);
    expect(qInProgress.body.totalItems).toBe(metrics.inProgress);

    const qResolved = await request(app)
      .get(toApiUrl(links.resolved))
      .set("Cookie", requesterJenniferCookie);
    expect(qResolved.status).toBe(200);
    expect(qResolved.body.totalItems).toBe(metrics.resolved);

    const qClosed = await request(app)
      .get(toApiUrl(links.closed))
      .set("Cookie", requesterJenniferCookie);
    expect(qClosed.status).toBe(200);
    expect(qClosed.body.totalItems).toBe(metrics.closed);

    // Verify recentTickets and attentionTickets structure and title mapping (from summary)
    if (attentionTickets.length > 0) {
      const firstAtt = attentionTickets[0];
      expect(firstAtt).toHaveProperty("id");
      expect(firstAtt).toHaveProperty("ticketNumber");
      expect(firstAtt).toHaveProperty("title");
      expect(firstAtt.currentStatus).toBe("WAITING_FOR_REQUESTER");
      expect(firstAtt).toHaveProperty("updatedAt");
    }

    if (recentTickets.length > 0) {
      const firstRecent = recentTickets[0];
      expect(firstRecent).toHaveProperty("id");
      expect(firstRecent).toHaveProperty("ticketNumber");
      expect(firstRecent).toHaveProperty("title");
      expect(firstRecent).toHaveProperty("currentStatus");
      expect(firstRecent).toHaveProperty("updatedAt");
    }
  });

  // DASH-03: Zero-state dashboard handling
  it("DASH-03: returns HTTP 200 with 0 counts and empty arrays for user with zero tickets (AC-14, BR-23)", async () => {
    const validBcryptHash = "$2b$10$DuNLpS.JeLH2u73kWcxwY.E5JIyngJ40VSFrtVci5hmWACgY6wkPK";
    // Create an isolated requester with zero tickets
    const zeroRequester = await prisma.user.create({
      data: {
        email: `zero.requester.${Date.now()}@example.com`,
        passwordHash: validBcryptHash,
        name: "Zero Tickets Requester",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
      },
    });

    try {
      const zeroCookie = `toktickit_session=${signSessionToken({
        userId: zeroRequester.id,
        role: zeroRequester.role,
        mustChangePassword: false,
      })}`;

      const res = await request(app)
        .get("/api/dashboard/requester")
        .set("Cookie", zeroCookie);

      expect(res.status).toBe(200);
      expect(res.body.metrics).toEqual({
        myOpenTickets: 0,
        waitingForRequester: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
      });
      expect(res.body.attentionTickets).toEqual([]);
      expect(res.body.recentTickets).toEqual([]);
      expect(res.body.timeZone).toBe("Asia/Bangkok");
      expect(res.body.links).toBeDefined();
    } finally {
      await prisma.user.delete({ where: { id: zeroRequester.id } });
    }
  });
});
