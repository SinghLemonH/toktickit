import { describe, it, expect } from "vitest";
import { formatTicketNumber } from "../../src/lib/ticketNumber.js";

describe("formatTicketNumber", () => {
  it("zero-pads the sequence to 6 digits", () => {
    expect(formatTicketNumber(2026, 1)).toBe("TKT-2026-000001");
    expect(formatTicketNumber(2026, 123)).toBe("TKT-2026-000123");
  });

  it("widens past 6 digits instead of truncating (documented edge case)", () => {
    expect(formatTicketNumber(2026, 1000000)).toBe("TKT-2026-1000000");
  });
});