import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { signSessionToken } from "../../src/auth/session.js";

describe("Staff Dashboard API Integration Tests (Sprint 4: Issue #49)", () => {
  const prisma = getPrisma();

  let staffSarahCookie: string;
  let adminAlexCookie: string;
  let requesterJenniferCookie: string;
  let pendingPasswordCookie: string;

  let sarahId: number;
  let alexId: number;
  let jenniferId: number;

  beforeAll(async () => {
    const sarah = await prisma.user.findUniqueOrThrow({
      where: { email: "sarah.johnson@example.com" },
    });
    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: "admin@toktickit.com" },
    });
    const jennifer = await prisma.user.findUniqueOrThrow({
      where: { email: "jennifer.anderson@example.com" },
    });

    sarahId = sarah.id;
    alexId = admin.id;
    jenniferId = jennifer.id;

    staffSarahCookie = `toktickit_session=${signSessionToken({
      userId: sarah.id,
      role: sarah.role,
      mustChangePassword: false,
    })}`;

    adminAlexCookie = `toktickit_session=${signSessionToken({
      userId: admin.id,
      role: admin.role,
      mustChangePassword: false,
    })}`;

    requesterJenniferCookie = `toktickit_session=${signSessionToken({
      userId: jennifer.id,
      role: jennifer.role,
      mustChangePassword: false,
    })}`;

    pendingPasswordCookie = `toktickit_session=${signSessionToken({
      userId: sarah.id,
      role: sarah.role,
      mustChangePassword: true,
    })}`;
  });

  // DASH-04: Staff operational calculations (6 cards)
  it("DASH-04: verifies 6 operational metric cards match database counts (AC-13, FR-13, BR-21)", async () => {
    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", staffSarahCookie);

    expect(res.status).toBe(200);
    const { metrics, links, recentTickets } = res.body;

    const activeStatuses = [
      "NEW",
      "OPEN",
      "IN_PROGRESS",
      "WAITING_FOR_REQUESTER",
      "REOPENED",
      "PENDING",
    ] as const;

    const expectedNew = await prisma.ticket.count({ where: { currentStatus: "NEW" } });
    const expectedOpen = await prisma.ticket.count({ where: { currentStatus: "OPEN" } });
    const expectedInProgress = await prisma.ticket.count({ where: { currentStatus: "IN_PROGRESS" } });
    const expectedWaiting = await prisma.ticket.count({ where: { currentStatus: "WAITING_FOR_REQUESTER" } });
    const expectedMyAssigned = await prisma.ticket.count({
      where: { assignedToId: sarahId, currentStatus: { in: [...activeStatuses] } },
    });
    const expectedUnassigned = await prisma.ticket.count({
      where: { assignedToId: null, currentStatus: { in: [...activeStatuses] } },
    });

    expect(metrics.newTickets).toBe(expectedNew);
    expect(metrics.openTickets).toBe(expectedOpen);
    expect(metrics.inProgress).toBe(expectedInProgress);
    expect(metrics.waitingForRequester).toBe(expectedWaiting);
    expect(metrics.myAssigned).toBe(expectedMyAssigned);
    expect(metrics.unassigned).toBe(expectedUnassigned);

    expect(links.newTickets).toBe("/staff/queue?status=NEW");
    expect(links.openTickets).toBe("/staff/queue?status=OPEN");
    expect(links.inProgress).toBe("/staff/queue?status=IN_PROGRESS");
    expect(links.waitingForRequester).toBe("/staff/queue?status=WAITING_FOR_REQUESTER");
    expect(links.myAssigned).toBe("/staff/queue?assignedTo=me&statusGroup=active");
    expect(links.unassigned).toBe("/staff/queue?assignedTo=unassigned&statusGroup=active");

    if (recentTickets.length > 0) {
      const firstRecent = recentTickets[0];
      expect(firstRecent).toHaveProperty("id");
      expect(firstRecent).toHaveProperty("ticketNumber");
      expect(firstRecent).toHaveProperty("title");
      expect(firstRecent).toHaveProperty("currentStatus");
      expect(firstRecent).toHaveProperty("updatedAt");
    }
  });

  // DASH-05: Drill-down parity check with statusGroup=active and itPriority=none
  it("DASH-05: verifies drill-down query parameter parity and status/priority intersection (AC-13, FR-15, FR-16)", async () => {
    const dashRes = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", staffSarahCookie);

    expect(dashRes.status).toBe(200);
    const { metrics, links } = dashRes.body;

    // 1. Verify all 6 links match GET /api/staff/tickets totals
    const qNew = await request(app)
      .get(links.newTickets.replace("/staff/queue", "/api/staff/tickets"))
      .set("Cookie", staffSarahCookie);
    expect(qNew.status).toBe(200);
    expect(qNew.body.total).toBe(metrics.newTickets);

    const qOpen = await request(app)
      .get(links.openTickets.replace("/staff/queue", "/api/staff/tickets"))
      .set("Cookie", staffSarahCookie);
    expect(qOpen.status).toBe(200);
    expect(qOpen.body.total).toBe(metrics.openTickets);

    const qInProgress = await request(app)
      .get(links.inProgress.replace("/staff/queue", "/api/staff/tickets"))
      .set("Cookie", staffSarahCookie);
    expect(qInProgress.status).toBe(200);
    expect(qInProgress.body.total).toBe(metrics.inProgress);

    const qWaiting = await request(app)
      .get(links.waitingForRequester.replace("/staff/queue", "/api/staff/tickets"))
      .set("Cookie", staffSarahCookie);
    expect(qWaiting.status).toBe(200);
    expect(qWaiting.body.total).toBe(metrics.waitingForRequester);

    const qMyAssigned = await request(app)
      .get(links.myAssigned.replace("/staff/queue", "/api/staff/tickets"))
      .set("Cookie", staffSarahCookie);
    expect(qMyAssigned.status).toBe(200);
    expect(qMyAssigned.body.total).toBe(metrics.myAssigned);

    const qUnassigned = await request(app)
      .get(links.unassigned.replace("/staff/queue", "/api/staff/tickets"))
      .set("Cookie", staffSarahCookie);
    expect(qUnassigned.status).toBe(200);
    expect(qUnassigned.body.total).toBe(metrics.unassigned);

    // 2. Status intersection checks
    // Intersecting active status: status=NEW&statusGroup=active
    const qIntersectActive = await request(app)
      .get("/api/staff/tickets?status=NEW&statusGroup=active")
      .set("Cookie", staffSarahCookie);
    expect(qIntersectActive.status).toBe(200);
    expect(qIntersectActive.body.total).toBe(metrics.newTickets);

    // Non-active status with statusGroup=active: status=RESOLVED&statusGroup=active -> 0 rows
    const qIntersectNonActive = await request(app)
      .get("/api/staff/tickets?status=RESOLVED&statusGroup=active")
      .set("Cookie", staffSarahCookie);
    expect(qIntersectNonActive.status).toBe(200);
    expect(qIntersectNonActive.body.total).toBe(0);

    // 3. Priority filter check: itPriority=none
    const qNoPriority = await request(app)
      .get("/api/staff/tickets?itPriority=none")
      .set("Cookie", staffSarahCookie);
    expect(qNoPriority.status).toBe(200);
    const expectedNoPriority = await prisma.ticket.count({ where: { itPriority: null } });
    expect(qNoPriority.body.total).toBe(expectedNoPriority);
  });

  // DASH-06: Administrator extra user account metrics
  it("DASH-06: includes userCounts for Administrator and omits for IT Staff (FR-14)", async () => {
    // IT Staff call
    const staffRes = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", staffSarahCookie);
    expect(staffRes.status).toBe(200);
    expect(staffRes.body.userCounts).toBeUndefined();

    // Administrator call
    const adminRes = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", adminAlexCookie);
    expect(adminRes.status).toBe(200);
    expect(adminRes.body).toHaveProperty("userCounts");

    const expectedTotal = await prisma.user.count();
    const expectedActive = await prisma.user.count({ where: { isActive: true } });
    const expectedInactive = await prisma.user.count({ where: { isActive: false } });

    expect(adminRes.body.userCounts).toEqual({
      totalUsers: expectedTotal,
      activeUsers: expectedActive,
      inactiveUsers: expectedInactive,
    });
  });

  // DASH-SEC: Dashboard role authorization guards
  it("DASH-SEC: enforces strict role authorization guards on dashboard endpoints (BR-22)", async () => {
    // 1. Requester accessing staff dashboard -> 403 Forbidden
    const resRequesterOnStaff = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", requesterJenniferCookie);
    expect(resRequesterOnStaff.status).toBe(403);
    expect(resRequesterOnStaff.body.error.code).toBe("FORBIDDEN");

    // 2. Staff accessing requester dashboard -> 403 Forbidden
    const resStaffOnRequester = await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", staffSarahCookie);
    expect(resStaffOnRequester.status).toBe(403);
    expect(resStaffOnRequester.body.error.code).toBe("FORBIDDEN");

    // 3. Administrator accessing requester dashboard -> 403 Forbidden
    const resAdminOnRequester = await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", adminAlexCookie);
    expect(resAdminOnRequester.status).toBe(403);
    expect(resAdminOnRequester.body.error.code).toBe("FORBIDDEN");

    // 4. Unauthenticated caller -> 401 Unauthorized
    const resUnauthStaff = await request(app).get("/api/dashboard/staff");
    expect(resUnauthStaff.status).toBe(401);
    expect(resUnauthStaff.body.error.code).toBe("UNAUTHORIZED");

    const resUnauthRequester = await request(app).get("/api/dashboard/requester");
    expect(resUnauthRequester.status).toBe(401);
    expect(resUnauthRequester.body.error.code).toBe("UNAUTHORIZED");

    // 5. User with pending initial password change -> 403 Forbidden
    const validBcryptHash = "$2b$10$DuNLpS.JeLH2u73kWcxwY.E5JIyngJ40VSFrtVci5hmWACgY6wkPK";
    const pendingStaff = await prisma.user.create({
      data: {
        email: `pending.staff.${Date.now()}@example.com`,
        passwordHash: validBcryptHash,
        name: "Pending Staff",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: true,
      },
    });

    try {
      const pendingCookie = `toktickit_session=${signSessionToken({
        userId: pendingStaff.id,
        role: pendingStaff.role,
        mustChangePassword: true,
      })}`;

      const resPendingPassword = await request(app)
        .get("/api/dashboard/staff")
        .set("Cookie", pendingCookie);
      expect(resPendingPassword.status).toBe(403);
      expect(resPendingPassword.body.error.code).toBe("PASSWORD_CHANGE_REQUIRED");
    } finally {
      await prisma.user.delete({ where: { id: pendingStaff.id } });
    }
  });
});
