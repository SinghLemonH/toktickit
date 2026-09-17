import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { hashPassword } from "../../src/auth/password.js";

describe("Authentication & Password Change APIs (Issue #31)", () => {
  const activeRequesterEmail = "jennifer.anderson@example.com";
  const inactiveRequesterEmail = "kevin.patel@example.com";
  const mustChangeRequesterEmail = "david.lee@example.com";
  const validPassword = "Password123!";

  beforeEach(async () => {
    const prisma = getPrisma();
    const defaultHash = await hashPassword(validPassword);

    await prisma.user.updateMany({
      where: { email: activeRequesterEmail },
      data: {
        passwordHash: defaultHash,
        mustChangePassword: false,
        isActive: true,
      },
    });

    await prisma.user.updateMany({
      where: { email: mustChangeRequesterEmail },
      data: {
        passwordHash: defaultHash,
        mustChangePassword: true,
        isActive: true,
      },
    });
  });

  describe("POST /api/auth/login", () => {
    it("authenticates valid credentials and sets toktickit_session cookie (API-01, AC-01)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: activeRequesterEmail, password: validPassword });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("user");
      expect(res.body.user.email).toBe(activeRequesterEmail);
      expect(res.body.user.role).toBe("REQUESTER");
      expect(res.body.user).not.toHaveProperty("passwordHash");

      // Verify Set-Cookie header
      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const sessionCookie = (cookies as string[]).find((c) => c.startsWith("toktickit_session="));
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie).toContain("HttpOnly");
      expect(sessionCookie).toContain("Path=/");
    });

    it("rejects inactive accounts with generic 401 without account leakage (API-02, AC-02)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: inactiveRequesterEmail, password: validPassword });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
      expect(res.body.error.message).toBe("Invalid email or password");
      expect(res.headers["set-cookie"]).toBeUndefined();
    });

    it("rejects non-existent users with 401 (API-03, AC-03)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "unknown@toktickit.com", password: validPassword });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
      expect(res.body.error.message).toBe("Invalid email or password");
    });

    it("rejects incorrect passwords with 401 (API-03, AC-03)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: activeRequesterEmail, password: "WrongPassword999!" });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
      expect(res.body.error.message).toBe("Invalid email or password");
    });

    it("rejects missing email or password with 400 validation error", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "", password: "" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns 401 Unauthorized when unauthenticated", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns authenticated user profile when valid session cookie is provided", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: activeRequesterEmail, password: validPassword });

      const cookie = loginRes.headers["set-cookie"];

      const meRes = await request(app)
        .get("/api/auth/me")
        .set("Cookie", cookie);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user.email).toBe(activeRequesterEmail);
      expect(meRes.body.user.role).toBe("REQUESTER");
    });
  });

  describe("Mandatory Password Change Guards (API-04, AC-04)", () => {
    it("restricts access to protected routes when mustChangePassword is true", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: mustChangeRequesterEmail, password: validPassword });

      expect(loginRes.body.user.mustChangePassword).toBe(true);
      const cookie = loginRes.headers["set-cookie"];

      // Accessing a normal protected route should return 403
      const protectedRes = await request(app)
        .get("/api/tickets")
        .set("Cookie", cookie);

      expect(protectedRes.status).toBe(403);
      expect(protectedRes.body.error.code).toBe("PASSWORD_CHANGE_REQUIRED");
    });
  });

  describe("POST /api/auth/change-password", () => {
    it("rejects weak new passwords failing complexity rules (API-05, AC-05)", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: activeRequesterEmail, password: validPassword });

      const cookie = loginRes.headers["set-cookie"];

      // Too short (less than 8 chars)
      const resShort = await request(app)
        .post("/api/auth/change-password")
        .set("Cookie", cookie)
        .send({ currentPassword: validPassword, newPassword: "Short1!" });

      expect(resShort.status).toBe(400);
      expect(resShort.body.error.code).toBe("VALIDATION_ERROR");

      // Missing special character
      const resNoSpecial = await request(app)
        .post("/api/auth/change-password")
        .set("Cookie", cookie)
        .send({ currentPassword: validPassword, newPassword: "NoSpecial1234" });

      expect(resNoSpecial.status).toBe(400);
      expect(resNoSpecial.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects incorrect current password with 401", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: activeRequesterEmail, password: validPassword });

      const cookie = loginRes.headers["set-cookie"];

      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Cookie", cookie)
        .send({
          currentPassword: "IncorrectPassword123!",
          newPassword: "BrandNewSecurePassword2026!",
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("successfully changes password, sets mustChangePassword to false, and refreshes cookie", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: mustChangeRequesterEmail, password: validPassword });

      const cookie = loginRes.headers["set-cookie"];
      const newPassword = "BrandNewValidPass2026!";

      const changeRes = await request(app)
        .post("/api/auth/change-password")
        .set("Cookie", cookie)
        .send({
          currentPassword: validPassword,
          newPassword,
        });

      expect(changeRes.status).toBe(200);
      expect(changeRes.body.user.mustChangePassword).toBe(false);
      expect(changeRes.headers["set-cookie"]).toBeDefined();

      const newCookie = changeRes.headers["set-cookie"];

      // Verify me endpoint now shows mustChangePassword: false
      const meRes = await request(app)
        .get("/api/auth/me")
        .set("Cookie", newCookie);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user.mustChangePassword).toBe(false);

      // Verify user can now log in with the new password
      const newLoginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: mustChangeRequesterEmail, password: newPassword });

      expect(newLoginRes.status).toBe(200);
      expect(newLoginRes.body.user.mustChangePassword).toBe(false);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("terminates the session and clears session cookie (API-06, AC-06)", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: activeRequesterEmail, password: validPassword });

      const cookie = loginRes.headers["set-cookie"];

      const logoutRes = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", cookie);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.message).toBe("Logged out successfully");

      // Verify cookie is cleared
      const logoutCookies = logoutRes.headers["set-cookie"];
      expect(logoutCookies).toBeDefined();
      const clearedCookie = (logoutCookies as string[]).find((c) =>
        c.startsWith("toktickit_session=")
      );
      expect(clearedCookie).toBeDefined();

      // Subsequent access without cookie returns 401
      const meRes = await request(app).get("/api/auth/me");
      expect(meRes.status).toBe(401);
    });
  });
});
