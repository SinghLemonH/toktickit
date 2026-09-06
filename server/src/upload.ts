import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import multer from "multer";

export const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const maxFileSizeBytes = 5 * 1024 * 1024;
export const MAX_ACTIVE_ATTACHMENTS = 5;

export const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, UPLOAD_DIR),
    filename: (_req, file, callback) => callback(null, `${crypto.randomBytes(16).toString("hex")}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: maxFileSizeBytes, files: MAX_ACTIVE_ATTACHMENTS },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new Error("INVALID_ATTACHMENT_TYPE"));
      return;
    }
    callback(null, true);
  },
});
