import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { getPrisma } from "../../src/prisma.js";
import { seed } from "../../prisma/seed.js";

describe("Database Migration & Rollback (MIG-01, MIG-02)", () => {
  const prisma = getPrisma();
  const tempSchema = `mig_test_${Date.now()}`;

  beforeAll(async () => {
    // Ensure clean connection
    await prisma.$queryRaw`SELECT 1`;
  });

  afterAll(async () => {
    // Ensure temporary schema is always dropped cleanly
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${tempSchema}" CASCADE`);
  });

  it("MIG-01: executes rollback-lab4.sql in an isolated temporary schema without affecting main tables", async () => {
    // 1. Create isolated temporary schema
    await prisma.$executeRawUnsafe(`CREATE SCHEMA "${tempSchema}"`);

    // 2. Set search path to temporary schema and construct Lab 4 tables
    const setupStatements = [
      `CREATE TYPE "${tempSchema}"."ActionStatus" AS ENUM ('PLANNED', 'COMPLETED', 'CANCELLED')`,
      `CREATE TABLE "${tempSchema}"."Ticket" ("id" SERIAL PRIMARY KEY, "ticketNumber" TEXT NOT NULL, "version" INTEGER NOT NULL DEFAULT 0)`,
      `CREATE TABLE "${tempSchema}"."ActionTaken" ("id" SERIAL PRIMARY KEY, "ticketId" INTEGER NOT NULL, "description" TEXT NOT NULL, "status" "${tempSchema}"."ActionStatus" NOT NULL DEFAULT 'PLANNED', "version" INTEGER NOT NULL DEFAULT 0)`,
      `CREATE TABLE "${tempSchema}"."TicketStatusHistory" ("id" SERIAL PRIMARY KEY, "ticketId" INTEGER NOT NULL, "reason" TEXT)`,
      `INSERT INTO "${tempSchema}"."Ticket" ("ticketNumber", "version") VALUES ('TKT-TEST-001', 0)`,
      `INSERT INTO "${tempSchema}"."ActionTaken" ("ticketId", "description", "status") VALUES (1, 'Test Action', 'PLANNED')`,
      `INSERT INTO "${tempSchema}"."TicketStatusHistory" ("ticketId", "reason") VALUES (1, 'Initial reason')`,
    ];
    for (const sql of setupStatements) {
      await prisma.$executeRawUnsafe(sql);
    }

    // Verify tables and columns exist in temporary schema before rollback
    const tablesBefore = await prisma.$queryRawUnsafe<{ table_name: string }[]>(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = '${tempSchema}'
      ORDER BY table_name;
    `);
    const tableNamesBefore = tablesBefore.map((t) => t.table_name);
    expect(tableNamesBefore).toContain("ActionTaken");
    expect(tableNamesBefore).toContain("TicketStatusHistory");
    expect(tableNamesBefore).toContain("Ticket");

    const columnsBefore = await prisma.$queryRawUnsafe<{ column_name: string }[]>(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = '${tempSchema}' AND table_name = 'Ticket';
    `);
    expect(columnsBefore.map((c) => c.column_name)).toContain("version");

    // 3. Read and execute server/prisma/rollback-lab4.sql inside isolated schema
    const rollbackSqlPath = path.resolve(__dirname, "../../prisma/rollback-lab4.sql");
    expect(fs.existsSync(rollbackSqlPath)).toBe(true);
    const rollbackSql = fs.readFileSync(rollbackSqlPath, "utf8");

    // Execute rollback statements within a single transaction to preserve search_path
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET search_path TO "${tempSchema}"`);
      const cleanSql = rollbackSql
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n");
      const rollbackStatements = cleanSql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of rollbackStatements) {
        await tx.$executeRawUnsafe(statement);
      }
      await tx.$executeRawUnsafe(`RESET search_path`);
    });

    // 4. Verify post-rollback state in temporary schema
    const tablesAfter = await prisma.$queryRawUnsafe<{ table_name: string }[]>(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = '${tempSchema}'
      ORDER BY table_name;
    `);
    const tableNamesAfter = tablesAfter.map((t) => t.table_name);
    expect(tableNamesAfter).not.toContain("ActionTaken");
    expect(tableNamesAfter).not.toContain("TicketStatusHistory");
    expect(tableNamesAfter).toContain("Ticket");

    const columnsAfter = await prisma.$queryRawUnsafe<{ column_name: string }[]>(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = '${tempSchema}' AND table_name = 'Ticket';
    `);
    expect(columnsAfter.map((c) => c.column_name)).not.toContain("version");

    // 5. Verify pre-existing data in "Ticket" remains intact
    const ticketRow = await prisma.$queryRawUnsafe<{ id: number; ticketNumber: string }[]>(`
      SELECT "id", "ticketNumber" FROM "${tempSchema}"."Ticket";
    `);
    expect(ticketRow.length).toBe(1);
    expect(ticketRow[0].ticketNumber).toBe("TKT-TEST-001");

    // 6. Verify main public schema was completely undisturbed
    const mainActionTakenCount = await prisma.actionTaken.count();
    expect(mainActionTakenCount).toBeGreaterThan(0);
    const mainTicketCount = await prisma.ticket.count();
    expect(mainTicketCount).toBeGreaterThan(0);
  });

  it("MIG-02: seed script is idempotent and multiple runs produce identical record counts", async () => {
    // Capture initial counts after first seed
    const initialCategories = await prisma.category.count();
    const initialSystems = await prisma.relatedSystem.count();
    const initialUsers = await prisma.user.count();
    const initialTickets = await prisma.ticket.count();
    const initialActions = await prisma.actionTaken.count();
    const initialHistory = await prisma.ticketStatusHistory.count();

    expect(initialTickets).toBeGreaterThanOrEqual(12);
    expect(initialActions).toBeGreaterThan(0);

    // Re-run seed
    await seed();

    // Verify counts are strictly identical
    const nextCategories = await prisma.category.count();
    const nextSystems = await prisma.relatedSystem.count();
    const nextUsers = await prisma.user.count();
    const nextTickets = await prisma.ticket.count();
    const nextActions = await prisma.actionTaken.count();
    const nextHistory = await prisma.ticketStatusHistory.count();

    expect(nextCategories).toBe(initialCategories);
    expect(nextSystems).toBe(initialSystems);
    expect(nextUsers).toBe(initialUsers);
    expect(nextTickets).toBe(initialTickets);
    expect(nextActions).toBe(initialActions);
    expect(nextHistory).toBe(initialHistory);
  });
});
