import type { ActionStatus } from "@prisma/client";

export interface ResolutionGateTicket {
  assignedToId: number | null;
}

export interface ResolutionGateAction {
  status: ActionStatus;
}

export interface ResolutionGateResult {
  ok: boolean;
  reasons: string[];
}

export function evaluateResolutionGate(
  ticket: ResolutionGateTicket,
  actions: ResolutionGateAction[]
): ResolutionGateResult {
  const reasons: string[] = [];

  if (!ticket.assignedToId) {
    reasons.push("A Ticket Owner must be assigned before resolving");
  }

  const completedCount = actions.filter((a) => a.status === "COMPLETED").length;
  if (completedCount === 0) {
    reasons.push("At least one Completed Action Taken is required");
  }

  const plannedCount = actions.filter((a) => a.status === "PLANNED").length;
  if (plannedCount > 0) {
    reasons.push("All Planned Actions Taken must be completed or cancelled before resolving");
  }

  return {
    ok: reasons.length === 0,
    reasons,
  };
}
