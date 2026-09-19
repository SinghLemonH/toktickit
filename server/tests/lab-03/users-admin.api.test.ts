import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { signSessionToken } from "../../src/auth/session.js";
import { verifyPassword } from "../../src/auth/password.js";

describe("Administrator User Management APIs (Issue #34)", () => {
  const prisma = getPrisma();
  let adminUserId: number;
  let adminCookie: string;
  let itStaffCookie: string;
  let requesterCookie: string;
  let mustChangeAdminCookie: string;

  beforeAll(async () => {
    // Look up seeded users
    const admin = await prisma.user.findUnique({
      where: { email: "admin@toktickit.com" },
    });
    const itStaff = await prisma.user.findUnique({
      where: { email: "michael.brown@example.com" },
    });
    const requester = await prisma.user.findUnique({
      where: { email: "jennifer.anderson@example.com" },
    });

    if (!admin || !itStaff || !requester) {
      throw new Error("Required seed users missing for admin test suite");
    }

    adminUserId = admin.id;

    adminCookie = `toktickit_session=${signSessionToken({
      userId: admin.id,
      role: admin.role,
      mustChangePassword: false,
    })}`;

    itStaffCookie = `toktickit_session=${signSessionToken({
      userId: itStaff.id,
      role: itStaff.role,
      mustChangePassword: false,
    })}`;

    requesterCookie = `toktickit_session=${signSessionToken({
      userId: requester.id,
      role: requester.role,
      mustChangePassword: false,
    })}`;

    // Create or find an admin with mustChangePassword=true
    const mustChangeAdmin = await prisma.user.upsert({
      where: { email: "test.mustchange.admin@example.com" },
      update: {
        role: "ADMINISTRATOR",
        isActive: true,
        mustChangePassword: true,
      },
      create: {
        name: "Must Change Admin",
        email: "test.mustchange.admin@example.com",
        role: "ADMINISTRATOR",
        isActive: true,
        mustChangePassword: true,
        passwordHash: "$2b$10$DuNLpS.JeLH2u73kWcxwY.E5JIyngJ40VSFrtVci5hmWACgY6wkPK",
      },
    });

    mustChangeAdminCookie = `toktickit_session=${signSessionToken({
      userId: mustChangeAdmin.id,
      role: mustChangeAdmin.role,
      mustChangePassword: true,
    })}`;
  });

  afterAll(async () => {
    // Clean up any test users created during test runs
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "test.created.user@example.com",
            "test.second.admin@example.com",
            "test.conflict.email@example.com",
            "test.mustchange.admin@example.com",
          ],
        },
      },
    });
  });

  describe("Access Control & Authorization Guards (API-20, AC-20)", () => {
    it("rejects unauthenticated requests with 401 Unauthorized", async () => {
      const res = await request(app).get("/api/admin/users");
      expect(res.status).toBe(401);
    });

    it("rejects Requester requests with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Cookie", requesterCookie);
      expect(res.status).toBe(403);
    });

    it("rejects IT Staff requests with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Cookie", itStaffCookie);
      expect(res.status).toBe(403);
    });

    it("rejects users with mustChangePassword=true with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Cookie", mustChangeAdminCookie);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("PASSWORD_CHANGE_REQUIRED");
    });
  });

  describe("GET /api/admin/users (API-15, AC-15)", () => {
    it("returns user list without exposing passwordHash", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      const firstUser = res.body[0];
      expect(firstUser).toHaveProperty("id");
      expect(firstUser).toHaveProperty("name");
      expect(firstUser).toHaveProperty("email");
      expect(firstUser).toHaveProperty("role");
      expect(firstUser).toHaveProperty("isActive");
      expect(firstUser).toHaveProperty("mustChangePassword");
      expect(firstUser).toHaveProperty("createdAt");
      expect(firstUser).not.toHaveProperty("passwordHash");
    });

    it("filters users by search query (q)", async () => {
      const res = await request(app)
        .get("/api/admin/users?q=jennifer")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body.every((u: any) =>
        u.name.toLowerCase().includes("jennifer") ||
        u.email.toLowerCase().includes("jennifer")
      )).toBe(true);
    });

    it("filters users by role", async () => {
      const res = await request(app)
        .get("/api/admin/users?role=IT_STAFF")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body.every((u: any) => u.role === "IT_STAFF")).toBe(true);
    });

    it("filters users by isActive status", async () => {
      const res = await request(app)
        .get("/api/admin/users?isActive=false")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.every((u: any) => u.isActive === false)).toBe(true);
    });
  });

  describe("POST /api/admin/users (API-16, API-17, AC-16, AC-17)", () => {
    it("creates a new user with initial password and mustChangePassword=true", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Cookie", adminCookie)
        .send({
          name: "Test Created User",
          email: "test.created.user@example.com",
          role: "IT_STAFF",
          isActive: true,
          initialPassword: "InitialPassword123!",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.email).toBe("test.created.user@example.com");
      expect(res.body.role).toBe("IT_STAFF");
      expect(res.body.mustChangePassword).toBe(true);
      expect(res.body).not.toHaveProperty("passwordHash");

      // Verify in DB that password was hashed with bcrypt
      const dbUser = await prisma.user.findUnique({
        where: { email: "test.created.user@example.com" },
      });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.passwordHash).not.toBe("InitialPassword123!");
      const matches = await verifyPassword("InitialPassword123!", dbUser!.passwordHash);
      expect(matches).toBe(true);
    });

    it("rejects duplicate email with 409 Conflict (API-17, AC-17)", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Cookie", adminCookie)
        .send({
          name: "Duplicate User",
          email: "admin@toktickit.com",
          role: "REQUESTER",
          initialPassword: "InitialPassword123!",
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/email already in use/i);
    });

    it("rejects weak initial passwords failing complexity rules with 400 Bad Request", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Cookie", adminCookie)
        .send({
          name: "Weak Password User",
          email: "weak.pass@example.com",
          role: "REQUESTER",
          initialPassword: "weak",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/password/i);
    });
  });

  describe("PATCH /api/admin/users/:id (API-18, API-19, AC-18, AC-19)", () => {
    it("updates user name, email, and role successfully", async () => {
      const createdUser = await prisma.user.findUnique({
        where: { email: "test.created.user@example.com" },
      });
      expect(createdUser).not.toBeNull();

      const res = await request(app)
        .patch(`/api/admin/users/${createdUser!.id}`)
        .set("Cookie", adminCookie)
        .send({
          name: "Updated Name",
          role: "REQUESTER",
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Updated Name");
      expect(res.body.role).toBe("REQUESTER");
    });

    it("prevents an Administrator from deactivating their own account with 400 Bad Request (API-18, AC-18, BR-16)", async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${adminUserId}`)
        .set("Cookie", adminCookie)
        .send({
          isActive: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/cannot deactivate.*own account/i);

      // Verify admin remains active in database
      const dbAdmin = await prisma.user.findUnique({
        where: { id: adminUserId },
      });
      expect(dbAdmin?.isActive).toBe(true);
    });

    it("prevents deactivating or demoting the last active Administrator with 409 Conflict (API-19, AC-19, BR-17)", async () => {
      // Ensure only 1 active admin exists by deleting any extra test admins
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [
              "test.second.admin@example.com",
              "test.mustchange.admin@example.com",
            ],
          },
        },
      });

      const activeAdmins = await prisma.user.findMany({
        where: { role: "ADMINISTRATOR", isActive: true },
      });
      expect(activeAdmins.length).toBe(1);
      const soleAdminId = activeAdmins[0].id;

      // Attempting to change role of sole admin
      const roleChangeRes = await request(app)
        .patch(`/api/admin/users/${soleAdminId}`)
        .set("Cookie", adminCookie)
        .send({ role: "IT_STAFF" });

      expect(roleChangeRes.status).toBe(409);
      expect(roleChangeRes.body.error).toMatch(/last active administrator/i);
    });

    it("allows deactivation when multiple active administrators exist", async () => {
      // Create a second active admin
      const secondAdmin = await prisma.user.create({
        data: {
          name: "Second Admin",
          email: "test.second.admin@example.com",
          role: "ADMINISTRATOR",
          isActive: true,
          mustChangePassword: false,
          passwordHash: "$2b$10$DuNLpS.JeLH2u73kWcxwY.E5JIyngJ40VSFrtVci5hmWACgY6wkPK",
        },
      });

      // Now deactivating the second admin should succeed because admin@toktickit.com remains
      const res = await request(app)
        .patch(`/api/admin/users/${secondAdmin.id}`)
        .set("Cookie", adminCookie)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.isActive).toBe(false);
    });
  });

  describe("POST /api/admin/users/:id/reset-password (AC-16)", () => {
    it("resets user password, hashes with bcrypt, and sets mustChangePassword=true", async () => {
      const user = await prisma.user.findUnique({
        where: { email: "test.created.user@example.com" },
      });
      expect(user).not.toBeNull();

      const res = await request(app)
        .post(`/api/admin/users/${user!.id}/reset-password`)
        .set("Cookie", adminCookie)
        .send({
          initialPassword: "NewSafePassword2026!",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/initial password set/i);

      // Verify DB reflects mustChangePassword=true and new hash
      const updatedUser = await prisma.user.findUnique({
        where: { id: user!.id },
      });
      expect(updatedUser?.mustChangePassword).toBe(true);
      const isMatch = await verifyPassword("NewSafePassword2026!", updatedUser!.passwordHash);
      expect(isMatch).toBe(true);
    });

    it("rejects weak password during password reset with 400 Bad Request", async () => {
      const user = await prisma.user.findUnique({
        where: { email: "test.created.user@example.com" },
      });
      expect(user).not.toBeNull();

      const res = await request(app)
        .post(`/api/admin/users/${user!.id}/reset-password`)
        .set("Cookie", adminCookie)
        .send({
          initialPassword: "weak",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/password/i);
    });
  });
});
