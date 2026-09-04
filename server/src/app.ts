import express, { Request, Response } from "express";
import cors from "cors";
import fs from "node:fs";
import type { Prisma } from "@prisma/client";
import { getPrisma } from "./prisma.js";
import { requireActiveRequester, type RequestWithRequester } from "./middleware/requireActiveRequester.js";
import { upload, MAX_ACTIVE_ATTACHMENTS } from "./upload.js";
import { getNextTicketNumber } from "./lib/ticketNumber.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "TokTickIT API" });
});

app.get("/api/categories", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    });
    res.status(200).json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to retrieve categories" });
  }
});

// Lab 2 — Issue #15: Create Ticket reference data.
app.get("/api/related-systems", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const relatedSystems = await prisma.relatedSystem.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    });
    res.status(200).json(relatedSystems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to retrieve related systems" });
  }
});

// Lab 2 — Issue #14: Development Requester Context.
// Only active requesters are returned (BR-06); inactive requesters must never
// appear in the selector.
app.get("/api/dev-requesters", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const requesters = await prisma.devRequester.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: { id: true, name: true, email: true },
    });
    res.status(200).json(requesters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to retrieve development requesters" });
  }
});

// Lab 2 — Issue #15: Create Ticket.
// Validation order and status codes follow docs/lab-02/api-spec.md exactly.
app.post(
  "/api/tickets",
  requireActiveRequester,
  upload.array("attachments", MAX_ACTIVE_ATTACHMENTS),
  async (req: RequestWithRequester, res: Response) => {
    const prisma = getPrisma();
    const files = (req.files as Express.Multer.File[]) ?? [];
    const fieldErrors: Record<string, string> = {};

    const categoryId = Number(req.body.categoryId);
    const relatedSystemId = Number(req.body.relatedSystemId);
    const summary = typeof req.body.summary === "string" ? req.body.summary.trim() : "";
    const description =
      typeof req.body.description === "string" ? req.body.description.trim() : "";
    const requestedPriority = req.body.requestedPriority;

    if (!summary || summary.length < 5 || summary.length > 120) {
      fieldErrors.summary = "Summary must be 5-120 characters.";
    }
    if (!description || description.length < 20 || description.length > 2000) {
      fieldErrors.description = "Description must be 20-2000 characters.";
    }
    if (!["LOW", "MEDIUM", "HIGH"].includes(requestedPriority)) {
      fieldErrors.requestedPriority = "Requested priority must be LOW, MEDIUM, or HIGH.";
    }

    let category = null;
    let relatedSystem = null;
    if (!Number.isNaN(categoryId)) {
      category = await prisma.category.findFirst({ where: { id: categoryId, isActive: true } });
    }
    if (!category) fieldErrors.categoryId = "Select a valid, active category.";

    if (!Number.isNaN(relatedSystemId)) {
      relatedSystem = await prisma.relatedSystem.findFirst({
        where: { id: relatedSystemId, isActive: true },
      });
    }
    if (!relatedSystem) fieldErrors.relatedSystemId = "Select a valid, active related system.";

    if (Object.keys(fieldErrors).length > 0) {
      // BR-23 — no Ticket and no Attachment is created on a validation failure.
      for (const file of files) {
        fs.unlink(file.path, () => {});
      }
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Invalid ticket data.", fields: fieldErrors },
      });
    }

    try {
      const ticket = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const ticketNumber = await getNextTicketNumber(tx);
        return tx.ticket.create({
          data: {
            ticketNumber,
            requesterId: req.requester!.id,
            categoryId,
            relatedSystemId,
            summary,
            description,
            requestedPriority,
          },
        });
      });

      const attachments: { id: number; originalFilename: string; sizeBytes: number }[] = [];
      const failedAttachments: string[] = [];

      // BR-25 — an attachment failing after the Ticket exists does not roll
      // back the Ticket; each file is saved independently and failures are
      // reported back so the user can retry via the add-attachment endpoint.
      for (const file of files) {
        try {
          const saved = await prisma.attachment.create({
            data: {
              ticketId: ticket.id,
              originalFilename: file.originalname,
              storedFilename: file.filename,
              mimeType: file.mimetype,
              sizeBytes: file.size,
            },
          });
          attachments.push({
            id: saved.id,
            originalFilename: saved.originalFilename,
            sizeBytes: saved.sizeBytes,
          });
        } catch (err) {
          console.error(err);
          failedAttachments.push(file.originalname);
        }
      }

      res.status(201).json({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        ticketDate: ticket.createdAt,
        requesterId: ticket.requesterId,
        categoryId: ticket.categoryId,
        relatedSystemId: ticket.relatedSystemId,
        summary: ticket.summary,
        description: ticket.description,
        requestedPriority: ticket.requestedPriority,
        itPriority: ticket.itPriority,
        currentStatus: ticket.currentStatus,
        attachments,
        failedAttachments,
      });
    } catch (err) {
      console.error(err);
      for (const file of files) {
        fs.unlink(file.path, () => {});
      }
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Unable to create ticket." } });
    }
  }
);