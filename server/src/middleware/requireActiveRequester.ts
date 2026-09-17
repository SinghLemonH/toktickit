import type { NextFunction, Response } from "express";
import { getPrisma } from "../prisma.js";
import type { RequestWithUser } from "./auth.js";

export interface RequestWithRequester extends RequestWithUser {
  requester?: { id: number; name: string; email: string };
}

export async function requireActiveRequester(
  req: RequestWithRequester,
  res: Response,
  next: NextFunction
): Promise<void> {
  // If authenticated via Lab 3 session cookie
  if (req.user) {
    if (req.user.mustChangePassword) {
      res.status(403).json({
        error: {
          code: "PASSWORD_CHANGE_REQUIRED",
          message: "You must change your temporary initial password before proceeding",
        },
      });
      return;
    }

    req.requester = {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
    };
    next();
    return;
  }

  // Fallback to Lab 2 development requester header
  const headerValue = req.header("X-Dev-Requester-Id");
  const requesterId = headerValue ? Number(headerValue) : NaN;
  if (!headerValue || Number.isNaN(requesterId)) {
    res.status(400).json({
      error: {
        code: "INACTIVE_OR_UNKNOWN_REQUESTER",
        message: "A valid X-Dev-Requester-Id header is required.",
      },
    });
    return;
  }

  const requester = await getPrisma().devRequester.findUnique({
    where: { id: requesterId },
  });

  if (!requester || !requester.isActive) {
    res.status(400).json({
      error: {
        code: "INACTIVE_OR_UNKNOWN_REQUESTER",
        message: "The selected development requester is unknown or inactive.",
      },
    });
    return;
  }

  req.requester = {
    id: requester.id,
    name: requester.name,
    email: requester.email,
  };
  next();
}
