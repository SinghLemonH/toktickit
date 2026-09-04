import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

const REQUESTER_A = 1; // Jennifer Anderson
const REQUESTER_B = 2; // Michael Brown
const CATEGORY_ID = 2;
const RELATED_SYSTEM_ID = 7;

async function createTicket(requesterId: number, summary: string) {
  return request(app)
    .post("/api/tickets")
    .set("X-Dev-Requester-Id", String(requesterId))
    .field("categoryId", String(CATEGORY_ID))
    .field("relatedSystemId", String(RELATED_SYSTEM_ID))
    .field("summary", summary)
    .field("description", "This description is long enough to pass validation on its own.")
    .field("requestedPriority", "MEDIUM");
}

describe("GET /api/tickets", () => {
  beforeAll(async () => {
    // Seed a few tickets for Requester A and one for Requester B so ownership
    // scoping (API-09) has something real to isolate.
    await createTicket(REQUESTER_A, "My Tickets search target alpha");
    await createTicket(REQUESTER_A, "My Tickets search target beta");
    await createTicket(REQUESTER_B, "Ticket belonging to requester B only");
  });

  it("only returns tickets owned by the requesting Requester (API-09)", async () => {
    const res = await request(app).get("/api/tickets").set("X-Dev-Requester-Id", String(REQUESTER_A));
    expect(res.status).toBe(200);
    const summaries = res.body.items.map((t: { summary: string }) => t.summary);
    expect(summaries).not.toContain("Ticket belonging to requester B only");
  });

  it("filters by search text on summary (API-12/BR-12)", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .query({ search: "search target alpha" })
      .set("X-Dev-Requester-Id", String(REQUESTER_A));
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(
      res.body.items.every((t: { summary: string }) => t.summary.includes("search target alpha"))
    ).toBe(true);
  });

  it("returns an empty result (not an error) for a page beyond the last page (BR-16)", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .query({ page: 999, pageSize: 10 })
      .set("X-Dev-Requester-Id", String(REQUESTER_A));
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.page).toBe(999);
  });

  it("falls back to the default page size for an out-of-range pageSize (BR-15)", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .query({ pageSize: 999 })
      .set("X-Dev-Requester-Id", String(REQUESTER_A));
    expect(res.status).toBe(200);
    expect(res.body.pageSize).toBe(10);
  });

  it("returns no-results (empty array) rather than an error for a search match of nothing", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .query({ search: "zzz-no-such-ticket-zzz" })
      .set("X-Dev-Requester-Id", String(REQUESTER_A));
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });
});