import { describe, it, expect } from "vitest";
import { isTransitionAllowed, getAllowedTransitions } from "../../src/domain/workflow.js";
import type { TicketStatus } from "@prisma/client";

describe("Status Transitions Domain Evaluation (UNIT-01, BR-12, BR-13)", () => {
  describe("Staff Transitions", () => {
    it("allows NEW -> OPEN, IN_PROGRESS, CANCELLED", () => {
      expect(getAllowedTransitions("NEW", "IT_STAFF", false)).toEqual([
        "OPEN", "IN_PROGRESS", "CANCELLED"
      ]);
      expect(isTransitionAllowed("NEW", "OPEN", "IT_STAFF", false)).toBe(true);
      expect(isTransitionAllowed("NEW", "RESOLVED", "IT_STAFF", false)).toBe(false);
    });

    it("allows OPEN -> IN_PROGRESS, WAITING_FOR_REQUESTER, CANCELLED", () => {
      expect(getAllowedTransitions("OPEN", "IT_STAFF", false)).toEqual([
        "IN_PROGRESS", "WAITING_FOR_REQUESTER", "CANCELLED"
      ]);
    });

    it("allows IN_PROGRESS -> WAITING_FOR_REQUESTER, RESOLVED, CANCELLED", () => {
      expect(getAllowedTransitions("IN_PROGRESS", "IT_STAFF", false)).toEqual([
        "WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"
      ]);
    });

    it("allows WAITING_FOR_REQUESTER -> IN_PROGRESS, RESOLVED, CANCELLED", () => {
      expect(getAllowedTransitions("WAITING_FOR_REQUESTER", "IT_STAFF", false)).toEqual([
        "IN_PROGRESS", "RESOLVED", "CANCELLED"
      ]);
    });

    it("allows RESOLVED -> CLOSED, REOPENED", () => {
      expect(getAllowedTransitions("RESOLVED", "IT_STAFF", false)).toEqual([
        "CLOSED", "REOPENED"
      ]);
    });

    it("allows CLOSED -> REOPENED", () => {
      expect(getAllowedTransitions("CLOSED", "IT_STAFF", false)).toEqual([
        "REOPENED"
      ]);
    });

    it("allows REOPENED -> IN_PROGRESS, CANCELLED", () => {
      expect(getAllowedTransitions("REOPENED", "IT_STAFF", false)).toEqual([
        "IN_PROGRESS", "CANCELLED"
      ]);
    });

    it("enforces CANCELLED has zero exits (terminal state)", () => {
      expect(getAllowedTransitions("CANCELLED", "IT_STAFF", false)).toEqual([]);
      expect(isTransitionAllowed("CANCELLED", "OPEN", "IT_STAFF", false)).toBe(false);
    });

    it("handles legacy PENDING -> OPEN, CANCELLED", () => {
      expect(getAllowedTransitions("PENDING", "IT_STAFF", false)).toEqual([
        "OPEN", "CANCELLED"
      ]);
    });
  });

  describe("Requester Transitions", () => {
    it("permits Requester ONLY to reopen owned RESOLVED or CLOSED tickets", () => {
      expect(getAllowedTransitions("RESOLVED", "REQUESTER", true)).toEqual(["REOPENED"]);
      expect(getAllowedTransitions("CLOSED", "REQUESTER", true)).toEqual(["REOPENED"]);
      expect(isTransitionAllowed("RESOLVED", "REOPENED", "REQUESTER", true)).toBe(true);
    });

    it("blocks Requester from modifying other states or unowned tickets", () => {
      expect(getAllowedTransitions("NEW", "REQUESTER", true)).toEqual([]);
      expect(getAllowedTransitions("OPEN", "REQUESTER", true)).toEqual([]);
      expect(getAllowedTransitions("IN_PROGRESS", "REQUESTER", true)).toEqual([]);
      expect(getAllowedTransitions("RESOLVED", "REQUESTER", false)).toEqual([]);
    });
  });
});
