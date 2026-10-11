import type { ActionStatus } from "@prisma/client";

export interface CreateActionBody {
  actionAt?: string;
  description: string;
  result?: string;
  status?: ActionStatus;
  followUpRequired?: boolean;
  followUpNote?: string | null;
  attachmentNotes?: string | null;
  assigneeId?: number;
  clientRequestId?: string;
}

export interface UpdateActionBody {
  expectedVersion: number;
  actionAt?: string;
  description?: string;
  result?: string;
  status?: ActionStatus;
  followUpRequired?: boolean;
  followUpNote?: string | null;
  attachmentNotes?: string | null;
  assigneeId?: number;
}

export interface ActionValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  cleaned?: {
    actionAt: Date;
    description: string;
    result: string | null;
    status: ActionStatus;
    followUpRequired: boolean;
    followUpNote: string | null;
    attachmentNotes: string | null;
    assigneeId?: number;
    clientRequestId?: string;
  };
}

export function validateCreateAction(
  body: any,
  ticketCreatedAt: Date
): ActionValidationResult {
  const errors: Record<string, string> = {};

  // 1. Description
  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (!description || description.length < 1 || description.length > 2000) {
    errors.description = "Description is required (1-2000 characters).";
  }

  // 2. Status (defaults to PLANNED)
  let status: ActionStatus = "PLANNED";
  if (body.status !== undefined) {
    if (body.status === "PLANNED" || body.status === "COMPLETED") {
      status = body.status;
    } else {
      errors.status = "Status must be either PLANNED or COMPLETED.";
    }
  }

  // 3. Result
  const rawResult = typeof body.result === "string" ? body.result.trim() : "";
  let result: string | null = rawResult.length > 0 ? rawResult : null;
  if (status === "COMPLETED") {
    if (!result || result.length < 1 || result.length > 2000) {
      errors.result = "Result is required when status is COMPLETED (1-2000 characters).";
    }
  } else if (result && result.length > 2000) {
    errors.result = "Result cannot exceed 2000 characters.";
  }

  // 4. Follow Up
  const followUpRequired = Boolean(body.followUpRequired);
  let followUpNote: string | null = null;
  if (followUpRequired) {
    const rawNote = typeof body.followUpNote === "string" ? body.followUpNote.trim() : "";
    if (!rawNote || rawNote.length < 1 || rawNote.length > 1000) {
      errors.followUpNote = "Follow-up note is required when follow-up is checked (1-1000 characters).";
    } else {
      followUpNote = rawNote;
    }
  }

  // 5. Attachment Notes
  let attachmentNotes: string | null = null;
  if (body.attachmentNotes !== undefined && body.attachmentNotes !== null) {
    const rawAtt = typeof body.attachmentNotes === "string" ? body.attachmentNotes.trim() : "";
    if (rawAtt.length > 1000) {
      errors.attachmentNotes = "Attachment notes cannot exceed 1000 characters.";
    } else {
      attachmentNotes = rawAtt.length > 0 ? rawAtt : null;
    }
  }

  // 6. Action Date & Timestamp constraints (BR-08)
  const now = new Date();
  let actionAt = now;
  if (body.actionAt) {
    const parsed = new Date(body.actionAt);
    if (Number.isNaN(parsed.getTime())) {
      errors.actionAt = "Invalid ISO date string.";
    } else {
      actionAt = parsed;
    }
  }

  if (status === "COMPLETED" && !errors.actionAt) {
    // Cannot precede ticket createdAt at minute precision
    const actionAtMinutes = Math.floor(actionAt.getTime() / 60000);
    const ticketCreatedMinutes = Math.floor(ticketCreatedAt.getTime() / 60000);
    if (actionAtMinutes < ticketCreatedMinutes) {
      errors.actionAt = "Action date cannot precede ticket creation date.";
    }
    // Cannot exceed current time by more than 5 minutes
    if (actionAt.getTime() > now.getTime() + 5 * 60 * 1000) {
      errors.actionAt = "Completed action date cannot be in the future by more than 5 minutes.";
    }
  }

  // 7. Assignee Id
  let assigneeId: number | undefined;
  if (body.assigneeId !== undefined && body.assigneeId !== null) {
    const parsedId = Number(body.assigneeId);
    if (Number.isNaN(parsedId) || parsedId < 1) {
      errors.assigneeId = "Invalid assignee ID.";
    } else {
      assigneeId = parsedId;
    }
  }

  // 8. Client Request ID (for idempotency)
  let clientRequestId: string | undefined;
  if (body.clientRequestId) {
    clientRequestId = String(body.clientRequestId).trim();
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    cleaned: {
      actionAt,
      description,
      result,
      status,
      followUpRequired,
      followUpNote,
      attachmentNotes,
      assigneeId,
      clientRequestId,
    },
  };
}
