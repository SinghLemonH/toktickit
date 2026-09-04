import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("GET /api/dev-requesters", () => {
  it("returns only active development requesters", async () => {
    const res = await request(app).get("/api/dev-requesters");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    for (const requester of res.body) {
      expect(requester).toHaveProperty("id");
      expect(requester).toHaveProperty("name");
      expect(requester).toHaveProperty("email");
    }

    const names = res.body.map((r: { name: string }) => r.name);
    expect(names).not.toContain("Inactive Test User");
  });
});