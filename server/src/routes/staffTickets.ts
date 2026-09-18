import { Router, type Response } from "express";
import type { Prisma, Priority, TicketStatus } from "@prisma/client";
import { getPrisma } from "../prisma.js";
import {
  requireAuth,
  requirePasswordChangeCompleted,
  requireRole,
  type AuthenticatedRequest,
} from "../middleware/auth.js";

export const staffTicketsRouter = Router();

const STAFF_ROLES = ["IT_STAFF", "ADMINISTRATOR"] as const;
const VALID_SORT_FIELDS = [
  "createdAt",
  "updatedAt",
  "ticketNumber",
  "requestedPriority",
  "itPriority",
  "currentStatus",
];

// Permitted status transition matrix adhering to BR-15 & legacy PENDING continuity
const ALLOWED_TRANSITIONS: Record<string, TicketStatus[]> = {
  NEW: ["OPEN", "CANCELLED"],
  OPEN: ["IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  IN_PROGRESS: ["WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  WAITING_FOR_REQUESTER: ["IN_PROGRESS", "RESOLVED", "CANCELLED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["IN_PROGRESS", "RESOLVED", "CANCELLED"],
  CANCELLED: [],
  PENDING: ["IN_PROGRESS", "RESOLVED", "CANCELLED"],
};

// GET /api/staff/tickets
// Shared Ticket Queue with search, multi-faceted filtering, sorting, and pagination
staffTicketsRouter.get(
  "/api/staff/tickets",
  requireAuth,
  requirePasswordChangeCompleted,
  requireRole([...STAFF_ROLES]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const prisma = getPrisma();

      const search =
        typeof req.query.search === "string"
          ? req.query.search.trim()
          : typeof req.query.q === "string"
          ? req.query.q.trim()
          : "";

      const status = req.query.status as TicketStatus | undefined;
      const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
      const requestedPriority = req.query.requestedPriority as Priority | undefined;
      const itPriority = req.query.itPriority as Priority | undefined;
      const assignedTo = req.query.assignedTo as string | undefined;

      const page = Math.max(1, Number(req.query.page) || 1);
      const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 10));

      const rawSortBy = req.query.sortBy as string;
      const sortBy = VALID_SORT_FIELDS.includes(rawSortBy) ? rawSortBy : "createdAt";

      const rawSortOrder = (req.query.sortOrder || req.query.sortDir) as string;
      const sortOrder: Prisma.SortOrder = rawSortOrder === "asc" ? "asc" : "desc";

      const where: Prisma.TicketWhereInput = {};

      if (status) {
        where.currentStatus = status;
      }

      if (categoryId && !Number.isNaN(categoryId)) {
        where.categoryId = categoryId;
      }

      if (requestedPriority && ["LOW", "MEDIUM", "HIGH"].includes(requestedPriority)) {
        where.requestedPriority = requestedPriority;
      }

      if (itPriority && ["LOW", "MEDIUM", "HIGH"].includes(itPriority)) {
        where.itPriority = itPriority;
      }

      if (assignedTo) {
        if (assignedTo === "unassigned" || assignedTo === "none") {
          where.assignedToId = null;
        } else if (assignedTo === "me") {
          where.assignedToId = req.user!.id;
        } else if (!Number.isNaN(Number(assignedTo))) {
          where.assignedToId = Number(assignedTo);
        }
      }

      if (search) {
        where.OR = [
          { ticketNumber: { contains: search, mode: "insensitive" } },
          { summary: { contains: search, mode: "insensitive" } },
        ];
      }

      const [total, tickets] = await Promise.all([
        prisma.ticket.count({ where }),
        prisma.ticket.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            category: { select: { id: true, name: true } },
            requester: { select: { id: true, name: true, email: true } },
            assignedTo: { select: { id: true, name: true, email: true, role: true } },
          },
        }),
      ]);

      const totalPages = Math.max(1, Math.ceil(total / pageSize));

      return res.status(200).json({
        tickets,
        data: tickets,
        pagination: {
          totalItems: total,
          total,
          totalPages,
          currentPage: page,
          page,
          pageSize,
        },
      });
    } catch (err) {
      console.error("Error retrieving staff ticket queue:", err);
      return res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Unable to retrieve ticket queue." },
      });
    }
  }
);

// GET /api/staff/users
// Returns active IT Staff and Administrators for ticket reassignment
staffTicketsRouter.get(
  "/api/staff/users",
  requireAuth,
  requirePasswordChangeCompleted,
  requireRole([...STAFF_ROLES]),
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const prisma = getPrisma();
      const staffUsers = await prisma.user.findMany({
        where: {
          isActive: true,
          role: { in: [...STAFF_ROLES] },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
        orderBy: { name: "asc" },
      });

      return res.status(200).json(staffUsers);
    } catch (err) {
      console.error("Error retrieving staff users:", err);
      return res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Unable to retrieve staff users." },
      });
    }
  }
);

// PATCH /api/staff/tickets/:id/assign
// Claims or reassigns ownership of a ticket
staffTicketsRouter.patch(
  "/api/staff/tickets/:id/assign",
  requireAuth,
  requirePasswordChangeCompleted,
  requireRole([...STAFF_ROLES]),
  async (req: AuthenticatedRequest, res: Response) => {
    const ticketId = Number(req.params.id);
    if (Number.isNaN(ticketId)) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Ticket not found." },
      });
    }

    const { assignedToId } = req.body;

    try {
      const prisma = getPrisma();

      const existingTicket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!existingTicket) {
        return res.status(404).json({
          error: { code: "NOT_FOUND", message: "Ticket not found." },
        });
      }

      // If assigning to a user, validate user eligibility
      if (assignedToId !== null && assignedToId !== undefined) {
        const targetUser = await prisma.user.findUnique({
          where: { id: Number(assignedToId) },
        });

        if (
          !targetUser ||
          !targetUser.isActive ||
          !["IT_STAFF", "ADMINISTRATOR"].includes(targetUser.role)
        ) {
          return res.status(400).json({
            error: {
              code: "VALIDATION_ERROR",
              message: "Assignee must be an active IT Staff or Administrator.",
            },
          });
        }
      }

      const updatedTicket = await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          assignedToId: assignedToId === null || assignedToId === undefined ? null : Number(assignedToId),
        },
        include: {
          category: { select: { id: true, name: true } },
          requester: { select: { id: true, name: true, email: true } },
          assignedTo: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      return res.status(200).json(updatedTicket);
    } catch (err) {
      console.error("Error assigning ticket:", err);
      return res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Unable to assign ticket." },
      });
    }
  }
);

// PATCH /api/staff/tickets/:id/priority
// Updates the operational IT Priority
staffTicketsRouter.patch(
  "/api/staff/tickets/:id/priority",
  requireAuth,
  requirePasswordChangeCompleted,
  requireRole([...STAFF_ROLES]),
  async (req: AuthenticatedRequest, res: Response) => {
    const ticketId = Number(req.params.id);
    if (Number.isNaN(ticketId)) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Ticket not found." },
      });
    }

    const { itPriority } = req.body;
    if (!itPriority || !["LOW", "MEDIUM", "HIGH"].includes(itPriority)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "IT Priority must be LOW, MEDIUM, or HIGH.",
        },
      });
    }

    try {
      const prisma = getPrisma();

      const existingTicket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!existingTicket) {
        return res.status(404).json({
          error: { code: "NOT_FOUND", message: "Ticket not found." },
        });
      }

      const updatedTicket = await prisma.ticket.update({
        where: { id: ticketId },
        data: { itPriority: itPriority as Priority },
        include: {
          category: { select: { id: true, name: true } },
          requester: { select: { id: true, name: true, email: true } },
          assignedTo: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      return res.status(200).json(updatedTicket);
    } catch (err) {
      console.error("Error updating IT Priority:", err);
      return res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Unable to update IT Priority." },
      });
    }
  }
);

// PATCH /api/staff/tickets/:id/status
// Updates ticket status according to permitted state transitions (BR-15)
staffTicketsRouter.patch(
  "/api/staff/tickets/:id/status",
  requireAuth,
  requirePasswordChangeCompleted,
  requireRole([...STAFF_ROLES]),
  async (req: AuthenticatedRequest, res: Response) => {
    const ticketId = Number(req.params.id);
    if (Number.isNaN(ticketId)) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Ticket not found." },
      });
    }

    const { status: nextStatus } = req.body;
    if (!nextStatus || typeof nextStatus !== "string") {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Valid status string is required." },
      });
    }

    try {
      const prisma = getPrisma();

      const existingTicket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!existingTicket) {
        return res.status(404).json({
          error: { code: "NOT_FOUND", message: "Ticket not found." },
        });
      }

      const current = existingTicket.currentStatus;

      // If already at target status, return cleanly
      if (current === nextStatus) {
        return res.status(200).json(existingTicket);
      }

      // Check transition validity
      const allowed = ALLOWED_TRANSITIONS[current] || [];
      if (!allowed.includes(nextStatus as TicketStatus)) {
        return res.status(400).json({
          error: {
            code: "INVALID_STATUS_TRANSITION",
            message: `Transition from ${current} to ${nextStatus} is not permitted.`,
          },
        });
      }

      const updatedTicket = await prisma.ticket.update({
        where: { id: ticketId },
        data: { currentStatus: nextStatus as TicketStatus },
        include: {
          category: { select: { id: true, name: true } },
          requester: { select: { id: true, name: true, email: true } },
          assignedTo: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      return res.status(200).json(updatedTicket);
    } catch (err) {
      console.error("Error updating ticket status:", err);
      return res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Unable to update ticket status." },
      });
    }
  }
);
