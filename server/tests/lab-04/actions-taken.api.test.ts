import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { signSessionToken } from "../../src/auth/session.js";

describe("Actions Taken API (Sprint 4: Issue #47)", () => {
  const prisma = getPrisma();

  let staffSarahCookie: string;
  let staffMichaelCookie: string;
  let requesterJenniferCookie: string;
  let requesterDavidCookie: string;

  let sarahId: number;
  let michaelId: number;
  let inactiveStaffId: number;
  let jenniferId: number;
  let davidId: number;

  let openTicketId: number;
  let resolvedTicketId: number;
  let closedTicketId: number;
  let cancelledTicketId: number;

  beforeAll(async () => {
    // 1. Fetch seeded users
    const sarah = await prisma.user.findUniqueOrThrow({
      where: { email: "sarah.johnson@example.com" },
    });
    const michael = await prisma.user.findUniqueOrThrow({
      where: { email: "michael.brown@example.com" },
    });
    const inactiveStaff = await prisma.user.findUniqueOrThrow({
      where: { email: "lisa.martinez@example.com" },
    });
    const jennifer = await prisma.user.findUniqueOrThrow({
      where: { email: "jennifer.anderson@example.com" },
    });
    const david = await prisma.user.findUniqueOrThrow({
      where: { email: "david.lee@example.com" },
    });

    sarahId = sarah.id;
    michaelId = michael.id;
    inactiveStaffId = inactiveStaff.id;
    jenniferId = jennifer.id;
    davidId = david.id;

    // 2. Prepare session cookies
    staffSarahCookie = `toktickit_session=${signSessionToken({
      userId: sarah.id,
      role: sarah.role,
      mustChangePassword: false,
    })}`;

    staffMichaelCookie = `toktickit_session=${signSessionToken({
      userId: michael.id,
      role: michael.role,
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

    // 3. Find tickets in various states (seeded)
    const openTicket = await prisma.ticket.findFirstOrThrow({
      where: { ticketNumber: "TKT-2026-000001" }, // IN_PROGRESS, owned by Jennifer
    });
    openTicketId = openTicket.id;

    const resolvedTicket = await prisma.ticket.findFirstOrThrow({
      where: { ticketNumber: "TKT-2026-000006" }, // RESOLVED, owned by David
    });
    resolvedTicketId = resolvedTicket.id;

    const closedTicket = await prisma.ticket.findFirstOrThrow({
      where: { ticketNumber: "TKT-2026-000007" }, // CLOSED, owned by Jennifer
    });
    closedTicketId = closedTicket.id;

    const cancelledTicket = await prisma.ticket.findFirstOrThrow({
      where: { ticketNumber: "TKT-2026-000009" }, // CANCELLED
    });
    cancelledTicketId = cancelledTicket.id;
  });

  // --------------------------------------------------------------------------
  // Creation Tests (API-01 .. API-06, API-13 .. API-16, API-18)
  // --------------------------------------------------------------------------

  it("API-01: creates valid Action Taken with authenticated staff (starts at version 0)", async () => {
    const res = await request(app)
      .post(`/api/staff/tickets/${openTicketId}/actions`)
      .set("Cookie", staffSarahCookie)
      .send({
        description: "Diagnosed thermal paste dissipation on CPU heatsink.",
        status: "PLANNED",
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.ticketId).toBe(openTicketId);
    expect(res.body.status).toBe("PLANNED");
    expect(res.body.version).toBe(0);
    expect(res.body.performedBy).toEqual({ id: sarahId, name: "Sarah Johnson" });
    expect(res.body.assignee).toEqual({ id: sarahId, name: "Sarah Johnson" });
    expect(res.body.completedBy).toBeNull();
  });

  it("API-02: attempt to supply spoofed performedById is ignored", async () => {
    const res = await request(app)
      .post(`/api/staff/tickets/${openTicketId}/actions`)
      .set("Cookie", staffSarahCookie)
      .send({
        description: "Inspected fan bearing noise.",
        performedById: 9999, // spoof attempt
      });

    expect(res.status).toBe(201);
    expect(res.body.performedBy.id).toBe(sarahId);
  });

  it("API-03: assigns action to a different active staff user", async () => {
    const res = await request(app)
      .post(`/api/staff/tickets/${openTicketId}/actions`)
      .set("Cookie", staffSarahCookie)
      .send({
        description: "Reassigned hardware benchmark testing to Michael.",
        assigneeId: michaelId,
      });

    expect(res.status).toBe(201);
    expect(res.body.performedBy.id).toBe(sarahId);
    expect(res.body.assignee.id).toBe(michaelId);
  });

  it("API-04: rejects assignment to inactive user or requester with 400 VALIDATION_ERROR", async () => {
    // 1. Attempt assigning to inactive staff
    const resInactive = await request(app)
      .post(`/api/staff/tickets/${openTicketId}/actions`)
      .set("Cookie", staffSarahCookie)
      .send({
        description: "Assigning to deactivated staff member.",
        assigneeId: inactiveStaffId,
      });

    expect(resInactive.status).toBe(400);
    expect(resInactive.body.error.code).toBe("VALIDATION_ERROR");
    expect(resInactive.body.error.fields?.assigneeId).toBeDefined();

    // 2. Attempt assigning to requester
    const resRequester = await request(app)
      .post(`/api/staff/tickets/${openTicketId}/actions`)
      .set("Cookie", staffSarahCookie)
      .send({
        description: "Assigning to requester.",
        assigneeId: jenniferId,
      });

    expect(resRequester.status).toBe(400);
    expect(resRequester.body.error.code).toBe("VALIDATION_ERROR");
    expect(resRequester.body.error.fields?.assigneeId).toBeDefined();
  });

  it("API-05: rejects followUpRequired=true without followUpNote with 400 error", async () => {
    const res = await request(app)
      .post(`/api/staff/tickets/${openTicketId}/actions`)
      .set("Cookie", staffSarahCookie)
      .send({
        description: "Need secondary follow-up confirmation.",
        followUpRequired: true,
        followUpNote: "", // missing note
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.fields?.followUpNote).toBeDefined();
  });

  it("API-06: rejects empty description or completed action without result", async () => {
    // 1. Empty description
    const resEmptyDesc = await request(app)
      .post(`/api/staff/tickets/${openTicketId}/actions`)
      .set("Cookie", staffSarahCookie)
      .send({
        description: "   ",
      });

    expect(resEmptyDesc.status).toBe(400);
    expect(resEmptyDesc.body.error.code).toBe("VALIDATION_ERROR");
    expect(resEmptyDesc.body.error.fields?.description).toBeDefined();

    // 2. Completed status without result
    const resNoResult = await request(app)
      .post(`/api/staff/tickets/${openTicketId}/actions`)
      .set("Cookie", staffSarahCookie)
      .send({
        description: "Completed diagnostic without result string.",
        status: "COMPLETED",
        result: "",
      });

    expect(resNoResult.status).toBe(400);
    expect(resNoResult.body.error.code).toBe("VALIDATION_ERROR");
    expect(resNoResult.body.error.fields?.result).toBeDefined();
  });

  it("API-13: idempotent replay with same clientRequestId returns HTTP 200 with existing record", async () => {
    const clientRequestId = `idemp-${Date.now()}`;

    // First request -> 201 Created
    const res1 = await request(app)
      .post(`/api/staff/tickets/${openTicketId}/actions`)
      .set("Cookie", staffSarahCookie)
      .send({
        description: "Initial idempotent action dispatch.",
        clientRequestId,
      });

    expect(res1.status).toBe(201);
    const createdId = res1.body.id;

    // Second request with same clientRequestId -> 200 OK with identical record
    const res2 = await request(app)
      .post(`/api/staff/tickets/${openTicketId}/actions`)
      .set("Cookie", staffSarahCookie)
      .send({
        description: "Second attempt with same clientRequestId.",
        clientRequestId,
      });

    expect(res2.status).toBe(200);
    expect(res2.body.id).toBe(createdId);
    expect(res2.body.description).toBe("Initial idempotent action dispatch.");
  });

  it("API-14: creates Planned Action with future date successfully", async () => {
    const futureDate = new Date(Date.now() + 48 * 3600 * 1000).toISOString();

    const res = await request(app)
      .post(`/api/staff/tickets/${openTicketId}/actions`)
      .set("Cookie", staffSarahCookie)
      .send({
        description: "Scheduled thermal camera inspection for next week.",
        status: "PLANNED",
        actionAt: futureDate,
      });

    expect(res.status).toBe(201);
    expect(new Date(res.body.actionAt).toISOString()).toBe(futureDate);
  });

  it("API-15: rejects Completed Action with future date exceeding 5 minutes with 400", async () => {
    const futureInvalid = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes in future

    const res = await request(app)
      .post(`/api/staff/tickets/${openTicketId}/actions`)
      .set("Cookie", staffSarahCookie)
      .send({
        description: "Prematurely marked as completed in the future.",
        status: "COMPLETED",
        result: "Premature result.",
        actionAt: futureInvalid,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.fields?.actionAt).toBeDefined();
  });

  it("API-16: creates Action directly as Completed with result (sets completedById)", async () => {
    const res = await request(app)
      .post(`/api/staff/tickets/${openTicketId}/actions`)
      .set("Cookie", staffSarahCookie)
      .send({
        description: "Replaced damaged DC-in power jack connector.",
        status: "COMPLETED",
        result: "Power jack replaced; laptop charges at 65W continuously.",
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("COMPLETED");
    expect(res.body.completedBy.id).toBe(sarahId);
    expect(res.body.result).toContain("laptop charges at 65W");
  });

  it("API-18: rejects adding Planned Action to a Resolved ticket with 400 TICKET_LOCKED", async () => {
    const res = await request(app)
      .post(`/api/staff/tickets/${resolvedTicketId}/actions`)
      .set("Cookie", staffSarahCookie)
      .send({
        description: "Attempting to plan further work on a resolved ticket.",
        status: "PLANNED",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("TICKET_LOCKED");
  });

  // --------------------------------------------------------------------------
  // Listing Tests (API-07, SEC-02)
  // --------------------------------------------------------------------------

  it("API-07: lists actions in stable chronological order (actionAt asc, id asc)", async () => {
    const res = await request(app)
      .get(`/api/tickets/${openTicketId}/actions`)
      .set("Cookie", staffSarahCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);

    // Verify ordering
    for (let i = 1; i < res.body.length; i++) {
      const prev = res.body[i - 1];
      const curr = res.body[i];
      const prevTime = new Date(prev.actionAt).getTime();
      const currTime = new Date(curr.actionAt).getTime();
      expect(prevTime <= currTime).toBe(true);
      if (prevTime === currTime) {
        expect(prev.id < curr.id).toBe(true);
      }
    }
  });

  it("SEC-02: Requester reads actions of own ticket (HTTP 200) vs other ticket (HTTP 404)", async () => {
    // Jennifer owns openTicketId (TKT-2026-000001)
    const resOwn = await request(app)
      .get(`/api/tickets/${openTicketId}/actions`)
      .set("Cookie", requesterJenniferCookie);

    expect(resOwn.status).toBe(200);
    expect(Array.isArray(resOwn.body)).toBe(true);

    // David owns resolvedTicketId (TKT-2026-000006); Jennifer does NOT own it -> 404
    const resOther = await request(app)
      .get(`/api/tickets/${resolvedTicketId}/actions`)
      .set("Cookie", requesterJenniferCookie);

    expect(resOther.status).toBe(404);
    expect(resOther.body.error.code).toBe("NOT_FOUND");
  });

  // --------------------------------------------------------------------------
  // Modification Tests (API-08 .. API-12, API-17)
  // --------------------------------------------------------------------------

  it("API-08: edits planned action and transitions to Completed (increments version, records completedById)", async () => {
    // 1. Create a planned action with version 0
    const createRes = await request(app)
      .post(`/api/staff/tickets/${openTicketId}/actions`)
      .set("Cookie", staffMichaelCookie)
      .send({
        description: "Planned memory diagnostic suite.",
        status: "PLANNED",
      });
    expect(createRes.status).toBe(201);
    const actionId = createRes.body.id;
    expect(createRes.body.version).toBe(0);

    // 2. Complete it with expectedVersion: 0
    const patchRes = await request(app)
      .patch(`/api/staff/tickets/${openTicketId}/actions/${actionId}`)
      .set("Cookie", staffSarahCookie)
      .send({
        expectedVersion: 0,
        status: "COMPLETED",
        result: "Ran 4 passes of MemTest86 with 0 errors detected.",
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.status).toBe("COMPLETED");
    expect(patchRes.body.version).toBe(1);
    expect(patchRes.body.completedBy.id).toBe(sarahId);
    expect(patchRes.body.result).toContain("MemTest86");
  });

  it("API-09: attempts to edit Completed or Cancelled action rejected with 400 ACTION_IMMUTABLE", async () => {
    // Create and complete an action
    const createRes = await request(app)
      .post(`/api/staff/tickets/${openTicketId}/actions`)
      .set("Cookie", staffSarahCookie)
      .send({
        description: "Completed task to test immutability.",
        status: "COMPLETED",
        result: "Initial complete result.",
      });
    const actionId = createRes.body.id;

    // Attempt modifying it
    const patchRes = await request(app)
      .patch(`/api/staff/tickets/${openTicketId}/actions/${actionId}`)
      .set("Cookie", staffSarahCookie)
      .send({
        expectedVersion: 0,
        description: "Attempting to alter completed action description.",
      });

    expect(patchRes.status).toBe(400);
    expect(patchRes.body.error.code).toBe("ACTION_IMMUTABLE");
  });

  it("API-10: edits action with stale expectedVersion rejected with 409 STALE_UPDATE", async () => {
    // Create planned action (version = 0)
    const createRes = await request(app)
      .post(`/api/staff/tickets/${openTicketId}/actions`)
      .set("Cookie", staffSarahCookie)
      .send({
        description: "Planned concurrency guard test.",
      });
    const actionId = createRes.body.id;

    // Submit with mismatched expectedVersion: 99
    const patchRes = await request(app)
      .patch(`/api/staff/tickets/${openTicketId}/actions/${actionId}`)
      .set("Cookie", staffSarahCookie)
      .send({
        expectedVersion: 99,
        description: "Stale version payload.",
      });

    expect(patchRes.status).toBe(409);
    expect(patchRes.body.error.code).toBe("STALE_UPDATE");
  });

  it("API-11: adding or editing action on Closed or Cancelled ticket rejected with 400 TICKET_LOCKED", async () => {
    // 1. Attempt adding to Closed ticket
    const resAddClosed = await request(app)
      .post(`/api/staff/tickets/${closedTicketId}/actions`)
      .set("Cookie", staffSarahCookie)
      .send({
        description: "Action on closed ticket.",
      });
    expect(resAddClosed.status).toBe(400);
    expect(resAddClosed.body.error.code).toBe("TICKET_LOCKED");

    // 2. Attempt adding to Cancelled ticket
    const resAddCancelled = await request(app)
      .post(`/api/staff/tickets/${cancelledTicketId}/actions`)
      .set("Cookie", staffSarahCookie)
      .send({
        description: "Action on cancelled ticket.",
      });
    expect(resAddCancelled.status).toBe(400);
    expect(resAddCancelled.body.error.code).toBe("TICKET_LOCKED");
  });

  it("API-12: accessing action ID with mismatched ticket ID returns HTTP 404", async () => {
    // Action belongs to openTicketId, but caller specifies resolvedTicketId in path
    const createRes = await request(app)
      .post(`/api/staff/tickets/${openTicketId}/actions`)
      .set("Cookie", staffSarahCookie)
      .send({
        description: "Cross ticket mismatch action.",
      });
    const actionId = createRes.body.id;

    const patchRes = await request(app)
      .patch(`/api/staff/tickets/${resolvedTicketId}/actions/${actionId}`)
      .set("Cookie", staffSarahCookie)
      .send({
        expectedVersion: 0,
        description: "Cross ticket update attempt.",
      });

    expect(patchRes.status).toBe(404);
    expect(patchRes.body.error.code).toBe("NOT_FOUND");
  });

  it("API-17: completing future Planned Action without actionAt automatically resets to current time", async () => {
    // 1. Create planned action with future date
    const futureDate = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const createRes = await request(app)
      .post(`/api/staff/tickets/${openTicketId}/actions`)
      .set("Cookie", staffSarahCookie)
      .send({
        description: "Scheduled maintenance for tomorrow.",
        status: "PLANNED",
        actionAt: futureDate,
      });
    const actionId = createRes.body.id;

    // 2. Complete early without providing actionAt
    const beforePatch = Date.now();
    const patchRes = await request(app)
      .patch(`/api/staff/tickets/${openTicketId}/actions/${actionId}`)
      .set("Cookie", staffSarahCookie)
      .send({
        expectedVersion: 0,
        status: "COMPLETED",
        result: "Maintenance executed ahead of schedule.",
      });

    expect(patchRes.status).toBe(200);
    const patchedActionAt = new Date(patchRes.body.actionAt).getTime();
    // actionAt should have been reset to approximately now
    expect(Math.abs(patchedActionAt - beforePatch)).toBeLessThan(10000);
  });

  // --------------------------------------------------------------------------
  // Authorization Tests (SEC-01)
  // --------------------------------------------------------------------------

  it("SEC-01: Requester attempting to call staff action endpoints returns HTTP 403 Forbidden", async () => {
    // 1. Requester calls POST
    const postRes = await request(app)
      .post(`/api/staff/tickets/${openTicketId}/actions`)
      .set("Cookie", requesterJenniferCookie)
      .send({
        description: "Requester unauthorized write attempt.",
      });

    expect(postRes.status).toBe(403);
    expect(postRes.body.error.code).toBe("FORBIDDEN");

    // 2. Requester calls PATCH
    const patchRes = await request(app)
      .patch(`/api/staff/tickets/${openTicketId}/actions/1`)
      .set("Cookie", requesterJenniferCookie)
      .send({
        expectedVersion: 0,
        description: "Requester unauthorized edit attempt.",
      });

    expect(patchRes.status).toBe(403);
    expect(patchRes.body.error.code).toBe("FORBIDDEN");
  });
});
