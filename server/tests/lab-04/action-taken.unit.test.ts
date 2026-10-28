import { describe, expect, it } from "vitest";
import { validateCreateAction } from "../../src/validation/actionsValidation.js";

const ticketCreatedAt = new Date("2026-01-01T00:00:00.000Z");

describe("Action Taken creation validation", () => {
  it("trims valid text and defaults to a planned action", () => {
    const result = validateCreateAction(
      { description: "  Replaced the network cable  ", result: "  Link restored  " },
      ticketCreatedAt
    );

    expect(result.valid).toBe(true);
    expect(result.cleaned).toMatchObject({
      description: "Replaced the network cable",
      result: "Link restored",
      status: "PLANNED",
      followUpRequired: false,
      followUpNote: null,
    });
  });

  it("rejects empty and overlong descriptions", () => {
    expect(validateCreateAction({ description: "   " }, ticketCreatedAt).errors.description).toBeTruthy();
    expect(
      validateCreateAction({ description: "x".repeat(2001) }, ticketCreatedAt).errors.description
    ).toBeTruthy();
  });

  it("requires a non-empty follow-up note only when follow-up is required", () => {
    expect(
      validateCreateAction({ description: "Check logs", followUpRequired: true }, ticketCreatedAt)
        .errors.followUpNote
    ).toBeTruthy();

    const result = validateCreateAction(
      { description: "Check logs", followUpRequired: true, followUpNote: "  Review tomorrow  " },
      ticketCreatedAt
    );
    expect(result.valid).toBe(true);
    expect(result.cleaned?.followUpNote).toBe("Review tomorrow");
  });

  it("requires a result for completed actions and enforces the completed date bounds", () => {
    expect(
      validateCreateAction({ description: "Restarted service", status: "COMPLETED" }, ticketCreatedAt)
        .errors.result
    ).toBeTruthy();

    const tooEarly = validateCreateAction(
      {
        description: "Restarted service",
        result: "Service healthy",
        status: "COMPLETED",
        actionAt: "2025-12-31T23:59:00.000Z",
      },
      ticketCreatedAt
    );
    expect(tooEarly.errors.actionAt).toMatch(/precede ticket creation/);

    const tooLate = validateCreateAction(
      {
        description: "Restarted service",
        result: "Service healthy",
        status: "COMPLETED",
        actionAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      },
      ticketCreatedAt
    );
    expect(tooLate.errors.actionAt).toMatch(/future by more than 5 minutes/);
  });

  it("allows future-dated planned actions", () => {
    const result = validateCreateAction(
      {
        description: "Replace access point",
        actionAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      ticketCreatedAt
    );
    expect(result.valid).toBe(true);
    expect(result.cleaned?.status).toBe("PLANNED");
  });
});
