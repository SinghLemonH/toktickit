import { describe, it, expect } from "vitest";
import { getPrisma } from "../../src/prisma.js";

describe("Database Evolution & Seed Verification (Issue #30)", () => {
  const prisma = getPrisma();

  describe("Schema Invariants & Models", () => {
    it("has User model with expected fields and types", async () => {
      const users = await prisma.user.findMany({ take: 1 });
      expect(Array.isArray(users)).toBe(true);
      if (users.length > 0) {
        const u = users[0];
        expect(u).toHaveProperty("id");
        expect(u).toHaveProperty("email");
        expect(u).toHaveProperty("name");
        expect(u).toHaveProperty("passwordHash");
        expect(u).toHaveProperty("role");
        expect(u).toHaveProperty("isActive");
        expect(u).toHaveProperty("mustChangePassword");
      }
    });

    it("has Comment and InternalNote models linked to Ticket and User", async () => {
      const comments = await prisma.comment.findMany({ take: 1 });
      expect(Array.isArray(comments)).toBe(true);
      const notes = await prisma.internalNote.findMany({ take: 1 });
      expect(Array.isArray(notes)).toBe(true);
    });

    it("has Ticket model updated with assignedTo and resolution flag", async () => {
      const tickets = await prisma.ticket.findMany({ take: 1 });
      expect(Array.isArray(tickets)).toBe(true);
      if (tickets.length > 0) {
        const t = tickets[0];
        expect(t).toHaveProperty("assignedToId");
        expect(t).toHaveProperty("isProblemResolvedIndicated");
        expect(t).toHaveProperty("itPriority");
      }
    });
  });

  describe("Seed Data Invariants (Section 7.3)", () => {
    it("seeds at least 4 active Requesters and 1 inactive Requester", async () => {
      const activeRequesters = await prisma.user.findMany({
        where: { role: "REQUESTER", isActive: true },
      });
      expect(activeRequesters.length).toBeGreaterThanOrEqual(4);

      const inactiveRequesters = await prisma.user.findMany({
        where: { role: "REQUESTER", isActive: false },
      });
      expect(inactiveRequesters.length).toBeGreaterThanOrEqual(1);
    });

    it("seeds at least 3 active IT Staff and 1 inactive IT Staff", async () => {
      const activeStaff = await prisma.user.findMany({
        where: { role: "IT_STAFF", isActive: true },
      });
      expect(activeStaff.length).toBeGreaterThanOrEqual(3);

      const inactiveStaff = await prisma.user.findMany({
        where: { role: "IT_STAFF", isActive: false },
      });
      expect(inactiveStaff.length).toBeGreaterThanOrEqual(1);
    });

    it("seeds at least 1 active Administrator with email admin@toktickit.com", async () => {
      const admin = await prisma.user.findUnique({
        where: { email: "admin@toktickit.com" },
      });
      expect(admin).not.toBeNull();
      expect(admin?.role).toBe("ADMINISTRATOR");
      expect(admin?.isActive).toBe(true);
    });

    it("hashes all user passwords with bcrypt ($2a$ or $2b$ prefix)", async () => {
      const users = await prisma.user.findMany();
      expect(users.length).toBeGreaterThan(0);
      for (const user of users) {
        expect(user.passwordHash).toMatch(/^\$2[ab]\$\d{2}\$[./A-Za-z0-9]{53}$/);
      }
    });

    it("seeds realistic tickets, public comments, and staff internal notes", async () => {
      const ticketCount = await prisma.ticket.count();
      expect(ticketCount).toBeGreaterThanOrEqual(4);

      const commentsCount = await prisma.comment.count();
      expect(commentsCount).toBeGreaterThanOrEqual(1);

      const notesCount = await prisma.internalNote.count();
      expect(notesCount).toBeGreaterThanOrEqual(1);
    });

    it("retains synchronized DevRequester records for Lab 2 backward compatibility", async () => {
      const devRequesters = await prisma.devRequester.findMany();
      expect(devRequesters.length).toBeGreaterThanOrEqual(1);
      const jennifer = await prisma.devRequester.findUnique({
        where: { email: "jennifer.anderson@example.com" },
      });
      expect(jennifer).not.toBeNull();
      expect(jennifer?.id).toBe(1);
    });
  });
});
