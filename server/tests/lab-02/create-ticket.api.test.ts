import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

// Seeded reference data from server/prisma/seed.ts (ids are stable because
// the seed is idempotent upsert-by-unique-key).
const ACTIVE_REQUESTER_ID = 1; // Jennifer Anderson
const ACTIVE_CATEGORY_ID = 2; // Hardware
const ACTIVE_RELATED_SYSTEM_ID = 7; // Corporate Laptop

describe("POST /api/tickets", () => {
  it("creates a ticket and returns a formatted ticket number (API-01)", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Dev-Requester-Id", String(ACTIVE_REQUESTER_ID))
      .field("categoryId", String(ACTIVE_CATEGORY_ID))
      .field("relatedSystemId", String(ACTIVE_RELATED_SYSTEM_ID))
      .field("summary", "Laptop battery drains quickly")
      .field(
        "description",
        "My laptop battery drains much faster than usual even when the system is idle."
      )
      .field("requestedPriority", "MEDIUM");

    expect(res.status).toBe(201);
    expect(res.body.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
    expect(res.body.currentStatus).toBe("NEW");
    expect(res.body.requesterId).toBe(ACTIVE_REQUESTER_ID);
    expect(res.body.attachments).toEqual([]);
    expect(res.body.failedAttachments).toEqual([]);
  });

  it("rejects a summary that is too short (API-02)", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Dev-Requester-Id", String(ACTIVE_REQUESTER_ID))
      .field("categoryId", String(ACTIVE_CATEGORY_ID))
      .field("relatedSystemId", String(ACTIVE_RELATED_SYSTEM_ID))
      .field("summary", "Hi")
      .field("description", "This description is long enough to pass validation on its own.")
      .field("requestedPriority", "LOW");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.fields).toHaveProperty("summary");
  });

  it("rejects an unknown categoryId (API-04)", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Dev-Requester-Id", String(ACTIVE_REQUESTER_ID))
      .field("categoryId", "999999")
      .field("relatedSystemId", String(ACTIVE_RELATED_SYSTEM_ID))
      .field("summary", "Valid summary text")
      .field("description", "This description is long enough to pass validation on its own.")
      .field("requestedPriority", "LOW");

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty("categoryId");
  });

  it("rejects a request with no X-Dev-Requester-Id header", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .field("categoryId", String(ACTIVE_CATEGORY_ID))
      .field("relatedSystemId", String(ACTIVE_RELATED_SYSTEM_ID))
      .field("summary", "Valid summary text")
      .field("description", "This description is long enough to pass validation on its own.")
      .field("requestedPriority", "LOW");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INACTIVE_OR_UNKNOWN_REQUESTER");
  });
});