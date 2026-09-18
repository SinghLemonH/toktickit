import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import {
  requireAuth,
  requirePasswordChangeCompleted,
  requireRole,
} from "../middleware/auth.js";
import {
  validatePasswordComplexity,
  hashPassword,
} from "../auth/password.js";
import type { Role } from "@prisma/client";

export const adminUsersRouter = Router();

// Apply administrative middleware guards to all endpoints
adminUsersRouter.use(requireAuth);
adminUsersRouter.use(requirePasswordChangeCompleted);
adminUsersRouter.use(requireRole("ADMINISTRATOR"));

/**
 * GET /api/admin/users
 * Lists users with optional filters: q (search name/email), role, and isActive.
 */
adminUsersRouter.get("/", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const { q, role, isActive } = req.query;

    const where: any = {};

    if (typeof q === "string" && q.trim()) {
      const searchTerm = q.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    if (typeof role === "string" && role.trim()) {
      where.role = role.trim() as Role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { id: "asc" },
    });

    return res.status(200).json(users);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to retrieve user list." });
  }
});

/**
 * POST /api/admin/users
 * Creates a new user account with initial password (mustChangePassword=true).
 */
adminUsersRouter.post("/", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const { name, email, role, isActive, initialPassword } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Name is required." });
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ error: "Email is required." });
    }

    const validRoles: Role[] = ["REQUESTER", "IT_STAFF", "ADMINISTRATOR"];
    const targetRole: Role = validRoles.includes(role) ? role : "REQUESTER";

    if (!initialPassword || typeof initialPassword !== "string") {
      return res.status(400).json({ error: "Initial password is required." });
    }

    // Validate password complexity rules (BR-03)
    const complexity = validatePasswordComplexity(initialPassword);
    if (!complexity.isValid) {
      return res.status(400).json({ error: complexity.errors.join(" ") });
    }

    // Check duplicate email (case-insensitive) (BR-05)
    const existing = await prisma.user.findFirst({
      where: {
        email: {
          equals: email.trim(),
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      return res.status(409).json({ error: "Email already in use." });
    }

    // Hash password with bcrypt salt factor 10 (BR-04)
    const passwordHash = await hashPassword(initialPassword);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: targetRole,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        mustChangePassword: true,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json(newUser);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to create user account." });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Updates user account with safety guards (BR-16 self-deactivation, BR-17 last admin).
 */
adminUsersRouter.patch("/:id", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID." });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found." });
    }

    const { name, email, role, isActive } = req.body;

    // Self-Deactivation Guard (BR-16)
    if (req.user?.id === userId && isActive === false) {
      return res.status(400).json({
        error: "Administrators cannot deactivate their own account.",
      });
    }

    // Last Active Administrator Guard (BR-17)
    const isCurrentlyActiveAdmin =
      existingUser.role === "ADMINISTRATOR" && existingUser.isActive === true;

    const willDeactivateAdmin =
      isCurrentlyActiveAdmin && isActive === false;

    const willDemoteAdminRole =
      isCurrentlyActiveAdmin && role !== undefined && role !== "ADMINISTRATOR";

    if (willDeactivateAdmin || willDemoteAdminRole) {
      const activeAdminCount = await prisma.user.count({
        where: {
          role: "ADMINISTRATOR",
          isActive: true,
        },
      });

      if (activeAdminCount <= 1) {
        return res.status(409).json({
          error: "Cannot deactivate or demote the last active Administrator.",
        });
      }
    }

    // Duplicate email check if updating email
    if (email && typeof email === "string" && email.trim().toLowerCase() !== existingUser.email.toLowerCase()) {
      const duplicate = await prisma.user.findFirst({
        where: {
          email: { equals: email.trim(), mode: "insensitive" },
          id: { not: userId },
        },
      });

      if (duplicate) {
        return res.status(409).json({ error: "Email already in use." });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: typeof name === "string" && name.trim() ? name.trim() : undefined,
        email: typeof email === "string" && email.trim() ? email.trim().toLowerCase() : undefined,
        role: role !== undefined ? role : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json(updatedUser);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to update user account." });
  }
});

/**
 * POST /api/admin/users/:id/reset-password
 * Resets user password, hashes with bcrypt, and sets mustChangePassword=true.
 */
adminUsersRouter.post("/:id/reset-password", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID." });
    }

    const { initialPassword } = req.body;

    if (!initialPassword || typeof initialPassword !== "string") {
      return res.status(400).json({ error: "Initial password is required." });
    }

    // Validate password complexity rules (BR-03)
    const complexity = validatePasswordComplexity(initialPassword);
    if (!complexity.isValid) {
      return res.status(400).json({ error: complexity.errors.join(" ") });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Hash new initial password
    const passwordHash = await hashPassword(initialPassword);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
    });

    return res.status(200).json({
      message: "Initial password set successfully; user must change it upon next login.",
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to reset user password." });
  }
});
