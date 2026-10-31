import { Router, type Response } from "express";
import type { Prisma, Priority, TicketStatus } from "@prisma/client";
import { getPrisma } from "../prisma.js";
import {
  requireAuth,
  requirePasswordChangeCompleted,
  requireRole,
  type AuthenticatedRequest,
} from "../middleware/auth.js";
import { isTransitionAllowed, getAllowedTransitions } from "../domain/workflow.js";
import { evaluateResolutionGate } from "../domain/resolutionGate.js";

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

      const rawStatus = (req.query.currentStatus || req.query.status) as string | undefined;
      const statusGroup = req.query.statusGroup as string | undefined;
      const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
      const requestedPriority = req.query.requestedPriority as Priority | undefined;
      const itPriorityRaw = req.query.itPriority as string | undefined;
      const assignedTo = req.query.assignedTo as string | undefined;

      const page = Math.max(1, Number(req.query.page) || 1);
      const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 10));

      const rawSortBy = req.query.sortBy as string;
      const sortBy = VALID_SORT_FIELDS.includes(rawSortBy) ? rawSortBy : "createdAt";

      const rawSortOrder = (req.query.sortOrder || req.query.sortDir) as string;
      const sortOrder: Prisma.SortOrder = rawSortOrder === "asc" ? "asc" : "desc";

      const where: Prisma.TicketWhereInput = {};

      const ACTIVE_STATUSES: TicketStatus[] = [
        "NEW",
        "OPEN",
        "IN_PROGRESS",
        "WAITING_FOR_REQUESTER",
        "REOPENED",
        "PENDING",
      ];

      if (rawStatus && statusGroup === "active") {
        if (ACTIVE_STATUSES.includes(rawStatus as TicketStatus)) {
          where.currentStatus = rawStatus as TicketStatus;
        } else {
          where.currentStatus = { in: [] };
        }
      } else if (rawStatus) {
        where.currentStatus = rawStatus as TicketStatus;
      } else if (statusGroup === "active") {
        where.currentStatus = { in: ACTIVE_STATUSES };
      }

      if (categoryId && !Number.isNaN(categoryId)) {
        where.categoryId = categoryId;
      }

      if (requestedPriority && ["LOW", "MEDIUM", "HIGH"].includes(requestedPriority)) {
        where.requestedPriority = requestedPriority;
      }

      if (itPriorityRaw === "none") {
        where.itPriority = null;
      } else if (itPriorityRaw && ["LOW", "MEDIUM", "HIGH"].includes(itPriorityRaw)) {
        where.itPriority = itPriorityRaw as Priority;
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
        total,
        totalItems: total,
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

    const { assignedToId, expectedVersion } = req.body;

    if (expectedVersion === undefined || expectedVersion === null || !Number.isInteger(expectedVersion)) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "expectedVersion must be an integer." },
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

      // BR-18: Guard against bypassing owner requirements
      if (
        existingTicket.currentStatus === "RESOLVED" ||
        existingTicket.currentStatus === "CLOSED" ||
        existingTicket.currentStatus === "CANCELLED"
      ) {
        return res.status(400).json({
          error: {
            code: "TICKET_LOCKED",
            message: `Cannot reassign owner on ticket in ${existingTicket.currentStatus} status.`,
          },
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

      const targetAssigneeId =
        assignedToId === null || assignedToId === undefined ? null : Number(assignedToId);

      const result = await prisma.$transaction(async (tx) => {
        const updateResult = await tx.ticket.updateMany({
          where: {
            id: ticketId,
            version: expectedVersion,
          },
          data: {
            assignedToId: targetAssigneeId,
            version: { increment: 1 },
          },
        });

        if (updateResult.count === 0) {
          return null;
        }

        return tx.ticket.findUnique({
          where: { id: ticketId },
          include: {
            category: { select: { id: true, name: true } },
            requester: { select: { id: true, name: true, email: true } },
            assignedTo: { select: { id: true, name: true, email: true, role: true } },
          },
        });
      });

      if (!result) {
        return res.status(409).json({
          error: {
            code: "STALE_UPDATE",
            message: "Ticket was modified by another operation. Refresh and retry.",
          },
        });
      }

      return res.status(200).json(result);
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
// Updates ticket status according to permitted state transitions and Resolution Gate (BR-11, BR-12, BR-16, BR-17)
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

    const { status: nextStatus, expectedVersion } = req.body;
    if (!nextStatus || typeof nextStatus !== "string") {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Valid status string is required." },
      });
    }

    if (expectedVersion === undefined || expectedVersion === null || !Number.isInteger(expectedVersion)) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "expectedVersion must be an integer." },
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

      // Check transition validity using domain matrix
      const callerRole = req.user!.role;
      if (!isTransitionAllowed(current, nextStatus as TicketStatus, callerRole, false)) {
        return res.status(400).json({
          error: {
            code: "INVALID_STATUS_TRANSITION",
            message: `Transition from ${current} to ${nextStatus} is not permitted.`,
          },
        });
      }

      // Resolution Gate Evaluation (BR-11) when transitioning to RESOLVED
      if (nextStatus === "RESOLVED") {
        const actions = await prisma.actionTaken.findMany({
          where: { ticketId },
          select: { status: true },
        });

        const gateResult = evaluateResolutionGate(
          { assignedToId: existingTicket.assignedToId },
          actions
        );

        if (!gateResult.ok) {
          return res.status(400).json({
            error: {
              code: "RESOLUTION_GATE_NOT_MET",
              message: "Resolution gate criteria not satisfied",
              reasons: gateResult.reasons,
            },
          });
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        const updateResult = await tx.ticket.updateMany({
          where: {
            id: ticketId,
            version: expectedVersion,
          },
          data: {
            currentStatus: nextStatus as TicketStatus,
            version: { increment: 1 },
          },
        });

        if (updateResult.count === 0) {
          return null;
        }

        await tx.ticketStatusHistory.create({
          data: {
            ticketId,
            fromStatus: current,
            toStatus: nextStatus as TicketStatus,
            changedById: req.user!.id,
            reason: null,
          },
        });

        return tx.ticket.findUnique({
          where: { id: ticketId },
          include: {
            category: { select: { id: true, name: true } },
            requester: { select: { id: true, name: true, email: true } },
            assignedTo: { select: { id: true, name: true, email: true, role: true } },
          },
        });
      });

      if (!result) {
        return res.status(409).json({
          error: {
            code: "STALE_UPDATE",
            message: "Ticket was modified by another operation. Refresh and retry.",
          },
        });
      }

      const allowedTransitions = getAllowedTransitions(result.currentStatus, callerRole, false);

      return res.status(200).json({
        ...result,
        allowedTransitions,
      });
    } catch (err) {
      console.error("Error updating ticket status:", err);
      return res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Unable to update ticket status." },
      });
    }
  }
);
