-- Rollback Sprint 4 (Lab 4) Schema Changes
-- Drops ActionTaken, TicketStatusHistory, ActionStatus enum, and Ticket.version column.

DROP TABLE IF EXISTS "ActionTaken" CASCADE;
DROP TABLE IF EXISTS "TicketStatusHistory" CASCADE;
DROP TYPE IF EXISTS "ActionStatus" CASCADE;

ALTER TABLE "Ticket" DROP COLUMN IF EXISTS "version";
