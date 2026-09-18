import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { signSessionToken } from "../../src/auth/session.js";

describe("Public Comments & Dual-Channel Notes APIs (Issue #32)", () => {
  let requester1Cookie: string;
  let requester2Cookie: string;
  let itStaffCookie: string;
  let requester1TicketId: number;
  let resolvedTicketId: number;

  beforeAll(async () => {
    const prisma = getPrisma();

    // Look up seeded users
    const jennifer = await prisma.user.findUnique({
      where: { email: "jennifer.anderson@example.com" },
    });
    let requester2 = await prisma.user.findUnique({
      where: { email: "test.requester2@toktickit.com" },
    });
    if (!requester2) {
      requester2 = await prisma.user.create({
        data: {
          email: "test.requester2@toktickit.com",
          name: "Test Requester Two",
          role: "REQUESTER",
          isActive: true,
          mustChangePassword: false,
          passwordHash: "$2b$10$DuNLpS.JeLH2u73kWcxwY.E5JIyngJ40VSFrtVci5hmWACgY6wkPK",
        },
      });
    }
    const sarah = await prisma.user.findUnique({
      where: { email: "sarah.johnson@example.com" },
    });

    if (!jennifer || !sarah) {
      throw new Error("Seed users missing for comments test");
    }

    // Prepare session cookies (Signed JWT session)
    const token1 = signSessionToken({
      userId: jennifer.id,
      role: jennifer.role,
      mustChangePassword: false,
    });
    requester1Cookie = `toktickit_session=${token1}`;

    const token2 = signSessionToken({
      userId: requester2.id,
      role: requester2.role,
      mustChangePassword: false,
    });
    requester2Cookie = `toktickit_session=${token2}`;

    const tokenStaff = signSessionToken({
      userId: sarah.id,
      role: sarah.role,
      mustChangePassword: false,
    });
    itStaffCookie = `toktickit_session=${tokenStaff}`;

    // Look up or create a test ticket owned by jennifer
    let ticket1 = await prisma.ticket.findFirst({
      where: { requesterId: jennifer.id, currentStatus: "IN_PROGRESS" },
    });
    if (!ticket1) {
      ticket1 = await prisma.ticket.findFirst({
        where: { requesterId: jennifer.id },
      });
    }
    requester1TicketId = ticket1!.id;

    // Look up a resolved ticket
    let resolvedTicket = await prisma.ticket.findFirst({
      where: { currentStatus: "RESOLVED" },
    });
    if (!resolvedTicket) {
      resolvedTicket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-TEST-RES-${Date.now()}`,
          requesterId: jennifer.id,
          categoryId: 1,
          relatedSystemId: 1,
          summary: "Pre-resolved ticket for test",
          description: "This ticket has already been marked as resolved.",
          requestedPriority: "LOW",
          currentStatus: "RESOLVED",
        },
      });
    }
    resolvedTicketId = resolvedTicket.id;
  });

  describe("GET /api/tickets/:id/comments (API-09)", () => {
    it("returns 401 when unauthenticated", async () => {
      const res = await request(app).get(`/api/tickets/${requester1TicketId}/comments`);
      expect(res.status).toBe(401);
    });

    it("returns public comments for owned ticket", async () => {
      const res = await request(app)
        .get(`/api/tickets/${requester1TicketId}/comments`)
        .set("Cookie", requester1Cookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty("id");
        expect(res.body[0]).toHaveProperty("content");
        expect(res.body[0]).toHaveProperty("createdAt");
        expect(res.body[0]).toHaveProperty("author");
        expect(res.body[0].author).toHaveProperty("name");
        expect(res.body[0].author).toHaveProperty("role");
      }
    });

    it("returns 404 when requester attempts to read comments of another requester's ticket", async () => {
      const res = await request(app)
        .get(`/api/tickets/${requester1TicketId}/comments`)
        .set("Cookie", requester2Cookie);

      expect(res.status).toBe(404);
    });

    it("allows IT Staff to read public comments of any ticket", async () => {
      const res = await request(app)
        .get(`/api/tickets/${requester1TicketId}/comments`)
        .set("Cookie", itStaffCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("POST /api/tickets/:id/comments (API-09, BR-11, BR-13)", () => {
    it("creates a public comment with author metadata on owned ticket", async () => {
      const res = await request(app)
        .post(`/api/tickets/${requester1TicketId}/comments`)
        .set("Cookie", requester1Cookie)
        .send({ content: "Thank you for looking into this issue promptly." });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.content).toBe("Thank you for looking into this issue promptly.");
      expect(res.body.author.name).toBe("Jennifer Anderson");
      expect(res.body.author.role).toBe("REQUESTER");
    });

    it("rejects empty or whitespace-only comment with 400 Bad Request", async () => {
      const res = await request(app)
        .post(`/api/tickets/${requester1TicketId}/comments`)
        .set("Cookie", requester1Cookie)
        .send({ content: "   " });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects comment exceeding 2000 characters with 400 Bad Request", async () => {
      const longComment = "a".repeat(2001);
      const res = await request(app)
        .post(`/api/tickets/${requester1TicketId}/comments`)
        .set("Cookie", requester1Cookie)
        .send({ content: longComment });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when requester attempts to post on someone else's ticket", async () => {
      const res = await request(app)
        .post(`/api/tickets/${requester1TicketId}/comments`)
        .set("Cookie", requester2Cookie)
        .send({ content: "Unauthorized comment attempt." });

      expect(res.status).toBe(404);
    });

    it("allows IT Staff to post public comment on any ticket", async () => {
      const res = await request(app)
        .post(`/api/tickets/${requester1TicketId}/comments`)
        .set("Cookie", itStaffCookie)
        .send({ content: "IT Staff updating: We have dispatched a replacement unit." });

      expect(res.status).toBe(201);
      expect(res.body.author.name).toBe("Sarah Johnson");
      expect(res.body.author.role).toBe("IT_STAFF");
    });
  });

  describe("POST /api/tickets/:id/resolve-indicated (API-10, BR-07, BR-15)", () => {
    it("allows requester to flag problem resolved, appends public note, and preserves status", async () => {
      const prisma = getPrisma();
      const testTicket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-RES-IND-${Date.now()}`,
          requesterId: (await prisma.user.findUnique({ where: { email: "jennifer.anderson@example.com" } }))!.id,
          categoryId: 1,
          relatedSystemId: 1,
          summary: "Ticket for resolve indication test",
          description: "Testing problem resolved flag indication.",
          requestedPriority: "MEDIUM",
          currentStatus: "IN_PROGRESS",
          isProblemResolvedIndicated: false,
        },
      });

      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/resolve-indicated`)
        .set("Cookie", requester1Cookie)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.isProblemResolvedIndicated).toBe(true);
      expect(res.body.currentStatus).toBe("IN_PROGRESS");

      const commentsRes = await request(app)
        .get(`/api/tickets/${testTicket.id}/comments`)
        .set("Cookie", requester1Cookie);

      const resolvedComment = commentsRes.body.find(
        (c: { content: string }) => c.content === "Requester indicated that the problem appears resolved."
      );
      expect(resolvedComment).toBeDefined();
    });

    it("rejects resolve-indicated if ticket is already RESOLVED", async () => {
      const res = await request(app)
        .post(`/api/tickets/${resolvedTicketId}/resolve-indicated`)
        .set("Cookie", requester1Cookie)
        .send();

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain("already resolved or closed");
    });
  });

  describe("Dual-Channel Confidentiality Guard (API-08, BR-12)", () => {
    it("strictly blocks Requesters from accessing staff internal notes with 403 Forbidden", async () => {
      const res = await request(app)
        .get(`/api/staff/tickets/${requester1TicketId}/notes`)
        .set("Cookie", requester1Cookie);

      expect(res.status).toBe(403);
    });

    it("strictly blocks Requesters from creating staff internal notes with 403 Forbidden", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${requester1TicketId}/notes`)
        .set("Cookie", requester1Cookie)
        .send({ content: "Illegal internal note attempt" });

      expect(res.status).toBe(403);
    });
  });
});
