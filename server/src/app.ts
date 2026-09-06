import express, { Request, Response } from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import type { Prisma } from "@prisma/client";
import { getPrisma } from "./prisma.js";
import { requireActiveRequester, type RequestWithRequester } from "./middleware/requireActiveRequester.js";
import { upload, UPLOAD_DIR, MAX_ACTIVE_ATTACHMENTS } from "./upload.js";
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

// Lab 2 — Issue #16: My Tickets.
// Scoped to the requesting Requester only (BR-09, BR-10) — the WHERE clause
// enforces ownership, never a post-fetch filter.
const SORTABLE_FIELDS = new Set(["createdAt", "updatedAt", "ticketNumber"]);
const PAGE_SIZES = new Set([10, 25, 50]);

app.get("/api/tickets", requireActiveRequester, async (req: RequestWithRequester, res: Response) => {
  try {
    const prisma = getPrisma();

    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const requestedPriority =
      typeof req.query.requestedPriority === "string" ? req.query.requestedPriority : undefined;
    const itPriority = typeof req.query.itPriority === "string" ? req.query.itPriority : undefined;
    const currentStatus =
      typeof req.query.currentStatus === "string" ? req.query.currentStatus : undefined;

    const sortByRaw = typeof req.query.sortBy === "string" ? req.query.sortBy : "createdAt";
    const sortBy = SORTABLE_FIELDS.has(sortByRaw) ? sortByRaw : "createdAt"; // BR-14 fallback
    const sortDir = req.query.sortDir === "asc" ? "asc" : "desc";

    const pageRaw = Number(req.query.page);
    const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1; // BR-16
    const pageSizeRaw = Number(req.query.pageSize);
    const pageSize = PAGE_SIZES.has(pageSizeRaw) ? pageSizeRaw : 10; // BR-15 fallback

    const where: Record<string, unknown> = {
      requesterId: req.requester!.id, // BR-09/BR-10 — ownership scope
      ...(search
        ? {
            OR: [
              { ticketNumber: { startsWith: search, mode: "insensitive" } },
              { summary: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(requestedPriority ? { requestedPriority } : {}),
      ...(itPriority ? { itPriority } : {}),
      ...(currentStatus ? { currentStatus } : {}),
    };

    const [totalItems, items] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        orderBy: [{ [sortBy]: sortDir }, { ticketNumber: "asc" }], // BR-14 stable secondary sort
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { category: { select: { name: true } } },
      }),
    ]);

    res.status(200).json({
      items: items.map((t: (typeof items)[number]) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        summary: t.summary,
        categoryName: t.category.name,
        requestedPriority: t.requestedPriority,
        itPriority: t.itPriority,
        currentStatus: t.currentStatus,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
      page,
      pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Unable to retrieve tickets." } });
  }
});

// Lab 2 — Issue #17: Ticket Detail & Attachments Lifecycle

// GET /api/tickets/:id
app.get(
  "/api/tickets/:id",
  requireActiveRequester,
  async (req: RequestWithRequester, res: Response) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found." } });
    }

    try {
      const prisma = getPrisma();
      const ticket = await prisma.ticket.findFirst({
        where: {
          id,
          requesterId: req.requester!.id, // BR-10, BR-11, BR-38: ownership check (404 if not owned)
        },
        include: {
          category: { select: { name: true } },
          relatedSystem: { select: { name: true } },
          requester: { select: { name: true } },
          attachments: {
            orderBy: { uploadedAt: "asc" },
            select: {
              id: true,
              originalFilename: true,
              sizeBytes: true,
              uploadedAt: true,
              removedAt: true,
              removalReason: true,
            },
          },
        },
      });

      if (!ticket) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found." } });
      }

      res.status(200).json({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        ticketDate: ticket.createdAt,
        createdAt: ticket.createdAt,
        categoryName: ticket.category.name,
        relatedSystemName: ticket.relatedSystem.name,
        requesterName: ticket.requester.name,
        summary: ticket.summary,
        description: ticket.description,
        requestedPriority: ticket.requestedPriority,
        itPriority: ticket.itPriority,
        currentStatus: ticket.currentStatus,
        attachments: ticket.attachments,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Unable to retrieve ticket." } });
    }
  }
);

// GET /api/tickets/:id/attachments
app.get(
  "/api/tickets/:id/attachments",
  requireActiveRequester,
  async (req: RequestWithRequester, res: Response) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found." } });
    }

    try {
      const prisma = getPrisma();
      const ticket = await prisma.ticket.findFirst({
        where: { id, requesterId: req.requester!.id },
        select: {
          attachments: {
            orderBy: { uploadedAt: "asc" },
            select: {
              id: true,
              originalFilename: true,
              sizeBytes: true,
              uploadedAt: true,
              removedAt: true,
              removalReason: true,
            },
          },
        },
      });

      if (!ticket) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found." } });
      }

      res.status(200).json(ticket.attachments);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Unable to retrieve attachments." } });
    }
  }
);

// POST /api/tickets/:id/attachments
app.post(
  "/api/tickets/:id/attachments",
  requireActiveRequester,
  (req: RequestWithRequester, res: Response, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          error: { code: "INVALID_ATTACHMENT", message: "Attachment must be JPG, PNG, WEBP, or PDF and under 5MB." },
        });
      }
      next();
    });
  },
  async (req: RequestWithRequester, res: Response) => {
    const id = Number(req.params.id);
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        error: { code: "INVALID_ATTACHMENT", message: "No file uploaded." },
      });
    }

    if (Number.isNaN(id)) {
      fs.unlink(file.path, () => {});
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found." } });
    }

    try {
      const prisma = getPrisma();
      const ticket = await prisma.ticket.findFirst({
        where: { id, requesterId: req.requester!.id },
      });

      if (!ticket) {
        fs.unlink(file.path, () => {});
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found." } });
      }

      // Check max 5 active attachments (BR-28)
      const activeCount = await prisma.attachment.count({
        where: { ticketId: id, removedAt: null },
      });

      if (activeCount >= MAX_ACTIVE_ATTACHMENTS) {
        fs.unlink(file.path, () => {});
        return res.status(400).json({
          error: { code: "TOO_MANY_ATTACHMENTS", message: "A ticket may have at most 5 active attachments." },
        });
      }

      const saved = await prisma.attachment.create({
        data: {
          ticketId: id,
          originalFilename: file.originalname,
          storedFilename: file.filename,
          mimeType: file.mimetype,
          sizeBytes: file.size,
        },
      });

      res.status(201).json({
        id: saved.id,
        originalFilename: saved.originalFilename,
        sizeBytes: saved.sizeBytes,
        uploadedAt: saved.uploadedAt,
        removedAt: saved.removedAt,
        removalReason: saved.removalReason,
      });
    } catch (err) {
      console.error(err);
      fs.unlink(file.path, () => {});
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Unable to upload attachment." } });
    }
  }
);

// GET /api/attachments/:id/download
app.get(
  "/api/attachments/:id/download",
  requireActiveRequester,
  async (req: RequestWithRequester, res: Response) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Attachment not found." } });
    }

    try {
      const prisma = getPrisma();
      const attachment = await prisma.attachment.findUnique({
        where: { id },
        include: { ticket: { select: { requesterId: true } } },
      });

      // BR-33 & BR-34: Must exist, be owned by requester, and NOT soft-removed
      if (!attachment || attachment.ticket.requesterId !== req.requester!.id || attachment.removedAt !== null) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Attachment not found." } });
      }

      const filePath = path.join(UPLOAD_DIR, attachment.storedFilename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "File not found on disk." } });
      }

      res.download(filePath, attachment.originalFilename);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Unable to download attachment." } });
    }
  }
);

// DELETE /api/attachments/:id (Soft-removal)
app.delete(
  "/api/attachments/:id",
  requireActiveRequester,
  async (req: RequestWithRequester, res: Response) => {
    const id = Number(req.params.id);
    const reason = req.body?.reason;

    if (typeof reason !== "string" || !reason.trim() || reason.trim().length > 200) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Removal reason is required (1-200 characters)." },
      });
    }

    if (Number.isNaN(id)) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Attachment not found." } });
    }

    try {
      const prisma = getPrisma();
      const attachment = await prisma.attachment.findUnique({
        where: { id },
        include: { ticket: { select: { requesterId: true } } },
      });

      if (!attachment || attachment.ticket.requesterId !== req.requester!.id) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Attachment not found." } });
      }

      // BR-31 & API-19: Already removed returns 409
      if (attachment.removedAt !== null) {
        return res.status(409).json({
          error: { code: "ALREADY_REMOVED", message: "Attachment has already been removed." },
        });
      }

      const updated = await prisma.attachment.update({
        where: { id },
        data: {
          removedAt: new Date(),
          removalReason: reason.trim(),
        },
      });

      res.status(200).json({
        id: updated.id,
        originalFilename: updated.originalFilename,
        sizeBytes: updated.sizeBytes,
        uploadedAt: updated.uploadedAt,
        removedAt: updated.removedAt,
        removalReason: updated.removalReason,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Unable to remove attachment." } });
    }
  }
);