import { Router, type Response } from "express";
import { getPrisma } from "../prisma.js";
import { requireAuth, requirePasswordChangeCompleted, requireRole, type AuthenticatedRequest } from "../middleware/auth.js";

export const commentsRouter = Router();

// GET /api/tickets/:id/comments
// Access: Requester (owned tickets), IT_STAFF, ADMINISTRATOR (all tickets)
commentsRouter.get(
  "/api/tickets/:id/comments",
  requireAuth,
  requirePasswordChangeCompleted,
  async (req: AuthenticatedRequest, res: Response) => {
    const ticketId = Number(req.params.id);
    if (Number.isNaN(ticketId)) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found." } });
    }

    try {
      const prisma = getPrisma();
      const user = req.user!;

      if (user.role === "REQUESTER") {
        const ticket = await prisma.ticket.findFirst({
          where: { id: ticketId, requesterId: user.id },
        });
        if (!ticket) {
          return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found." } });
        }
      } else {
        const ticket = await prisma.ticket.findUnique({
          where: { id: ticketId },
        });
        if (!ticket) {
          return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found." } });
        }
      }

      const comments = await prisma.comment.findMany({
        where: { ticketId },
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      return res.status(200).json(comments);
    } catch (err) {
      console.error("Error fetching comments:", err);
      return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Unable to retrieve comments." } });
    }
  }
);

// POST /api/tickets/:id/comments
// Access: Requester (owned tickets), IT_STAFF, ADMINISTRATOR (all tickets)
commentsRouter.post(
  "/api/tickets/:id/comments",
  requireAuth,
  requirePasswordChangeCompleted,
  async (req: AuthenticatedRequest, res: Response) => {
    const ticketId = Number(req.params.id);
    if (Number.isNaN(ticketId)) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found." } });
    }

    const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
    if (!content || content.length > 2000) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Comment content must be between 1 and 2000 characters and cannot be empty.",
        },
      });
    }

    try {
      const prisma = getPrisma();
      const user = req.user!;

      if (user.role === "REQUESTER") {
        const ticket = await prisma.ticket.findFirst({
          where: { id: ticketId, requesterId: user.id },
        });
        if (!ticket) {
          return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found." } });
        }
      } else {
        const ticket = await prisma.ticket.findUnique({
          where: { id: ticketId },
        });
        if (!ticket) {
          return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found." } });
        }
      }

      const comment = await prisma.comment.create({
        data: {
          ticketId,
          authorId: user.id,
          content,
        },
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      return res.status(201).json(comment);
    } catch (err) {
      console.error("Error creating comment:", err);
      return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Unable to create comment." } });
    }
  }
);

// POST /api/tickets/:id/resolve-indicated
// Access: Requester (owned tickets only)
commentsRouter.post(
  "/api/tickets/:id/resolve-indicated",
  requireAuth,
  requirePasswordChangeCompleted,
  async (req: AuthenticatedRequest, res: Response) => {
    const ticketId = Number(req.params.id);
    if (Number.isNaN(ticketId)) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found." } });
    }

    try {
      const prisma = getPrisma();
      const user = req.user!;

      const ticket = await prisma.ticket.findFirst({
        where: { id: ticketId, requesterId: user.id },
      });

      if (!ticket) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found." } });
      }

      if (ticket.currentStatus === "RESOLVED" || ticket.currentStatus === "CLOSED") {
        return res.status(400).json({
          error: {
            code: "BAD_REQUEST",
            message: "Ticket is already resolved or closed.",
          },
        });
      }

      const updatedTicket = await prisma.$transaction(async (tx) => {
        const updated = await tx.ticket.update({
          where: { id: ticketId },
          data: { isProblemResolvedIndicated: true },
        });

        await tx.comment.create({
          data: {
            ticketId,
            authorId: user.id,
            content: "Requester indicated that the problem appears resolved.",
          },
        });

        return updated;
      });

      return res.status(200).json({
        id: updatedTicket.id,
        ticketNumber: updatedTicket.ticketNumber,
        currentStatus: updatedTicket.currentStatus,
        isProblemResolvedIndicated: updatedTicket.isProblemResolvedIndicated,
      });
    } catch (err) {
      console.error("Error indicating problem resolved:", err);
      return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Unable to update ticket." } });
    }
  }
);

// Dual-Channel Notes Guard Endpoints (Staff & Admin strictly)
// GET /api/staff/tickets/:id/notes
commentsRouter.get(
  "/api/staff/tickets/:id/notes",
  requireAuth,
  requirePasswordChangeCompleted,
  requireRole(["IT_STAFF", "ADMINISTRATOR"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const ticketId = Number(req.params.id);
    if (Number.isNaN(ticketId)) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found." } });
    }

    try {
      const prisma = getPrisma();
      const notes = await prisma.internalNote.findMany({
        where: { ticketId },
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      return res.status(200).json(notes);
    } catch (err) {
      console.error("Error fetching notes:", err);
      return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Unable to retrieve internal notes." } });
    }
  }
);

// POST /api/staff/tickets/:id/notes
commentsRouter.post(
  "/api/staff/tickets/:id/notes",
  requireAuth,
  requirePasswordChangeCompleted,
  requireRole(["IT_STAFF", "ADMINISTRATOR"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const ticketId = Number(req.params.id);
    if (Number.isNaN(ticketId)) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found." } });
    }

    const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
    if (!content || content.length > 2000) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Note content must be between 1 and 2000 characters and cannot be empty.",
        },
      });
    }

    try {
      const prisma = getPrisma();
      const user = req.user!;

      const note = await prisma.internalNote.create({
        data: {
          ticketId,
          authorId: user.id,
          content,
        },
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      return res.status(201).json(note);
    } catch (err) {
      console.error("Error creating note:", err);
      return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Unable to create internal note." } });
    }
  }
);
