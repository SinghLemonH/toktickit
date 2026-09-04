import type { PrismaClient } from "@prisma/client";

// Pure formatting logic — testable without touching the database (UNIT-01).
export function formatTicketNumber(year: number, sequence: number): string {
  return `TKT-${year}-${String(sequence).padStart(6, "0")}`;
}

// Atomically increments the per-year counter inside the given transaction
// client and returns the formatted ticket number. Must be called with the
// `tx` passed into prisma.$transaction(async (tx) => { ... }) so the
// increment and the Ticket insert commit together (BR-01).
export async function getNextTicketNumber(
  tx: Pick<PrismaClient, "ticketNumberCounter">,
  year: number = new Date().getFullYear()
): Promise<string> {
  const counter = await tx.ticketNumberCounter.upsert({
    where: { year },
    update: { lastValue: { increment: 1 } },
    create: { year, lastValue: 1 },
  });
  return formatTicketNumber(year, counter.lastValue);
}