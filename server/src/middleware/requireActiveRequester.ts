import type { NextFunction, Request, Response } from "express";
import { getPrisma } from "../prisma.js";

export interface RequestWithRequester extends Request {
  requester?: { id: number; name: string; email: string };
}

export async function requireActiveRequester(req: RequestWithRequester, res: Response, next: NextFunction) {
  const headerValue = req.header("X-Dev-Requester-Id");
  const requesterId = headerValue ? Number(headerValue) : NaN;
  if (!headerValue || Number.isNaN(requesterId)) {
    return res.status(400).json({ error: { code: "INACTIVE_OR_UNKNOWN_REQUESTER", message: "A valid X-Dev-Requester-Id header is required." } });
  }
  const requester = await getPrisma().devRequester.findUnique({ where: { id: requesterId } });
  if (!requester || !requester.isActive) {
    return res.status(400).json({ error: { code: "INACTIVE_OR_UNKNOWN_REQUESTER", message: "The selected development requester is unknown or inactive." } });
  }
  req.requester = { id: requester.id, name: requester.name, email: requester.email };
  next();
}
