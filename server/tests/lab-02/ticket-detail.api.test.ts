import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

const REQUESTER_A_ID = 1; // Jennifer Anderson
const REQUESTER_B_ID = 2; // Michael Brown
const CATEGORY_HARDWARE_ID = 2;
const RELATED_SYSTEM_LAPTOP_ID = 7;

describe("GET /api/tickets/:id (Ticket Detail)", () => {
  it("retrieves an owned ticket with category, related system, and attachment metadata", async () => {
    // 1. Create a ticket for Requester A
    const postRes = await request(app)
      .post("/api/tickets")
      .set("X-Dev-Requester-Id", String(REQUESTER_A_ID))
      .field("categoryId", String(CATEGORY_HARDWARE_ID))
      .field("relatedSystemId", String(RELATED_SYSTEM_LAPTOP_ID))
      .field("summary", "Tracked battery issue for detail view")
      .field("description", "A sufficiently long description for testing detail retrieval accurately.")
      .field("requestedPriority", "HIGH");

    expect(postRes.status).toBe(201);
    const createdId = postRes.body.id;

    // 2. Fetch ticket detail as Requester A (owner)
    const getRes = await request(app)
      .get(`/api/tickets/${createdId}`)
      .set("X-Dev-Requester-Id", String(REQUESTER_A_ID));

    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(createdId);
    expect(getRes.body.ticketNumber).toBe(postRes.body.ticketNumber);
    expect(getRes.body.categoryName).toBe("Hardware");
    expect(getRes.body.relatedSystemName).toBe("Corporate Laptop");
    expect(getRes.body.requesterName).toBe("Jennifer Anderson");
    expect(getRes.body.summary).toBe("Tracked battery issue for detail view");
    expect(getRes.body.description).toBe("A sufficiently long description for testing detail retrieval accurately.");
    expect(getRes.body.requestedPriority).toBe("HIGH");
    expect(getRes.body.currentStatus).toBe("NEW");
    expect(Array.isArray(getRes.body.attachments)).toBe(true);
  });

  it("returns 404 when requester attempts to access another requester's ticket (API-09, AC-03, AC-20)", async () => {
    // Create ticket as Requester A
    const postRes = await request(app)
      .post("/api/tickets")
      .set("X-Dev-Requester-Id", String(REQUESTER_A_ID))
      .field("categoryId", String(CATEGORY_HARDWARE_ID))
      .field("relatedSystemId", String(RELATED_SYSTEM_LAPTOP_ID))
      .field("summary", "Private ticket for Requester A")
      .field("description", "A sufficiently long description for testing cross-requester protection.")
      .field("requestedPriority", "MEDIUM");

    expect(postRes.status).toBe(201);
    const createdId = postRes.body.id;

    // Attempt access as Requester B
    const getRes = await request(app)
      .get(`/api/tickets/${createdId}`)
      .set("X-Dev-Requester-Id", String(REQUESTER_B_ID));

    expect(getRes.status).toBe(404);
    expect(getRes.body.error.code).toBe("NOT_FOUND");
    expect(getRes.body.summary).toBeUndefined();
    expect(getRes.body.ticketNumber).toBeUndefined();
  });

  it("returns 404 for a nonexistent ticket ID", async () => {
    const res = await request(app)
      .get("/api/tickets/99999999")
      .set("X-Dev-Requester-Id", String(REQUESTER_A_ID));

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("rejects a request with no X-Dev-Requester-Id header", async () => {
    const res = await request(app).get("/api/tickets/1");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INACTIVE_OR_UNKNOWN_REQUESTER");
  });
});
