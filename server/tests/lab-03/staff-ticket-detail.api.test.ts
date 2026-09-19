import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { signSessionToken } from "../../src/auth/session.js";

describe("Staff Ticket Operations & Details APIs (API-12, API-13, API-14)", () => {
  let requesterCookie: string;
  let itStaff1Cookie: string;
  let itStaff2Cookie: string;
  let itStaff1Id: number;
  let itStaff2Id: number;
  let inactiveStaffId: number;
  let requesterUserId: number;
  let operationTicketId: number;

  beforeAll(async () => {
    const prisma = getPrisma();

    // Look up seeded users
    const jennifer = await prisma.user.findUnique({
      where: { email: "jennifer.anderson@example.com" },
    });
    const michael = await prisma.user.findUnique({
      where: { email: "michael.brown@example.com" },
    });
    const sarah = await prisma.user.findUnique({
      where: { email: "sarah.johnson@example.com" },
    });
    const lisa = await prisma.user.findUnique({
      where: { email: "lisa.martinez@example.com" },
    });

    if (!jennifer || !michael || !sarah || !lisa) {
      throw new Error("Seed users missing for staff ticket operations test");
    }

    requesterUserId = jennifer.id;
    itStaff1Id = michael.id;
    itStaff2Id = sarah.id;
    inactiveStaffId = lisa.id;

    requesterCookie = `toktickit_session=${signSessionToken({
      userId: jennifer.id,
      role: jennifer.role,
      mustChangePassword: false,
    })}`;

    itStaff1Cookie = `toktickit_session=${signSessionToken({
      userId: michael.id,
      role: michael.role,
      mustChangePassword: false,
    })}`;

    itStaff2Cookie = `toktickit_session=${signSessionToken({
      userId: sarah.id,
      role: sarah.role,
      mustChangePassword: false,
    })}`;

    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const relatedSystem = await prisma.relatedSystem.findFirst({ where: { isActive: true } });

    // Create a fresh test ticket for operational tests
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-OP-TEST-${Date.now().toString().slice(-6)}`,
        requesterId: jennifer.id,
        categoryId: category!.id,
        relatedSystemId: relatedSystem!.id,
        summary: "Operations Test Ticket",
        description: "Testing claim, reassign, itPriority, and status transitions.",
        requestedPriority: "LOW",
        itPriority: "LOW",
        currentStatus: "NEW",
        assignedToId: null,
      },
    });

    operationTicketId = ticket.id;
  });

  describe("GET /api/staff/users (Staff User List for Reassignment)", () => {
    it("rejects unauthenticated requests with 401", async () => {
      const res = await request(app).get("/api/staff/users");
      expect(res.status).toBe(401);
    });

    it("rejects Requester role with 403", async () => {
      const res = await request(app)
        .get("/api/staff/users")
        .set("Cookie", requesterCookie);
      expect(res.status).toBe(403);
    });

    it("returns list of active IT Staff and Administrators only", async () => {
      const res = await request(app)
        .get("/api/staff/users")
        .set("Cookie", itStaff1Cookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(3);

      // Verify all returned users are active and staff/admin
      res.body.forEach((u: any) => {
        expect(["IT_STAFF", "ADMINISTRATOR"]).toContain(u.role);
        expect(u.isActive).toBe(true);
      });

      // Verify inactive staff is not included
      expect(res.body.some((u: any) => u.id === inactiveStaffId)).toBe(false);
      // Verify requester is not included
      expect(res.body.some((u: any) => u.id === requesterUserId)).toBe(false);
    });
  });

  describe("PATCH /api/staff/tickets/:id/assign (API-12, AC-12: Claim & Reassign)", () => {
    it("rejects Requester access with 403", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${operationTicketId}/assign`)
        .set("Cookie", requesterCookie)
        .send({ assignedToId: itStaff1Id });

      expect(res.status).toBe(403);
    });

    it("allows IT Staff to claim an unassigned ticket", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${operationTicketId}/assign`)
        .set("Cookie", itStaff1Cookie)
        .send({ assignedToId: itStaff1Id });

      expect(res.status).toBe(200);
      expect(res.body.assignedToId).toBe(itStaff1Id);
      expect(res.body.assignedTo.name).toBe("Michael Brown");
    });

    it("allows IT Staff to reassign ticket to another active IT Staff member", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${operationTicketId}/assign`)
        .set("Cookie", itStaff1Cookie)
        .send({ assignedToId: itStaff2Id });

      expect(res.status).toBe(200);
      expect(res.body.assignedToId).toBe(itStaff2Id);
      expect(res.body.assignedTo.name).toBe("Sarah Johnson");
    });

    it("rejects assignment to an inactive staff member with 400 Bad Request", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${operationTicketId}/assign`)
        .set("Cookie", itStaff1Cookie)
        .send({ assignedToId: inactiveStaffId });

      expect(res.status).toBe(400);
    });

    it("rejects assignment to a Requester user with 400 Bad Request", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${operationTicketId}/assign`)
        .set("Cookie", itStaff1Cookie)
        .send({ assignedToId: requesterUserId });

      expect(res.status).toBe(400);
    });

    it("allows unassigning ticket by passing null", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${operationTicketId}/assign`)
        .set("Cookie", itStaff1Cookie)
        .send({ assignedToId: null });

      expect(res.status).toBe(200);
      expect(res.body.assignedToId).toBeNull();
      expect(res.body.assignedTo).toBeNull();
    });
  });

  describe("PATCH /api/staff/tickets/:id/priority (API-13, AC-13: Update IT Priority)", () => {
    it("rejects Requester access with 403", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${operationTicketId}/priority`)
        .set("Cookie", requesterCookie)
        .send({ itPriority: "HIGH" });

      expect(res.status).toBe(403);
    });

    it("updates IT Priority to HIGH while requestedPriority remains intact", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${operationTicketId}/priority`)
        .set("Cookie", itStaff1Cookie)
        .send({ itPriority: "HIGH" });

      expect(res.status).toBe(200);
      expect(res.body.itPriority).toBe("HIGH");
      expect(res.body.requestedPriority).toBe("LOW"); // immutable BR-10
    });

    it("rejects invalid IT Priority values with 400 Bad Request", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${operationTicketId}/priority`)
        .set("Cookie", itStaff1Cookie)
        .send({ itPriority: "CRITICAL" });

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/staff/tickets/:id/status (API-14, AC-14: Permitted Status Transitions BR-15)", () => {
    it("rejects Requester access with 403", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${operationTicketId}/status`)
        .set("Cookie", requesterCookie)
        .send({ status: "OPEN" });

      expect(res.status).toBe(403);
    });

    it("rejects illegal direct transition from NEW to CLOSED with 400 Bad Request", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${operationTicketId}/status`)
        .set("Cookie", itStaff1Cookie)
        .send({ status: "CLOSED" });

      expect(res.status).toBe(400);
    });

    it("executes valid transition from NEW to OPEN", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${operationTicketId}/status`)
        .set("Cookie", itStaff1Cookie)
        .send({ status: "OPEN" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("OPEN");
    });

    it("executes valid transition from OPEN to IN_PROGRESS", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${operationTicketId}/status`)
        .set("Cookie", itStaff1Cookie)
        .send({ status: "IN_PROGRESS" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("IN_PROGRESS");
    });

    it("executes valid transition from IN_PROGRESS to WAITING_FOR_REQUESTER", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${operationTicketId}/status`)
        .set("Cookie", itStaff1Cookie)
        .send({ status: "WAITING_FOR_REQUESTER" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("WAITING_FOR_REQUESTER");
    });

    it("executes valid transition from WAITING_FOR_REQUESTER to RESOLVED", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${operationTicketId}/status`)
        .set("Cookie", itStaff1Cookie)
        .send({ status: "RESOLVED" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("RESOLVED");
    });

    it("rejects illegal transition from RESOLVED directly back to IN_PROGRESS with 400", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${operationTicketId}/status`)
        .set("Cookie", itStaff1Cookie)
        .send({ status: "IN_PROGRESS" });

      expect(res.status).toBe(400);
    });

    it("executes valid transition from RESOLVED to CLOSED", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${operationTicketId}/status`)
        .set("Cookie", itStaff1Cookie)
        .send({ status: "CLOSED" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("CLOSED");
    });

    it("executes valid transition from CLOSED to REOPENED", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${operationTicketId}/status`)
        .set("Cookie", itStaff1Cookie)
        .send({ status: "REOPENED" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("REOPENED");
    });
  });
});
