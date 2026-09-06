import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

const REQUESTER_A_ID = 1; // Jennifer Anderson
const REQUESTER_B_ID = 2; // Michael Brown
const CATEGORY_HARDWARE_ID = 2;
const RELATED_SYSTEM_LAPTOP_ID = 7;

async function createTestTicket(requesterId = REQUESTER_A_ID) {
  const res = await request(app)
    .post("/api/tickets")
    .set("X-Dev-Requester-Id", String(requesterId))
    .field("categoryId", String(CATEGORY_HARDWARE_ID))
    .field("relatedSystemId", String(RELATED_SYSTEM_LAPTOP_ID))
    .field("summary", "Ticket for attachment lifecycle tests")
    .field("description", "A valid long description for testing attachment flows accurately.")
    .field("requestedPriority", "LOW");
  return res.body.id as number;
}

describe("Attachment Lifecycle APIs", () => {
  describe("POST /api/tickets/:id/attachments", () => {
    it("uploads an attachment to an owned ticket (201)", async () => {
      const ticketId = await createTestTicket();

      const res = await request(app)
        .post(`/api/tickets/${ticketId}/attachments`)
        .set("X-Dev-Requester-Id", String(REQUESTER_A_ID))
        .attach("file", Buffer.from("dummy pdf content"), "evidence.pdf");

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.originalFilename).toBe("evidence.pdf");
      expect(res.body.removedAt).toBeNull();
    });

    it("returns 404 when attempting to attach to a non-owned ticket", async () => {
      const ticketId = await createTestTicket(REQUESTER_A_ID);

      const res = await request(app)
        .post(`/api/tickets/${ticketId}/attachments`)
        .set("X-Dev-Requester-Id", String(REQUESTER_B_ID))
        .attach("file", Buffer.from("dummy pdf"), "test.pdf");

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });

    it("rejects upload when ticket already has 5 active attachments (API-17, BR-28)", async () => {
      const ticketId = await createTestTicket();

      // Upload 5 attachments
      for (let i = 1; i <= 5; i++) {
        const uploadRes = await request(app)
          .post(`/api/tickets/${ticketId}/attachments`)
          .set("X-Dev-Requester-Id", String(REQUESTER_A_ID))
          .attach("file", Buffer.from(`file ${i}`), `file${i}.pdf`);
        expect(uploadRes.status).toBe(201);
      }

      // Try uploading the 6th active attachment
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/attachments`)
        .set("X-Dev-Requester-Id", String(REQUESTER_A_ID))
        .attach("file", Buffer.from("file 6"), "file6.pdf");

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("TOO_MANY_ATTACHMENTS");
    });

    it("rejects unsupported file type (API-06, BR-26)", async () => {
      const ticketId = await createTestTicket();

      const res = await request(app)
        .post(`/api/tickets/${ticketId}/attachments`)
        .set("X-Dev-Requester-Id", String(REQUESTER_A_ID))
        .attach("file", Buffer.from("bad exe"), "virus.exe");

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_ATTACHMENT");
    });
  });

  describe("GET /api/attachments/:id/download", () => {
    it("downloads an active, owned attachment (200)", async () => {
      const ticketId = await createTestTicket();

      const uploadRes = await request(app)
        .post(`/api/tickets/${ticketId}/attachments`)
        .set("X-Dev-Requester-Id", String(REQUESTER_A_ID))
        .attach("file", Buffer.from("sample download content"), "download-me.png");

      const attachmentId = uploadRes.body.id;

      const res = await request(app)
        .get(`/api/attachments/${attachmentId}/download`)
        .set("X-Dev-Requester-Id", String(REQUESTER_A_ID));

      expect(res.status).toBe(200);
      expect(res.body.toString()).toBe("sample download content");
    });

    it("blocks download of attachment owned by another requester (API-18, BR-33)", async () => {
      const ticketId = await createTestTicket(REQUESTER_A_ID);

      const uploadRes = await request(app)
        .post(`/api/tickets/${ticketId}/attachments`)
        .set("X-Dev-Requester-Id", String(REQUESTER_A_ID))
        .attach("file", Buffer.from("secret doc"), "secret.pdf");

      const attachmentId = uploadRes.body.id;

      const res = await request(app)
        .get(`/api/attachments/${attachmentId}/download`)
        .set("X-Dev-Requester-Id", String(REQUESTER_B_ID));

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });

    it("blocks download of soft-removed attachment (API-16, BR-34)", async () => {
      const ticketId = await createTestTicket(REQUESTER_A_ID);

      const uploadRes = await request(app)
        .post(`/api/tickets/${ticketId}/attachments`)
        .set("X-Dev-Requester-Id", String(REQUESTER_A_ID))
        .attach("file", Buffer.from("will be removed"), "temp.pdf");

      const attachmentId = uploadRes.body.id;

      // Soft remove it
      const deleteRes = await request(app)
        .delete(`/api/attachments/${attachmentId}`)
        .set("X-Dev-Requester-Id", String(REQUESTER_A_ID))
        .send({ reason: "No longer needed" });
      expect(deleteRes.status).toBe(200);

      // Attempt to download
      const res = await request(app)
        .get(`/api/attachments/${attachmentId}/download`)
        .set("X-Dev-Requester-Id", String(REQUESTER_A_ID));

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("DELETE /api/attachments/:id (Soft Removal)", () => {
    it("soft-removes an attachment with a valid reason (API-15, BR-31, BR-32)", async () => {
      const ticketId = await createTestTicket();

      const uploadRes = await request(app)
        .post(`/api/tickets/${ticketId}/attachments`)
        .set("X-Dev-Requester-Id", String(REQUESTER_A_ID))
        .attach("file", Buffer.from("evidence to remove"), "evidence.jpg");

      const attachmentId = uploadRes.body.id;

      const res = await request(app)
        .delete(`/api/attachments/${attachmentId}`)
        .set("X-Dev-Requester-Id", String(REQUESTER_A_ID))
        .send({ reason: "Uploaded by mistake" });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(attachmentId);
      expect(res.body.removedAt).not.toBeNull();
      expect(res.body.removalReason).toBe("Uploaded by mistake");
    });

    it("rejects soft-remove without reason (API-15, BR-32)", async () => {
      const ticketId = await createTestTicket();

      const uploadRes = await request(app)
        .post(`/api/tickets/${ticketId}/attachments`)
        .set("X-Dev-Requester-Id", String(REQUESTER_A_ID))
        .attach("file", Buffer.from("data"), "file.pdf");

      const attachmentId = uploadRes.body.id;

      const res = await request(app)
        .delete(`/api/attachments/${attachmentId}`)
        .set("X-Dev-Requester-Id", String(REQUESTER_A_ID))
        .send({ reason: "   " });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 409 when attempting to remove an already-removed attachment (API-19)", async () => {
      const ticketId = await createTestTicket();

      const uploadRes = await request(app)
        .post(`/api/tickets/${ticketId}/attachments`)
        .set("X-Dev-Requester-Id", String(REQUESTER_A_ID))
        .attach("file", Buffer.from("data"), "double-delete.pdf");

      const attachmentId = uploadRes.body.id;

      // First removal
      const del1 = await request(app)
        .delete(`/api/attachments/${attachmentId}`)
        .set("X-Dev-Requester-Id", String(REQUESTER_A_ID))
        .send({ reason: "First removal reason" });
      expect(del1.status).toBe(200);

      // Second removal attempt
      const del2 = await request(app)
        .delete(`/api/attachments/${attachmentId}`)
        .set("X-Dev-Requester-Id", String(REQUESTER_A_ID))
        .send({ reason: "Second removal reason" });
      expect(del2.status).toBe(409);
      expect(del2.body.error.code).toBe("ALREADY_REMOVED");
    });
  });
});
