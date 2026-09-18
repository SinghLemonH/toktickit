import type { Request, Response, NextFunction } from "express";
import { getPrisma } from "../prisma.js";
import { verifySessionToken } from "../auth/session.js";
import { SESSION_COOKIE_NAME } from "../auth/cookie.js";

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
}

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

export async function authenticate(
  req: RequestWithUser,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token) {
    return next();
  }

  const payload = verifySessionToken(token);
  if (!payload) {
    return next();
  }

  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
      },
    });

    if (user && user.isActive) {
      req.user = user;
    }
  } catch (error) {
    console.error("Authentication middleware error:", error);
  }

  next();
}

export function requireAuth(
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
    return;
  }
  next();
}

export function requirePasswordChangeCompleted(
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): void {
  if (req.user && req.user.mustChangePassword) {
    res.status(403).json({
      error: {
        code: "PASSWORD_CHANGE_REQUIRED",
        message: "You must change your temporary initial password before proceeding",
      },
    });
    return;
  }
  next();
}

export function requireRole(...allowedRoles: (string | string[])[]) {
  const roles = allowedRoles.flat();
  return (req: RequestWithUser, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Access forbidden for your role",
        },
      });
      return;
    }

    next();
  };
}
