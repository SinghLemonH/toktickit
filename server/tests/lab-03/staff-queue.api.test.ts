import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { signSessionToken } from "../../src/auth/session.js";

describe("Staff Ticket Queue API - GET /api/staff/tickets (API-11, AC-11)", () => {
  let requesterCookie: string;
  let itStaffCookie: string;
  let adminCookie: string;
  let itStaffUserId: number;
  let testTicketNumber: string;
  let testCategoryHardwareId: number;

  beforeAll(async () => {
    const prisma = getPrisma();

    // Look up seeded users
    const jennifer = await prisma.user.findUnique({
      where: { email: "jennifer.anderson@example.com" },
    });
    const michael = await prisma.user.findUnique({
      where: { email: "michael.brown@example.com" },
    });
    const admin = await prisma.user.findUnique({
      where: { email: "admin@toktickit.com" },
    });

    if (!jennifer || !michael || !admin) {
      throw new Error("Seed users missing for staff queue test");
    }

    itStaffUserId = michael.id;

    requesterCookie = `toktickit_session=${signSessionToken({
      userId: jennifer.id,
      role: jennifer.role,
      mustChangePassword: false,
    })}`;

    itStaffCookie = `toktickit_session=${signSessionToken({
      userId: michael.id,
      role: michael.role,
      mustChangePassword: false,
    })}`;

    adminCookie = `toktickit_session=${signSessionToken({
      userId: admin.id,
      role: admin.role,
      mustChangePassword: false,
    })}`;

    // Look up category and related system for creating specific test tickets
    const hardwareCategory = await prisma.category.findFirst({
      where: { name: "Hardware", isActive: true },
    });
    const softwareCategory = await prisma.category.findFirst({
      where: { name: "Software", isActive: true },
    });
    const relatedSystem = await prisma.relatedSystem.findFirst({
      where: { isActive: true },
    });

    if (!hardwareCategory || !softwareCategory || !relatedSystem) {
      throw new Error("Reference data missing for staff queue test");
    }

    testCategoryHardwareId = hardwareCategory.id;

    // Create a known searchable ticket
    const uniqueSuffix = Date.now().toString().slice(-6);
    testTicketNumber = `TKT-QUEUE-TEST-${uniqueSuffix}`;

    await prisma.ticket.create({
      data: {
        ticketNumber: testTicketNumber,
        requesterId: jennifer.id,
        categoryId: hardwareCategory.id,
        relatedSystemId: relatedSystem.id,
        summary: `Searchable Queue Summary ${uniqueSuffix}`,
        description: "Detailed description for queue search verification test.",
        requestedPriority: "HIGH",
        itPriority: "HIGH",
        currentStatus: "NEW",
        assignedToId: michael.id,
      },
    });

    // Create an unassigned ticket
    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-UNASSIGNED-${uniqueSuffix}`,
        requesterId: jennifer.id,
        categoryId: softwareCategory.id,
        relatedSystemId: relatedSystem.id,
        summary: `Unassigned Queue Ticket ${uniqueSuffix}`,
        description: "Unassigned ticket for ownership filter verification.",
        requestedPriority: "LOW",
        itPriority: "LOW",
        currentStatus: "OPEN",
        assignedToId: null,
      },
    });
  });

  it("rejects unauthenticated access with 401 Unauthorized", async () => {
    const res = await request(app).get("/api/staff/tickets");
    expect(res.status).toBe(401);
  });

  it("rejects Requester access with 403 Forbidden (SEC-03, AC-11)", async () => {
    const res = await request(app)
      .get("/api/staff/tickets")
      .set("Cookie", requesterCookie);

    expect(res.status).toBe(403);
  });

  it("allows IT Staff and Administrator access with 200 OK", async () => {
    const staffRes = await request(app)
      .get("/api/staff/tickets")
      .set("Cookie", itStaffCookie);

    expect(staffRes.status).toBe(200);
    const staffTickets = staffRes.body.tickets || staffRes.body.data;
    expect(Array.isArray(staffTickets)).toBe(true);
    expect(staffTickets.length).toBeGreaterThan(0);

    const adminRes = await request(app)
      .get("/api/staff/tickets")
      .set("Cookie", adminCookie);

    expect(adminRes.status).toBe(200);
  });

  it("filters tickets by search query matching ticket number or summary", async () => {
    const res = await request(app)
      .get(`/api/staff/tickets?search=${testTicketNumber}`)
      .set("Cookie", itStaffCookie);

    expect(res.status).toBe(200);
    const tickets = res.body.tickets || res.body.data;
    expect(tickets.length).toBeGreaterThanOrEqual(1);
    expect(tickets.some((t: any) => t.ticketNumber === testTicketNumber)).toBe(true);
  });

  it("filters tickets by status (NEW / OPEN)", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?status=NEW")
      .set("Cookie", itStaffCookie);

    expect(res.status).toBe(200);
    const tickets = res.body.tickets || res.body.data;
    expect(tickets.length).toBeGreaterThan(0);
    tickets.forEach((t: any) => {
      expect(t.currentStatus).toBe("NEW");
    });
  });

  it("filters tickets by IT Priority (HIGH / LOW)", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?itPriority=HIGH")
      .set("Cookie", itStaffCookie);

    expect(res.status).toBe(200);
    const tickets = res.body.tickets || res.body.data;
    expect(tickets.length).toBeGreaterThan(0);
    tickets.forEach((t: any) => {
      expect(t.itPriority).toBe("HIGH");
    });
  });

  it("filters tickets by Category", async () => {
    const res = await request(app)
      .get(`/api/staff/tickets?categoryId=${testCategoryHardwareId}`)
      .set("Cookie", itStaffCookie);

    expect(res.status).toBe(200);
    const tickets = res.body.tickets || res.body.data;
    expect(tickets.length).toBeGreaterThan(0);
    tickets.forEach((t: any) => {
      expect(t.category.id).toBe(testCategoryHardwareId);
    });
  });

  it("filters tickets by ownership: unassigned", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?assignedTo=unassigned")
      .set("Cookie", itStaffCookie);

    expect(res.status).toBe(200);
    const tickets = res.body.tickets || res.body.data;
    expect(tickets.length).toBeGreaterThan(0);
    tickets.forEach((t: any) => {
      expect(t.assignedTo).toBeNull();
    });
  });

  it("filters tickets by ownership: me", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?assignedTo=me")
      .set("Cookie", itStaffCookie);

    expect(res.status).toBe(200);
    const tickets = res.body.tickets || res.body.data;
    expect(tickets.length).toBeGreaterThan(0);
    tickets.forEach((t: any) => {
      expect(t.assignedTo.id).toBe(itStaffUserId);
    });
  });

  it("supports sorting and falls back safely on invalid sort field", async () => {
    const resAsc = await request(app)
      .get("/api/staff/tickets?sortBy=ticketNumber&sortOrder=asc&pageSize=5")
      .set("Cookie", itStaffCookie);

    expect(resAsc.status).toBe(200);

    const resFallback = await request(app)
      .get("/api/staff/tickets?sortBy=invalidField")
      .set("Cookie", itStaffCookie);

    expect(resFallback.status).toBe(200);
  });

  it("returns structured pagination metadata", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?page=1&pageSize=5")
      .set("Cookie", itStaffCookie);

    expect(res.status).toBe(200);
    expect(res.body.pagination).toBeDefined();
    expect(typeof res.body.pagination.totalPages).toBe("number");
    expect(res.body.pagination.pageSize).toBe(5);
  });
});
