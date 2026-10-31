import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { signSessionToken } from "../../src/auth/session.js";

describe("Performance Smoke Tests (Sprint 4: Issue #49)", () => {
  const prisma = getPrisma();

  let staffSarahCookie: string;
  let requesterJenniferCookie: string;

  beforeAll(async () => {
    const sarah = await prisma.user.findUniqueOrThrow({
      where: { email: "sarah.johnson@example.com" },
    });
    const jennifer = await prisma.user.findUniqueOrThrow({
      where: { email: "jennifer.anderson@example.com" },
    });

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

    // Ensure database contains at least 12 tickets (BR-26 seed dataset)
    const ticketCount = await prisma.ticket.count();
    expect(ticketCount).toBeGreaterThanOrEqual(12);
  });

  // PERF-01: Dashboard endpoint latency budget
  it("PERF-01: verifies dashboard response time is within the 500ms latency budget (BR-21)", async () => {
    // 1. Warm-up pass to eliminate initial JIT or module cache overhead
    await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", requesterJenniferCookie);

    await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", staffSarahCookie);

    // 2. Measure Requester Dashboard latency over 5 iterations
    const requesterLatencies: number[] = [];
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      const res = await request(app)
        .get("/api/dashboard/requester")
        .set("Cookie", requesterJenniferCookie);
      const elapsed = performance.now() - start;
      expect(res.status).toBe(200);
      requesterLatencies.push(elapsed);
    }

    requesterLatencies.sort((a, b) => a - b);
    const requesterMedian = requesterLatencies[Math.floor(requesterLatencies.length / 2)];

    // 3. Measure Staff Dashboard latency over 5 iterations
    const staffLatencies: number[] = [];
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      const res = await request(app)
        .get("/api/dashboard/staff")
        .set("Cookie", staffSarahCookie);
      const elapsed = performance.now() - start;
      expect(res.status).toBe(200);
      staffLatencies.push(elapsed);
    }

    staffLatencies.sort((a, b) => a - b);
    const staffMedian = staffLatencies[Math.floor(staffLatencies.length / 2)];

    console.log(
      `[PERF-01] Requester Dashboard median latency: ${requesterMedian.toFixed(2)}ms (samples: ${requesterLatencies.map((n) => n.toFixed(1)).join(", ")})`
    );
    console.log(
      `[PERF-01] Staff Dashboard median latency: ${staffMedian.toFixed(2)}ms (samples: ${staffLatencies.map((n) => n.toFixed(1)).join(", ")})`
    );

    // 4. Assert both medians fall within the 500ms latency budget
    expect(requesterMedian).toBeLessThan(500);
    expect(staffMedian).toBeLessThan(500);
  });
});
