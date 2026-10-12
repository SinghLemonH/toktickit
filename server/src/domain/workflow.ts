import type { TicketStatus } from "@prisma/client";

export const STAFF_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  NEW: ["OPEN", "IN_PROGRESS", "CANCELLED"],
  OPEN: ["IN_PROGRESS", "WAITING_FOR_REQUESTER", "CANCELLED"],
  IN_PROGRESS: ["WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  WAITING_FOR_REQUESTER: ["IN_PROGRESS", "RESOLVED", "CANCELLED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["IN_PROGRESS", "CANCELLED"],
  CANCELLED: [],
  PENDING: ["OPEN", "CANCELLED"],
};

export const REQUESTER_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  NEW: [],
  OPEN: [],
  IN_PROGRESS: [],
  WAITING_FOR_REQUESTER: [],
  RESOLVED: ["REOPENED"],
  CLOSED: ["REOPENED"],
  REOPENED: [],
  CANCELLED: [],
  PENDING: [],
};

export function getAllowedTransitions(
  currentStatus: TicketStatus,
  role: string,
  isOwner: boolean
): TicketStatus[] {
  if (role === "IT_STAFF" || role === "ADMINISTRATOR") {
    return STAFF_TRANSITIONS[currentStatus] || [];
  }
  if (role === "REQUESTER" && isOwner) {
    return REQUESTER_TRANSITIONS[currentStatus] || [];
  }
  return [];
}

export function isTransitionAllowed(
  currentStatus: TicketStatus,
  nextStatus: TicketStatus,
  role: string,
  isOwner: boolean
): boolean {
  const allowed = getAllowedTransitions(currentStatus, role, isOwner);
  return allowed.includes(nextStatus);
}
