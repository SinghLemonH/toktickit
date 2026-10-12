import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { signSessionToken } from "../../src/auth/session.js";

describe("Ticket Workflow API Integration Tests (Sprint 4: Issue #48)", () => {
  const prisma = getPrisma();

  let staffSarahCookie: string;
  let requesterJenniferCookie: string;
  let requesterDavidCookie: string;

  let sarahId: number;
  let jenniferId: number;
  let davidId: number;

  let categoryId: number;
  let relatedSystemId: number;

  beforeAll(async () => {
    // 1. Fetch seeded users
    const sarah = await prisma.user.findUniqueOrThrow({
      where: { email: "sarah.johnson@example.com" },
    });
    const jennifer = await prisma.user.findUniqueOrThrow({
      where: { email: "jennifer.anderson@example.com" },
    });
    const david = await prisma.user.findUniqueOrThrow({
      where: { email: "david.lee@example.com" },
    });
    // Ensure david has mustChangePassword: false so session passes requireActiveRequester
    await prisma.user.update({
      where: { id: david.id },
      data: { mustChangePassword: false },
    });

    sarahId = sarah.id;
    jenniferId = jennifer.id;
    davidId = david.id;

    // 2. Prepare session cookies
    staffSarahCookie = `toktickit_session=${signSessionToken({
      userId: sarah.id,
      role: sarah.role,
      mustChangePassword: false,
    })}`;

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

    const cat = await prisma.category.findFirst({ where: { isActive: true } });
    const sys = await prisma.relatedSystem.findFirst({ where: { isActive: true } });
    categoryId = cat!.id;
    relatedSystemId = sys!.id;
  });

  // Helper to create fresh test ticket
  async function createTestTicket(data: Partial<{
    requesterId: number;
    assignedToId: number | null;
    currentStatus: "NEW" | "OPEN" | "IN_PROGRESS" | "WAITING_FOR_REQUESTER" | "RESOLVED" | "CLOSED" | "CANCELLED" | "REOPENED" | "PENDING";
    version: number;
    isProblemResolvedIndicated: boolean;
  }> = {}) {
    return prisma.ticket.create({
      data: {
        ticketNumber: `TKT-WF-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        requesterId: data.requesterId ?? jenniferId,
        assignedToId: data.assignedToId === undefined ? null : data.assignedToId,
        categoryId,
        relatedSystemId,
        summary: "Workflow Test Ticket",
        description: "Testing status transitions, resolution gate, and optimistic locking.",
        requestedPriority: "MEDIUM",
        currentStatus: data.currentStatus ?? "IN_PROGRESS",
        version: data.version ?? 0,
        isProblemResolvedIndicated: data.isProblemResolvedIndicated ?? false,
      },
    });
  }

  // Helper to add Action Taken
  async function addAction(ticketId: number, status: "PLANNED" | "COMPLETED" | "CANCELLED") {
    return prisma.actionTaken.create({
      data: {
        ticketId,
        performedById: sarahId,
        assigneeId: sarahId,
        completedById: status === "COMPLETED" ? sarahId : null,
        actionAt: new Date(),
        description: `Action description for ${status}`,
        result: status === "COMPLETED" ? "Successful action completion" : null,
        status,
        clientRequestId: `req-${Date.now()}-${Math.random()}`,
      },
    });
  }

  // --------------------------------------------------------------------------
  // WF-01: Transition to Resolved failing resolution gate (AC-07, FR-07, BR-11)
  // --------------------------------------------------------------------------
  it("WF-01: rejects transition to RESOLVED when resolution gate is not satisfied", async () => {
    // Ticket in IN_PROGRESS with no owner and no completed actions
    const ticket = await createTestTicket({
      currentStatus: "IN_PROGRESS",
      assignedToId: null,
      version: 1,
    });

    const res = await request(app)
      .patch(`/api/staff/tickets/${ticket.id}/status`)
      .set("Cookie", staffSarahCookie)
      .send({
        status: "RESOLVED",
        expectedVersion: ticket.version,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("RESOLUTION_GATE_NOT_MET");
    expect(res.body.error.message).toBe("Resolution gate criteria not satisfied");
    expect(Array.isArray(res.body.error.reasons)).toBe(true);
    expect(res.body.error.reasons).toContain("A Ticket Owner must be assigned before resolving");
    expect(res.body.error.reasons).toContain("At least one Completed Action Taken is required");
  });

  // --------------------------------------------------------------------------
  // WF-02: Transition to Resolved satisfying all gate rules (AC-08, BR-11, BR-16)
  // --------------------------------------------------------------------------
  it("WF-02: allows transition to RESOLVED when all resolution gate rules are satisfied", async () => {
    // Ticket with assigned owner and 1 completed action, 0 planned actions
    const ticket = await createTestTicket({
      currentStatus: "IN_PROGRESS",
      assignedToId: sarahId,
      version: 2,
    });

    await addAction(ticket.id, "COMPLETED");

    const res = await request(app)
      .patch(`/api/staff/tickets/${ticket.id}/status`)
      .set("Cookie", staffSarahCookie)
      .send({
        status: "RESOLVED",
        expectedVersion: ticket.version,
      });

    expect(res.status).toBe(200);
    expect(res.body.currentStatus).toBe("RESOLVED");
    expect(res.body.version).toBe(ticket.version + 1);

    // Verify TicketStatusHistory was appended
    const history = await prisma.ticketStatusHistory.findMany({
      where: { ticketId: ticket.id },
    });
    expect(history.length).toBe(1);
    expect(history[0].fromStatus).toBe("IN_PROGRESS");
    expect(history[0].toStatus).toBe("RESOLVED");
    expect(history[0].changedById).toBe(sarahId);
  });

  // --------------------------------------------------------------------------
  // WF-03: Transition outside authorized state matrix (AC-09, BR-12)
  // --------------------------------------------------------------------------
  it("WF-03: rejects status transition not permitted by the transition matrix", async () => {
    // Attempting direct jump from OPEN to RESOLVED is forbidden in Sprint 4
    const ticket = await createTestTicket({
      currentStatus: "OPEN",
      assignedToId: sarahId,
      version: 0,
    });

    const res = await request(app)
      .patch(`/api/staff/tickets/${ticket.id}/status`)
      .set("Cookie", staffSarahCookie)
      .send({
        status: "RESOLVED",
        expectedVersion: ticket.version,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
  });

  // --------------------------------------------------------------------------
  // WF-04: Status change with outdated expectedVersion (AC-10, FR-10, BR-17)
  // --------------------------------------------------------------------------
  it("WF-04: rejects status transition with HTTP 409 STALE_UPDATE if version mismatches", async () => {
    const ticket = await createTestTicket({
      currentStatus: "IN_PROGRESS",
      assignedToId: sarahId,
      version: 3,
    });

    const res = await request(app)
      .patch(`/api/staff/tickets/${ticket.id}/status`)
      .set("Cookie", staffSarahCookie)
      .send({
        status: "CANCELLED",
        expectedVersion: ticket.version - 1, // Stale version
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("STALE_UPDATE");

    // Verify ticket remains unchanged
    const unchanged = await prisma.ticket.findUnique({ where: { id: ticket.id } });
    expect(unchanged!.currentStatus).toBe("IN_PROGRESS");
    expect(unchanged!.version).toBe(3);
  });

  // --------------------------------------------------------------------------
  // WF-05: Requester reopens own Resolved or Closed ticket (AC-15, FR-08, BR-13)
  // --------------------------------------------------------------------------
  it("WF-05: allows requester to reopen own Resolved or Closed ticket and clears advisory flag", async () => {
    const ticket = await createTestTicket({
      requesterId: jenniferId,
      currentStatus: "RESOLVED",
      isProblemResolvedIndicated: true,
      version: 2,
    });

    const res = await request(app)
      .post(`/api/tickets/${ticket.id}/reopen`)
      .set("Cookie", requesterJenniferCookie)
      .send({
        reason: "The application froze again after rebooting.",
        expectedVersion: ticket.version,
      });

    expect(res.status).toBe(200);
    expect(res.body.currentStatus).toBe("REOPENED");
    expect(res.body.isProblemResolvedIndicated).toBe(false);
    expect(res.body.version).toBe(ticket.version + 1);

    // Verify history audit record
    const history = await prisma.ticketStatusHistory.findMany({
      where: { ticketId: ticket.id },
      orderBy: { changedAt: "desc" },
    });
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].fromStatus).toBe("RESOLVED");
    expect(history[0].toStatus).toBe("REOPENED");
    expect(history[0].reason).toBe("The application froze again after rebooting.");
    expect(history[0].changedById).toBe(jenniferId);
  });

  // --------------------------------------------------------------------------
  // WF-06: Requester sets 'problem appears resolved' flag (AC-11, FR-11, BR-15)
  // --------------------------------------------------------------------------
  it("WF-06: allows requester to indicate problem resolved without mutating ticket status", async () => {
    const ticket = await createTestTicket({
      requesterId: jenniferId,
      currentStatus: "WAITING_FOR_REQUESTER",
      isProblemResolvedIndicated: false,
    });

    const res = await request(app)
      .post(`/api/tickets/${ticket.id}/resolve-indicated`)
      .set("Cookie", requesterJenniferCookie);

    expect(res.status).toBe(200);
    expect(res.body.isProblemResolvedIndicated).toBe(true);
    expect(res.body.currentStatus).toBe("WAITING_FOR_REQUESTER");
  });

  // --------------------------------------------------------------------------
  // WF-07: Retrieve ticket status audit history (AC-12, FR-09, BR-16)
  // --------------------------------------------------------------------------
  it("WF-07: retrieves chronological status audit history with author and reason", async () => {
    const ticket = await createTestTicket({
      requesterId: jenniferId,
      currentStatus: "OPEN",
    });

    // Record two history entries manually
    await prisma.ticketStatusHistory.create({
      data: {
        ticketId: ticket.id,
        fromStatus: "NEW",
        toStatus: "OPEN",
        changedById: sarahId,
        reason: null,
        changedAt: new Date(Date.now() - 60000),
      },
    });

    await prisma.ticketStatusHistory.create({
      data: {
        ticketId: ticket.id,
        fromStatus: "OPEN",
        toStatus: "IN_PROGRESS",
        changedById: sarahId,
        reason: "Beginning active diagnosis",
        changedAt: new Date(),
      },
    });

    const res = await request(app)
      .get(`/api/tickets/${ticket.id}/history`)
      .set("Cookie", requesterJenniferCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body[0].fromStatus).toBe("NEW");
    expect(res.body[0].toStatus).toBe("OPEN");
    expect(res.body[0].changedBy.name).toBe("Sarah Johnson");
    expect(res.body[1].fromStatus).toBe("OPEN");
    expect(res.body[1].toStatus).toBe("IN_PROGRESS");
    expect(res.body[1].reason).toBe("Beginning active diagnosis");
  });

  // --------------------------------------------------------------------------
  // WF-08: Attempt to reassign owner on Resolved ticket (BR-18)
  // --------------------------------------------------------------------------
  it("WF-08: blocks assigning or reassigning owner on Resolved ticket with HTTP 400 TICKET_LOCKED", async () => {
    const ticket = await createTestTicket({
      currentStatus: "RESOLVED",
      assignedToId: sarahId,
      version: 5,
    });

    const res = await request(app)
      .patch(`/api/staff/tickets/${ticket.id}/assign`)
      .set("Cookie", staffSarahCookie)
      .send({
        assignedToId: null,
        expectedVersion: ticket.version,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("TICKET_LOCKED");
  });

  // --------------------------------------------------------------------------
  // WF-09: Assign ticket owner with stale expectedVersion (AC-10, BR-17)
  // --------------------------------------------------------------------------
  it("WF-09: rejects ticket assignment with HTTP 409 STALE_UPDATE on version conflict", async () => {
    const ticket = await createTestTicket({
      currentStatus: "OPEN",
      assignedToId: null,
      version: 4,
    });

    const res = await request(app)
      .patch(`/api/staff/tickets/${ticket.id}/assign`)
      .set("Cookie", staffSarahCookie)
      .send({
        assignedToId: sarahId,
        expectedVersion: 1, // Stale version
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("STALE_UPDATE");
  });

  // --------------------------------------------------------------------------
  // WF-10: Reopen ticket with stale expectedVersion (AC-10, BR-17)
  // --------------------------------------------------------------------------
  it("WF-10: rejects reopening with HTTP 409 STALE_UPDATE on version conflict", async () => {
    const ticket = await createTestTicket({
      requesterId: jenniferId,
      currentStatus: "RESOLVED",
      version: 6,
    });

    const res = await request(app)
      .post(`/api/tickets/${ticket.id}/reopen`)
      .set("Cookie", requesterJenniferCookie)
      .send({
        reason: "Still having issues.",
        expectedVersion: 2, // Stale version
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("STALE_UPDATE");
  });

  // Extra Security Guard: Requester attempting to access history of unowned ticket returns 404
  it("returns HTTP 404 when requester attempts to read history of another requester's ticket", async () => {
    const ticket = await createTestTicket({
      requesterId: jenniferId,
      currentStatus: "OPEN",
    });

    const res = await request(app)
      .get(`/api/tickets/${ticket.id}/history`)
      .set("Cookie", requesterDavidCookie);

    expect(res.status).toBe(404);
  });
});