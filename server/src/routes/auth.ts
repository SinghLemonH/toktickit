import { Router, type Response } from "express";
import { getPrisma } from "../prisma.js";
import {
  validatePasswordComplexity,
  hashPassword,
  verifyPassword,
} from "../auth/password.js";
import { signSessionToken } from "../auth/session.js";
import { setSessionCookie, clearSessionCookie } from "../auth/cookie.js";
import { requireAuth, type RequestWithUser } from "../middleware/auth.js";

export const authRouter = Router();

// POST /api/auth/login
authRouter.post("/login", async (req: RequestWithUser, res: Response): Promise<void> => {
  const { email, password } = req.body || {};

  if (!email || typeof email !== "string" || !password || typeof password !== "string") {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Email and password are required",
      },
    });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const prisma = getPrisma();
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: "insensitive",
        },
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        },
      });
      return;
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        },
      });
      return;
    }

    const token = signSessionToken({
      userId: user.id,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    });

    setSessionCookie(res, token);

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred during login",
      },
    });
  }
});

// POST /api/auth/logout
authRouter.post("/logout", (_req: RequestWithUser, res: Response): void => {
  clearSessionCookie(res);
  res.status(200).json({
    message: "Logged out successfully",
  });
});

// GET /api/auth/me
authRouter.get("/me", requireAuth, (req: RequestWithUser, res: Response): void => {
  res.status(200).json({
    user: req.user,
  });
});

// POST /api/auth/change-password
authRouter.post(
  "/change-password",
  requireAuth,
  async (req: RequestWithUser, res: Response): Promise<void> => {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Current password and new password are required",
        },
      });
      return;
    }

    const complexity = validatePasswordComplexity(newPassword);
    if (!complexity.isValid) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Password does not meet complexity requirements",
          details: complexity.errors,
        },
      });
      return;
    }

    try {
      const prisma = getPrisma();
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });

      if (!user) {
        res.status(401).json({
          error: {
            code: "UNAUTHORIZED",
            message: "User account not found",
          },
        });
        return;
      }

      const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isCurrentValid) {
        res.status(401).json({
          error: {
            code: "UNAUTHORIZED",
            message: "Current password is incorrect",
          },
        });
        return;
      }

      const newPasswordHash = await hashPassword(newPassword);

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
          mustChangePassword: false,
        },
      });

      // Refresh the session cookie with updated mustChangePassword status
      const refreshedToken = signSessionToken({
        userId: updatedUser.id,
        role: updatedUser.role,
        mustChangePassword: false,
      });

      setSessionCookie(res, refreshedToken);

      res.status(200).json({
        message: "Password changed successfully",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          mustChangePassword: false,
        },
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while changing password",
        },
      });
    }
  }
);
