import { Router, type Response } from "express";
import { getPrisma } from "../prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";
import { validateCreateAction } from "../validation/actionsValidation.js";
import type { ActionStatus } from "@prisma/client";

const router = Router();
const STAFF_ROLES = ["IT_STAFF", "ADMINISTRATOR"];

const ACTION_INCLUDE = {
  performedBy: { select: { id: true, name: true } },
  assignee: { select: { id: true, name: true } },
  completedBy: { select: { id: true, name: true } },
} as const;

// ----------------------------------------------------------------------------
// GET /api/tickets/:id/actions (Unified Role-Aware Guard)
// ----------------------------------------------------------------------------
router.get(
  "/tickets/:id/actions",
  requireAuth,
  async (req: AuthedRequest, res: Response) => {
    const ticketId = Number(req.params.id);
    if (Number.isNaN(ticketId)) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Ticket not found." },
      });
    }

    try {
      const prisma = getPrisma();
      const user = req.user!;
      const isStaffOrAdmin = user.role === "IT_STAFF" || user.role === "ADMINISTRATOR";

      // Requesters can only access their own tickets; other tickets return 404 for information protection
      const ticket = await prisma.ticket.findFirst({
        where: isStaffOrAdmin
          ? { id: ticketId }
          : { id: ticketId, requesterId: user.id },
      });

      if (!ticket) {
        return res.status(404).json({
          error: { code: "NOT_FOUND", message: "Ticket not found." },
        });
      }

      const actions = await prisma.actionTaken.findMany({
        where: { ticketId },
        orderBy: [{ actionAt: "asc" }, { id: "asc" }],
        include: ACTION_INCLUDE,
      });

      return res.status(200).json(actions);
    } catch (error) {
      console.error("Failed to fetch actions:", error);
      return res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch actions." },
      });
    }
  }
);

// ----------------------------------------------------------------------------
// POST /api/staff/tickets/:id/actions
// ----------------------------------------------------------------------------
router.post(
  "/staff/tickets/:id/actions",
  requireAuth,
  requireRole(STAFF_ROLES),
  async (req: AuthedRequest, res: Response) => {
    const ticketId = Number(req.params.id);
    if (Number.isNaN(ticketId)) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Ticket not found." },
      });
    }

    try {
      const prisma = getPrisma();
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        return res.status(404).json({
          error: { code: "NOT_FOUND", message: "Ticket not found." },
        });
      }

      // BR-10: Ticket Lock Check
      if (ticket.currentStatus === "CLOSED" || ticket.currentStatus === "CANCELLED") {
        return res.status(400).json({
          error: {
            code: "TICKET_LOCKED",
            message: "Actions cannot be added to closed or cancelled tickets.",
          },
        });
      }

      const requestedStatus: ActionStatus = req.body.status || "PLANNED";
      if (requestedStatus === "PLANNED" && ticket.currentStatus === "RESOLVED") {
        return res.status(400).json({
          error: {
            code: "TICKET_LOCKED",
            message: "Cannot add a planned action to a resolved ticket.",
          },
        });
      }

      // Idempotent replay check via clientRequestId (BR-04, AC-19)
      if (req.body.clientRequestId) {
        const clientRequestId = String(req.body.clientRequestId).trim();
        const existing = await prisma.actionTaken.findUnique({
          where: {
            ticketId_clientRequestId: {
              ticketId,
              clientRequestId,
            },
          },
          include: ACTION_INCLUDE,
        });

        if (existing) {
          return res.status(200).json(existing);
        }
      }

      // Input validation
      const validation = validateCreateAction(req.body, ticket.createdAt);
      if (!validation.valid || !validation.cleaned) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Action input validation failed.",
            fields: validation.errors,
          },
        });
      }

      const { cleaned } = validation;

      // Assignee validation: must be an active IT Staff or Administrator
      let assigneeId = req.user!.id;
      if (cleaned.assigneeId !== undefined) {
        const assigneeUser = await prisma.user.findUnique({
          where: { id: cleaned.assigneeId },
        });

        if (
          !assigneeUser ||
          !assigneeUser.isActive ||
          (assigneeUser.role !== "IT_STAFF" && assigneeUser.role !== "ADMINISTRATOR")
        ) {
          return res.status(400).json({
            error: {
              code: "VALIDATION_ERROR",
              message: "Assignee must be an active IT Staff or Administrator.",
              fields: {
                assigneeId: "Assignee must be an active IT Staff or Administrator.",
              },
            },
          });
        }
        assigneeId = assigneeUser.id;
      }

      const completedById = cleaned.status === "COMPLETED" ? req.user!.id : null;

      // Execute creation and touch ticket updatedAt in transaction
      const action = await prisma.$transaction(async (tx) => {
        const created = await tx.actionTaken.create({
          data: {
            ticketId,
            actionAt: cleaned.actionAt,
            description: cleaned.description,
            result: cleaned.result,
            status: cleaned.status,
            followUpRequired: cleaned.followUpRequired,
            followUpNote: cleaned.followUpNote,
            attachmentNotes: cleaned.attachmentNotes,
            performedById: req.user!.id,
            assigneeId,
            completedById,
            version: 0,
            clientRequestId: cleaned.clientRequestId ?? null,
          },
          include: ACTION_INCLUDE,
        });

        await tx.ticket.update({
          where: { id: ticketId },
          data: { updatedAt: new Date() },
        });

        return created;
      });

      return res.status(201).json(action);
    } catch (error) {
      console.error("Failed to create action:", error);
      return res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to create action." },
      });
    }
  }
);

// ----------------------------------------------------------------------------
// PATCH /api/staff/tickets/:id/actions/:actionId
// ----------------------------------------------------------------------------
router.patch(
  "/staff/tickets/:id/actions/:actionId",
  requireAuth,
  requireRole(STAFF_ROLES),
  async (req: AuthedRequest, res: Response) => {
    const ticketId = Number(req.params.id);
    const actionId = Number(req.params.actionId);

    if (Number.isNaN(ticketId) || Number.isNaN(actionId)) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Ticket or Action Taken not found." },
      });
    }

    try {
      const prisma = getPrisma();
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        return res.status(404).json({
          error: { code: "NOT_FOUND", message: "Ticket not found." },
        });
      }

      const existingAction = await prisma.actionTaken.findFirst({
        where: { id: actionId, ticketId },
      });

      if (!existingAction) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Action Taken not found for this ticket.",
          },
        });
      }

      // BR-10: Ticket Lock Check
      if (ticket.currentStatus === "CLOSED" || ticket.currentStatus === "CANCELLED") {
        return res.status(400).json({
          error: {
            code: "TICKET_LOCKED",
            message: "Actions cannot be modified on closed or cancelled tickets.",
          },
        });
      }

      // BR-09: Immutability check on Completed or Cancelled actions
      if (
        existingAction.status === "COMPLETED" ||
        existingAction.status === "CANCELLED"
      ) {
        return res.status(400).json({
          error: {
            code: "ACTION_IMMUTABLE",
            message: "Completed or cancelled actions cannot be modified.",
          },
        });
      }

      // BR-17: Optimistic Concurrency Check
      if (
        req.body.expectedVersion === undefined ||
        typeof req.body.expectedVersion !== "number"
      ) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "expectedVersion is required.",
            fields: { expectedVersion: "expectedVersion is required." },
          },
        });
      }

      if (existingAction.version !== req.body.expectedVersion) {
        return res.status(409).json({
          error: {
            code: "STALE_UPDATE",
            message:
              "Action record has been modified concurrently. Please refresh and retry.",
          },
        });
      }

      const errors: Record<string, string> = {};

      // Status transition validation
      let targetStatus: ActionStatus = existingAction.status;
      if (req.body.status !== undefined) {
        if (
          req.body.status === "PLANNED" ||
          req.body.status === "COMPLETED" ||
          req.body.status === "CANCELLED"
        ) {
          targetStatus = req.body.status;
        } else {
          errors.status = "Status must be PLANNED, COMPLETED, or CANCELLED.";
        }
      }

      // Description validation
      let description = existingAction.description;
      if (req.body.description !== undefined) {
        const rawDesc = typeof req.body.description === "string" ? req.body.description.trim() : "";
        if (!rawDesc || rawDesc.length < 1 || rawDesc.length > 2000) {
          errors.description = "Description is required (1-2000 characters).";
        } else {
          description = rawDesc;
        }
      }

      // Result validation
      let result = existingAction.result;
      if (targetStatus === "COMPLETED") {
        const candidateResult =
          req.body.result !== undefined
            ? (typeof req.body.result === "string" ? req.body.result.trim() : "")
            : (existingAction.result || "");

        if (!candidateResult || candidateResult.length < 1 || candidateResult.length > 2000) {
          errors.result = "Result is required when status is COMPLETED (1-2000 characters).";
        } else {
          result = candidateResult;
        }
      } else if (req.body.result !== undefined) {
        const rawRes = typeof req.body.result === "string" ? req.body.result.trim() : "";
        result = rawRes.length > 0 ? rawRes : null;
      }

      // Follow-up validation
      let followUpRequired = existingAction.followUpRequired;
      if (req.body.followUpRequired !== undefined) {
        followUpRequired = Boolean(req.body.followUpRequired);
      }

      let followUpNote = existingAction.followUpNote;
      if (followUpRequired) {
        const candidateNote =
          req.body.followUpNote !== undefined
            ? (typeof req.body.followUpNote === "string" ? req.body.followUpNote.trim() : "")
            : (existingAction.followUpNote || "");

        if (!candidateNote || candidateNote.length < 1 || candidateNote.length > 1000) {
          errors.followUpNote = "Follow-up note is required when follow-up is checked (1-1000 characters).";
        } else {
          followUpNote = candidateNote;
        }
      } else {
        followUpNote = null;
      }

      // Attachment Notes validation
      let attachmentNotes = existingAction.attachmentNotes;
      if (req.body.attachmentNotes !== undefined) {
        if (req.body.attachmentNotes === null) {
          attachmentNotes = null;
        } else {
          const rawAtt = typeof req.body.attachmentNotes === "string" ? req.body.attachmentNotes.trim() : "";
          if (rawAtt.length > 1000) {
            errors.attachmentNotes = "Attachment notes cannot exceed 1000 characters.";
          } else {
            attachmentNotes = rawAtt.length > 0 ? rawAtt : null;
          }
        }
      }

      // Assignee validation
      let assigneeId = existingAction.assigneeId;
      if (req.body.assigneeId !== undefined) {
        if (req.body.assigneeId === null) {
          assigneeId = null;
        } else {
          const parsedAssignee = Number(req.body.assigneeId);
          if (Number.isNaN(parsedAssignee) || parsedAssignee < 1) {
            errors.assigneeId = "Invalid assignee ID.";
          } else {
            const assigneeUser = await prisma.user.findUnique({
              where: { id: parsedAssignee },
            });
            if (
              !assigneeUser ||
              !assigneeUser.isActive ||
              (assigneeUser.role !== "IT_STAFF" && assigneeUser.role !== "ADMINISTRATOR")
            ) {
              errors.assigneeId = "Assignee must be an active IT Staff or Administrator.";
            } else {
              assigneeId = assigneeUser.id;
            }
          }
        }
      }

      // Action date validation (BR-08, API-17)
      const now = new Date();
      let actionAt = existingAction.actionAt;

      if (targetStatus === "COMPLETED") {
        if (req.body.actionAt !== undefined && req.body.actionAt !== null) {
          const parsedDate = new Date(req.body.actionAt);
          if (Number.isNaN(parsedDate.getTime())) {
            errors.actionAt = "Invalid ISO date string.";
          } else {
            actionAt = parsedDate;
          }
        } else if (existingAction.status === "PLANNED") {
          // Rule API-17: Completing planned action without actionAt resets automatically to current timestamp
          actionAt = now;
        }

        if (!errors.actionAt) {
          const actionAtMinutes = Math.floor(actionAt.getTime() / 60000);
          const ticketCreatedMinutes = Math.floor(ticket.createdAt.getTime() / 60000);
          if (actionAtMinutes < ticketCreatedMinutes) {
            errors.actionAt = "Action date cannot precede ticket creation date.";
          }
          if (actionAt.getTime() > now.getTime() + 5 * 60 * 1000) {
            errors.actionAt = "Completed action date cannot be in the future by more than 5 minutes.";
          }
        }
      } else if (req.body.actionAt !== undefined && req.body.actionAt !== null) {
        const parsedDate = new Date(req.body.actionAt);
        if (Number.isNaN(parsedDate.getTime())) {
          errors.actionAt = "Invalid ISO date string.";
        } else {
          actionAt = parsedDate;
        }
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Action update validation failed.",
            fields: errors,
          },
        });
      }

      // Determine completedById
      const completedById =
        targetStatus === "COMPLETED"
          ? req.user!.id
          : targetStatus === "CANCELLED"
          ? null
          : existingAction.completedById;

      // Atomic update with version increment
      const updated = await prisma.$transaction(async (tx) => {
        const action = await tx.actionTaken.update({
          where: { id: actionId },
          data: {
            description,
            result,
            status: targetStatus,
            followUpRequired,
            followUpNote,
            attachmentNotes,
            assigneeId,
            completedById,
            actionAt,
            version: existingAction.version + 1,
          },
          include: ACTION_INCLUDE,
        });

        await tx.ticket.update({
          where: { id: ticketId },
          data: { updatedAt: new Date() },
        });

        return action;
      });

      return res.status(200).json(updated);
    } catch (error) {
      console.error("Failed to update action:", error);
      return res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to update action." },
      });
    }
  }
);

export default router;
