import { useState } from "react";
import { Paperclip, Download, Trash2, AlertTriangle, CheckCircle2, Upload, FileText } from "lucide-react";
import {
  type AttachmentMetadata,
  uploadAttachment,
  downloadAttachment,
  removeAttachment,
} from "../api.js";

interface AttachmentSectionProps {
  ticketId: number;
  requesterId: number;
  attachments: AttachmentMetadata[];
  onAttachmentsUpdated: () => void;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_ACTIVE_ATTACHMENTS = 5;

export default function AttachmentSection({
  ticketId,
  requesterId,
  attachments,
  onAttachmentsUpdated,
}: AttachmentSectionProps) {
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [removalReason, setRemovalReason] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeAttachments = attachments.filter((a) => a.removedAt === null);
  const canAddMore = activeAttachments.length < MAX_ACTIVE_ATTACHMENTS;

  async function handleDownload(attachment: AttachmentMetadata) {
    try {
      setErrorMsg(null);
      await downloadAttachment(requesterId, attachment.id, attachment.originalFilename);
    } catch (err) {
      setErrorMsg("Failed to download attachment.");
    }
  }

  async function handleFileUpload(file: File) {
    setErrorMsg(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMsg(`"${file.name}" — JPG, PNG, WEBP, or PDF only.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrorMsg(`"${file.name}" exceeds the 5MB size limit.`);
      return;
    }
    if (!canAddMore) {
      setErrorMsg(`Maximum of ${MAX_ACTIVE_ATTACHMENTS} active attachments allowed.`);
      return;
    }

    setIsUploading(true);
    try {
      await uploadAttachment(requesterId, ticketId, file);
      onAttachmentsUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload attachment.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleConfirmRemove() {
    if (!removingId || !removalReason.trim()) return;

    setIsRemoving(true);
    setErrorMsg(null);
    try {
      await removeAttachment(requesterId, removingId, removalReason.trim());
      setRemovingId(null);
      setRemovalReason("");
      onAttachmentsUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to remove attachment.");
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <div className="card p-4 mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h5 mb-0 d-flex align-items-center gap-2">
          <Paperclip size={18} aria-hidden="true" /> Attachments
        </h2>
        <span className="text-muted small">
          {activeAttachments.length} of {MAX_ACTIVE_ATTACHMENTS} active
        </span>
      </div>

      {errorMsg && (
        <div className="zg-state-panel zg-state-error py-2 mb-3">
          <AlertTriangle size={20} aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {attachments.length === 0 ? (
        <p className="text-muted small mb-3">No attachments uploaded for this ticket.</p>
      ) : (
        <div className="list-group mb-3">
          {attachments.map((att) => {
            const isRemoved = att.removedAt !== null;
            return (
              <div
                key={att.id}
                className={`list-group-item d-flex justify-content-between align-items-center flex-wrap gap-2 ${
                  isRemoved ? "bg-light text-muted opacity-75" : ""
                }`}
              >
                <div className="d-flex align-items-start gap-2">
                  <FileText size={18} className={isRemoved ? "text-muted" : "text-success"} aria-hidden="true" />
                  <div>
                    <div className="fw-semibold text-break">{att.originalFilename}</div>
                    <div className="small text-muted">
                      {Math.round(att.sizeBytes / 1024)} KB · Uploaded {new Date(att.uploadedAt).toLocaleString()}
                    </div>
                    {isRemoved && (
                      <div className="small text-danger mt-1">
                        <strong>Reason for removal:</strong> {att.removalReason} (Removed on{" "}
                        {new Date(att.removedAt!).toLocaleDateString()})
                      </div>
                    )}
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  {isRemoved ? (
                    <span className="badge bg-secondary">Unavailable</span>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                        aria-label={`Download ${att.originalFilename}`}
                        title={`Download ${att.originalFilename}`}
                        onClick={() => handleDownload(att)}
                      >
                        <Download size={14} aria-hidden="true" /> Download
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                        aria-label={`Remove ${att.originalFilename}`}
                        title={`Remove ${att.originalFilename}`}
                        onClick={() => {
                          setRemovingId(att.id);
                          setRemovalReason("");
                        }}
                      >
                        <Trash2 size={14} aria-hidden="true" /> Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Attachment Section */}
      {canAddMore ? (
        <div className="border rounded p-3 bg-white">
          <label htmlFor="add-attachment-input" className="form-label fw-semibold small mb-2 d-flex align-items-center gap-1">
            <Upload size={14} aria-hidden="true" /> Add Permitted Attachment
          </label>
          <div className="d-flex align-items-center gap-2">
            <input
              id="add-attachment-input"
              type="file"
              className="form-control form-control-sm"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = "";
              }}
            />
            {isUploading && (
              <span className="spinner-border spinner-border-sm text-success" role="status" aria-hidden="true" />
            )}
          </div>
          <div className="form-text small">Max 5MB each (JPG, PNG, WEBP, PDF).</div>
        </div>
      ) : (
        <div className="small text-muted border rounded p-2 bg-light text-center">
          Maximum limit of {MAX_ACTIVE_ATTACHMENTS} active attachments reached.
        </div>
      )}

      {/* Removal Reason Confirmation Dialog / Modal */}
      {removingId && (
        <div className="zg-mobile-menu-backdrop" role="presentation" onClick={() => !isRemoving && setRemovingId(null)}>
          <div
            className="zg-mobile-menu-panel p-4"
            role="dialog"
            aria-label="Confirm Removal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 460 }}
          >
            <h3 className="h5 mb-2 text-danger d-flex align-items-center gap-2">
              <AlertTriangle size={20} aria-hidden="true" /> Confirm Attachment Removal
            </h3>
            <p className="text-muted small mb-3">
              Removing an attachment is a permanent soft removal. The file will become unavailable for download,
              but its metadata will remain visible on the ticket.
            </p>
            <div className="mb-3 text-start">
              <label htmlFor="removal-reason" className="form-label fw-semibold small">
                Removal Reason <span className="text-danger">*</span>
              </label>
              <textarea
                id="removal-reason"
                className="form-control form-control-sm"
                rows={3}
                placeholder="Explain why this attachment is being removed (1-200 chars)…"
                maxLength={200}
                value={removalReason}
                onChange={(e) => setRemovalReason(e.target.value)}
                disabled={isRemoving}
              />
              <div className="form-text text-end small">{removalReason.trim().length}/200</div>
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={isRemoving}
                onClick={() => setRemovingId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                disabled={isRemoving || removalReason.trim().length < 1 || removalReason.trim().length > 200}
                onClick={handleConfirmRemove}
              >
                {isRemoving ? "Removing…" : "Confirm Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
