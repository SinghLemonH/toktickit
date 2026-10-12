import { describe, it, expect } from "vitest";
import { evaluateResolutionGate } from "../../src/domain/resolutionGate.js";

describe("Resolution Gate Domain Evaluation (UNIT-02, BR-11)", () => {
  it("fails when ticket has no assigned owner", () => {
    const result = evaluateResolutionGate(
      { assignedToId: null },
      [{ status: "COMPLETED" }]
    );
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain("A Ticket Owner must be assigned before resolving");
  });

  it("fails when ticket has no actions taken at all", () => {
    const result = evaluateResolutionGate(
      { assignedToId: 4 },
      []
    );
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain("At least one Completed Action Taken is required");
  });

  it("fails when only PLANNED actions exist", () => {
    const result = evaluateResolutionGate(
      { assignedToId: 4 },
      [{ status: "PLANNED" }]
    );
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain("At least one Completed Action Taken is required");
    expect(result.reasons).toContain("All Planned Actions Taken must be completed or cancelled before resolving");
  });

  it("fails when completed action exists but planned action remains unresolved", () => {
    const result = evaluateResolutionGate(
      { assignedToId: 4 },
      [{ status: "COMPLETED" }, { status: "PLANNED" }]
    );
    expect(result.ok).toBe(false);
    expect(result.reasons).toEqual(["All Planned Actions Taken must be completed or cancelled before resolving"]);
  });

  it("passes when owner assigned, at least one completed action, and zero planned actions", () => {
    const result = evaluateResolutionGate(
      { assignedToId: 4 },
      [{ status: "COMPLETED" }, { status: "CANCELLED" }]
    );
    expect(result.ok).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });
});
