import { useEffect, useState, type FormEvent } from "react";
import {
  getActiveCategories,
  getActiveRelatedSystems,
  createTicket,
  CreateTicketValidationError,
  type Category,
  type RelatedSystem,
} from "../api.js";
import { useRequester } from "../context/RequesterContext.js";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_ATTACHMENTS = 5;

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function CreateTicket() {
  const { requester } = useRequester();

  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);
  const [referenceDataError, setReferenceDataError] = useState(false);

  const [categoryId, setCategoryId] = useState("");
  const [relatedSystemId, setRelatedSystemId] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [requestedPriority, setRequestedPriority] = useState("MEDIUM");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{ ticketNumber: string } | null>(null);

  useEffect(() => {
    Promise.all([getActiveCategories(), getActiveRelatedSystems()])
      .then(([cats, systems]) => {
        setCategories(cats);
        setRelatedSystems(systems);
      })
      .catch(() => setReferenceDataError(true));
  }, []);

  function validateClientSide(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (summary.trim().length < 5 || summary.trim().length > 120) {
      errors.summary = "Summary must be 5-120 characters.";
    }
    if (description.trim().length < 20 || description.trim().length > 2000) {
      errors.description = "Description must be 20-2000 characters.";
    }
    if (!categoryId) errors.categoryId = "Select a category.";
    if (!relatedSystemId) errors.relatedSystemId = "Select a related system.";
    return errors;
  }

  function handleFilesSelected(fileList: FileList | null) {
    setAttachmentError(null);
    if (!fileList) return;
    const incoming = Array.from(fileList);

    if (attachments.length + incoming.length > MAX_ATTACHMENTS) {
      setAttachmentError(`You can attach at most ${MAX_ATTACHMENTS} files per ticket.`);
      return;
    }

    for (const file of incoming) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setAttachmentError(`"${file.name}" is not an allowed file type (JPG, PNG, WEBP, PDF only).`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setAttachmentError(`"${file.name}" is larger than 5MB.`);
        return;
      }
    }

    setAttachments((prev) => [...prev, ...incoming]);
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitState === "submitting") return; // guards against double submit (BR-21)

    const errors = validateClientSide();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitState("submitting");
    setSubmitError(null);

    try {
      const created = await createTicket(requester!.id, {
        categoryId: Number(categoryId),
        relatedSystemId: Number(relatedSystemId),
        summary: summary.trim(),
        description: description.trim(),
        requestedPriority: requestedPriority as "LOW" | "MEDIUM" | "HIGH",
        attachments,
      });
      setResult({ ticketNumber: created.ticketNumber });
      setSubmitState("success");
    } catch (err) {
      if (err instanceof CreateTicketValidationError) {
        setFieldErrors(err.fields);
        setSubmitState("idle"); // BR-23 — entered values are preserved, nothing was created
      } else {
        setSubmitError("Something went wrong submitting your ticket. Please try again.");
        setSubmitState("error"); // BR-24 — safe message, values preserved for retry
      }
    }
  }

  if (submitState === "success" && result) {
    return (
      <div className="zg-success-panel rounded p-4">
        <h1 className="h4 mb-2">Ticket submitted</h1>
        <p className="mb-1">Your official Ticket Number is:</p>
        <p className="display-6 fw-bold mb-3">{result.ticketNumber}</p>
        <button
          type="button"
          className="btn btn-primary me-2"
          onClick={() => window.location.assign("/tickets")}
        >
          View My Tickets
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => window.location.reload()}
        >
          Create Another
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="h4 mb-4">Create Ticket</h1>

      {referenceDataError && (
        <div className="alert alert-danger" role="alert">
          Unable to load categories or related systems. Please refresh and try again.
        </div>
      )}

      {submitState === "error" && submitError && (
        <div className="alert alert-danger" role="alert">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold">Ticket Number</label>
            <input
              className="form-control form-control-readonly"
              value="Assigned after submission"
              disabled
              readOnly
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold">Ticket Date</label>
            <input
              className="form-control form-control-readonly"
              value={new Date().toLocaleDateString()}
              disabled
              readOnly
            />
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-4">
            <label htmlFor="category" className="form-label fw-semibold">
              Category <span className="text-danger">*</span>
            </label>
            <select
              id="category"
              className={`form-select ${fieldErrors.categoryId ? "is-invalid" : ""}`}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Choose…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {fieldErrors.categoryId && (
              <div className="invalid-feedback">{fieldErrors.categoryId}</div>
            )}
          </div>
          <div className="col-md-4">
            <label htmlFor="relatedSystem" className="form-label fw-semibold">
              Related System <span className="text-danger">*</span>
            </label>
            <select
              id="relatedSystem"
              className={`form-select ${fieldErrors.relatedSystemId ? "is-invalid" : ""}`}
              value={relatedSystemId}
              onChange={(e) => setRelatedSystemId(e.target.value)}
            >
              <option value="">Choose…</option>
              {relatedSystems.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {fieldErrors.relatedSystemId && (
              <div className="invalid-feedback">{fieldErrors.relatedSystemId}</div>
            )}
          </div>
          <div className="col-md-4">
            <label htmlFor="priority" className="form-label fw-semibold">
              Requested Priority <span className="text-danger">*</span>
            </label>
            <select
              id="priority"
              className="form-select"
              value={requestedPriority}
              onChange={(e) => setRequestedPriority(e.target.value)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="summary" className="form-label fw-semibold">
            Summary <span className="text-danger">*</span>
          </label>
          <input
            id="summary"
            className={`form-control ${fieldErrors.summary ? "is-invalid" : ""}`}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={120}
          />
          {fieldErrors.summary && <div className="invalid-feedback">{fieldErrors.summary}</div>}
          <div className="form-text">{summary.length}/120</div>
        </div>

        <div className="mb-3">
          <label htmlFor="description" className="form-label fw-semibold">
            Description <span className="text-danger">*</span>
          </label>
          <textarea
            id="description"
            className={`form-control ${fieldErrors.description ? "is-invalid" : ""}`}
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
          />
          {fieldErrors.description && (
            <div className="invalid-feedback">{fieldErrors.description}</div>
          )}
          <div className="form-text">{description.length}/2000</div>
        </div>

        <div className="mb-4">
          <label htmlFor="attachments" className="form-label fw-semibold">
            Attachments
          </label>
          <input
            id="attachments"
            type="file"
            className="form-control"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
          <div className="form-text">
            {attachments.length} of {MAX_ATTACHMENTS} attachments
          </div>
          {attachmentError && (
            <div className="alert alert-danger mt-2 py-2 small" role="alert">
              {attachmentError}
            </div>
          )}
          {attachments.length > 0 && (
            <ul className="list-group mt-2">
              {attachments.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <span>
                    {file.name} <span className="text-muted small">({Math.round(file.size / 1024)} KB)</span>
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    aria-label={`Remove ${file.name}`}
                    title={`Remove ${file.name}`}
                    onClick={() => removeAttachment(index)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" disabled={submitState === "submitting"}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitState === "submitting"}>
            {submitState === "submitting" ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                Submitting…
              </>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}