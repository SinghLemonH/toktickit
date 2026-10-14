import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Flag,
  AlertCircle,
  RefreshCw,
  Edit2,
  Check,
  X,
  FileText,
} from "lucide-react";
import {
  getActionsTaken,
  createActionTaken,
  updateActionTaken,
  getStaffUsers,
  ApiError,
  type ActionTaken,
  type StaffUser,
} from "../api.js";

interface ActionsTakenSectionProps {
  ticketId: number;
  isStaff: boolean;
  ticketStatus: string;
  onActionSaved?: () => void;
}

function formatBangkokDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return isoString;
  }
}

function toLocalDatetimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${min}`;
}

export default function ActionsTakenSection({
  ticketId,
  isStaff,
  ticketStatus,
  onActionSaved,
}: ActionsTakenSectionProps) {
  const [actions, setActions] = useState<ActionTaken[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staleBanner, setStaleBanner] = useState<string | null>(null);

  // Add Action Form State
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientRequestId, setClientRequestId] = useState<string>("");

  const [formActionAt, setFormActionAt] = useState<string>("");
  const [formStatus, setFormStatus] = useState<"PLANNED" | "COMPLETED">("PLANNED");
  const [formAssigneeId, setFormAssigneeId] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formResult, setFormResult] = useState<string>("");
  const [formFollowUpRequired, setFormFollowUpRequired] = useState(false);
  const [formFollowUpNote, setFormFollowUpNote] = useState<string>("");
  const [formAttachmentNotes, setFormAttachmentNotes] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Complete Action Modal State
  const [completingAction, setCompletingAction] = useState<ActionTaken | null>(null);
  const [completeResult, setCompleteResult] = useState<string>("");
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [isCompletingSubmitting, setIsCompletingSubmitting] = useState(false);

  // Edit Action Modal State
  const [editingAction, setEditingAction] = useState<ActionTaken | null>(null);
  const [editActionAt, setEditActionAt] = useState<string>("");
  const [editAssigneeId, setEditAssigneeId] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editResult, setEditResult] = useState<string>("");
  const [editFollowUpRequired, setEditFollowUpRequired] = useState(false);
  const [editFollowUpNote, setEditFollowUpNote] = useState<string>("");
  const [editAttachmentNotes, setEditAttachmentNotes] = useState<string>("");
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Cancel Confirmation Modal State
  const [cancellingAction, setCancellingAction] = useState<ActionTaken | null>(null);
  const [isCancellingSubmitting, setIsCancellingSubmitting] = useState(false);

  // Ref to trigger focus
  const addFormRef = useRef<HTMLDivElement>(null);

  const fetchActions = useCallback(async () => {
    try {
      setError(null);
      const data = await getActionsTaken(ticketId);
      setActions(data);
    } catch (err: any) {
      setError(err.message || "Failed to load actions taken");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  useEffect(() => {
    if (isStaff) {
      getStaffUsers()
        .then((users) => {
          setStaffUsers(users.filter((u) => u.isActive));
        })
        .catch(() => {});
    }
  }, [isStaff]);

  const handleOpenAddForm = () => {
    setClientRequestId(crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
    setFormActionAt(toLocalDatetimeString(new Date()));
    setFormStatus(ticketStatus === "RESOLVED" ? "COMPLETED" : "PLANNED");
    setFormAssigneeId("");
    setFormDescription("");
    setFormResult("");
    setFormFollowUpRequired(false);
    setFormFollowUpNote("");
    setFormAttachmentNotes("");
    setFieldErrors({});
    setIsAdding(true);
    setTimeout(() => {
      if (typeof addFormRef.current?.scrollIntoView === "function") {
        addFormRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 50);
  };

  const handleCloseAddForm = () => {
    setIsAdding(false);
    setFieldErrors({});
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setError(null);

    // Client-side quick checks
    const errors: Record<string, string> = {};
    if (!formDescription.trim()) {
      errors.description = "Action description is required.";
    } else if (formDescription.trim().length > 2000) {
      errors.description = "Action description cannot exceed 2000 characters.";
    }

    if (formStatus === "COMPLETED" && !formResult.trim()) {
      errors.result = "Result is required when action is marked Completed.";
    }

    if (formFollowUpRequired && !formFollowUpNote.trim()) {
      errors.followUpNote = "Follow-up note is required when follow-up is requested.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        description: formDescription.trim(),
        status: formStatus,
        followUpRequired: formFollowUpRequired,
        clientRequestId,
      };

      if (formActionAt) {
        payload.actionAt = new Date(formActionAt).toISOString();
      }
      if (formResult.trim()) {
        payload.result = formResult.trim();
      }
      if (formFollowUpRequired && formFollowUpNote.trim()) {
        payload.followUpNote = formFollowUpNote.trim();
      }
      if (formAttachmentNotes.trim()) {
        payload.attachmentNotes = formAttachmentNotes.trim();
      }
      if (formAssigneeId) {
        payload.assigneeId = Number(formAssigneeId);
      }

      await createActionTaken(ticketId, payload);
      setIsAdding(false);
      await fetchActions();
      onActionSaved?.();
    } catch (err: any) {
      if (err instanceof ApiError && err.fields) {
        setFieldErrors(err.fields);
      } else {
        setError(err.message || "Failed to create action taken.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Complete Modal
  const handleOpenCompleteModal = (action: ActionTaken) => {
    setCompletingAction(action);
    setCompleteResult(action.result || "");
    setCompleteError(null);
  };

  const handleCompleteSubmit = async () => {
    if (!completingAction) return;
    if (!completeResult.trim()) {
      setCompleteError("Result is required to complete an action.");
      return;
    }

    setIsCompletingSubmitting(true);
    setCompleteError(null);
    try {
      await updateActionTaken(ticketId, completingAction.id, {
        status: "COMPLETED",
        result: completeResult.trim(),
        expectedVersion: completingAction.version,
      });
      setCompletingAction(null);
      await fetchActions();
      onActionSaved?.();
    } catch (err: any) {
      if (err.code === "STALE_UPDATE" || err.status === 409) {
        setStaleBanner("This action was modified by another user. Please reload the latest actions.");
        setCompletingAction(null);
      } else {
        setCompleteError(err.message || "Failed to complete action.");
      }
    } finally {
      setIsCompletingSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (action: ActionTaken) => {
    setEditingAction(action);
    setEditActionAt(action.actionAt ? toLocalDatetimeString(new Date(action.actionAt)) : "");
    setEditAssigneeId(action.assigneeId ? String(action.assigneeId) : "");
    setEditDescription(action.description || "");
    setEditResult(action.result || "");
    setEditFollowUpRequired(action.followUpRequired);
    setEditFollowUpNote(action.followUpNote || "");
    setEditAttachmentNotes(action.attachmentNotes || "");
    setEditErrors({});
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAction) return;
    setEditErrors({});

    const errors: Record<string, string> = {};
    if (!editDescription.trim()) {
      errors.description = "Action description is required.";
    }
    if (editFollowUpRequired && !editFollowUpNote.trim()) {
      errors.followUpNote = "Follow-up note is required when follow-up is requested.";
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setIsEditSubmitting(true);
    try {
      const payload: any = {
        description: editDescription.trim(),
        followUpRequired: editFollowUpRequired,
        expectedVersion: editingAction.version,
      };

      if (editActionAt) {
        payload.actionAt = new Date(editActionAt).toISOString();
      }
      if (editResult.trim()) {
        payload.result = editResult.trim();
      }
      if (editFollowUpRequired && editFollowUpNote.trim()) {
        payload.followUpNote = editFollowUpNote.trim();
      }
      if (editAttachmentNotes.trim()) {
        payload.attachmentNotes = editAttachmentNotes.trim();
      }
      payload.assigneeId = editAssigneeId ? Number(editAssigneeId) : null;

      await updateActionTaken(ticketId, editingAction.id, payload);
      setEditingAction(null);
      await fetchActions();
      onActionSaved?.();
    } catch (err: any) {
      if (err.code === "STALE_UPDATE" || err.status === 409) {
        setStaleBanner("This action was modified by another user. Please reload the latest actions.");
        setEditingAction(null);
      } else if (err instanceof ApiError && err.fields) {
        setEditErrors(err.fields);
      } else {
        setEditErrors({ form: err.message || "Failed to update action." });
      }
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Open Cancel Modal
  const handleOpenCancelModal = (action: ActionTaken) => {
    setCancellingAction(action);
  };

  const handleCancelSubmit = async () => {
    if (!cancellingAction) return;
    setIsCancellingSubmitting(true);
    try {
      await updateActionTaken(ticketId, cancellingAction.id, {
        status: "CANCELLED",
        expectedVersion: cancellingAction.version,
      });
      setCancellingAction(null);
      await fetchActions();
      onActionSaved?.();
    } catch (err: any) {
      if (err.code === "STALE_UPDATE" || err.status === 409) {
        setStaleBanner("This action was modified by another user. Please reload the latest actions.");
      } else {
        setError(err.message || "Failed to cancel action.");
      }
      setCancellingAction(null);
    } finally {
      setIsCancellingSubmitting(false);
    }
  };

  const isTicketLocked = ticketStatus === "CLOSED" || ticketStatus === "CANCELLED";

  return (
    <div className="card shadow-sm mb-4" data-testid="actions-taken-section">
      <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 border-bottom">
        <div>
          <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
            <FileText size={18} className="text-success" />
            {isStaff ? "Actions Taken" : "Work Performed by IT"}
          </h5>
          <small className="text-muted">
            {isStaff
              ? "Record, manage, and complete service tasks on this ticket."
              : "Summary of technical actions and diagnostic steps recorded by IT Staff."}
          </small>
        </div>

        {isStaff && !isTicketLocked && (
          <button
            type="button"
            className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1"
            onClick={handleOpenAddForm}
            disabled={isAdding}
            data-testid="add-action-button"
          >
            <Plus size={16} /> Add Action
          </button>
        )}
      </div>

      <div className="card-body">
        {/* Stale Conflict Banner */}
        {staleBanner && (
          <div className="alert alert-warning d-flex justify-content-between align-items-center mb-3" role="alert">
            <div className="d-flex align-items-center gap-2">
              <AlertCircle size={18} className="text-warning" />
              <span>{staleBanner}</span>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-dark d-inline-flex align-items-center gap-1"
              onClick={() => {
                setStaleBanner(null);
                fetchActions();
                onActionSaved?.();
              }}
            >
              <RefreshCw size={14} /> Reload
            </button>
          </div>
        )}

        {/* Global Error Alert */}
        {error && (
          <div className="alert alert-danger mb-3 d-flex align-items-center gap-2" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Inline Add Action Form for Staff */}
        {isStaff && isAdding && (
          <div
            ref={addFormRef}
            className="card mb-4 border-success-subtle bg-light shadow-sm"
            data-testid="add-action-form"
          >
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0 text-success">New Action Taken</h6>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-muted p-0"
                  onClick={handleCloseAddForm}
                  aria-label="Cancel adding action"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} noValidate>
                <div className="row g-3">
                  {/* Action Date/Time */}
                  <div className="col-md-6">
                    <label htmlFor="action-date-input" className="form-label small fw-semibold">
                      Action Date / Time
                    </label>
                    <input
                      id="action-date-input"
                      type="datetime-local"
                      className={`form-control form-control-sm ${fieldErrors.actionAt ? "is-invalid" : ""}`}
                      value={formActionAt}
                      onChange={(e) => setFormActionAt(e.target.value)}
                      aria-describedby={fieldErrors.actionAt ? "action-date-error" : undefined}
                    />
                    {fieldErrors.actionAt && (
                      <div id="action-date-error" className="invalid-feedback small" role="alert">
                        {fieldErrors.actionAt}
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="col-md-6">
                    <label htmlFor="action-status-select" className="form-label small fw-semibold">
                      Action Status
                    </label>
                    <select
                      id="action-status-select"
                      className="form-select form-select-sm"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as "PLANNED" | "COMPLETED")}
                    >
                      {ticketStatus !== "RESOLVED" && <option value="PLANNED">Planned</option>}
                      <option value="COMPLETED">Completed</option>
                    </select>
                    {ticketStatus === "RESOLVED" && (
                      <div className="form-text small text-muted">
                        Planned actions cannot be added to a Resolved ticket.
                      </div>
                    )}
                  </div>

                  {/* Assignee */}
                  <div className="col-md-6">
                    <label htmlFor="action-assignee-select" className="form-label small fw-semibold">
                      Assignee (Staff / Admin)
                    </label>
                    <select
                      id="action-assignee-select"
                      className={`form-select form-select-sm ${fieldErrors.assigneeId ? "is-invalid" : ""}`}
                      value={formAssigneeId}
                      onChange={(e) => setFormAssigneeId(e.target.value)}
                      aria-describedby={fieldErrors.assigneeId ? "action-assignee-error" : undefined}
                    >
                      <option value="">(Self / Creator defaults as assignee)</option>
                      {staffUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role === "ADMINISTRATOR" ? "Admin" : "IT Staff"})
                        </option>
                      ))}
                    </select>
                    {fieldErrors.assigneeId && (
                      <div id="action-assignee-error" className="invalid-feedback small" role="alert">
                        {fieldErrors.assigneeId}
                      </div>
                    )}
                  </div>

                  {/* Performed by (Read-only badge) */}
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Performed by</label>
                    <div
                      className="form-control form-control-sm text-muted"
                      style={{ backgroundColor: "var(--zg-readonly-bg, #f3f5f4)" }}
                    >
                      Current User (Session Creator)
                    </div>
                  </div>

                  {/* Description */}
                  <div className="col-12">
                    <label htmlFor="action-description-input" className="form-label small fw-semibold">
                      Description <span className="text-danger">*</span>
                    </label>
                    <textarea
                      id="action-description-input"
                      className={`form-control form-control-sm ${fieldErrors.description ? "is-invalid" : ""}`}
                      rows={3}
                      placeholder="Describe technical investigation or actions taken..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      aria-describedby={fieldErrors.description ? "action-desc-error" : undefined}
                      required
                    />
                    {fieldErrors.description && (
                      <div id="action-desc-error" className="invalid-feedback small" role="alert">
                        {fieldErrors.description}
                      </div>
                    )}
                  </div>

                  {/* Result (mandatory for Completed) */}
                  <div className="col-12">
                    <label htmlFor="action-result-input" className="form-label small fw-semibold">
                      Result {formStatus === "COMPLETED" && <span className="text-danger">*</span>}
                    </label>
                    <textarea
                      id="action-result-input"
                      className={`form-control form-control-sm ${fieldErrors.result ? "is-invalid" : ""}`}
                      rows={2}
                      placeholder={
                        formStatus === "COMPLETED"
                          ? "State outcome, findings, or resolution achieved..."
                          : "Optional while planned..."
                      }
                      value={formResult}
                      onChange={(e) => setFormResult(e.target.value)}
                      aria-describedby={fieldErrors.result ? "action-result-error" : undefined}
                    />
                    {fieldErrors.result && (
                      <div id="action-result-error" className="invalid-feedback small" role="alert">
                        {fieldErrors.result}
                      </div>
                    )}
                  </div>

                  {/* Follow-up Required Checkbox */}
                  <div className="col-12">
                    <div className="form-check">
                      <input
                        id="action-followup-checkbox"
                        type="checkbox"
                        className="form-check-input"
                        checked={formFollowUpRequired}
                        onChange={(e) => setFormFollowUpRequired(e.target.checked)}
                      />
                      <label htmlFor="action-followup-checkbox" className="form-check-label small fw-semibold">
                        Follow-Up Required
                      </label>
                    </div>
                  </div>

                  {/* Follow-up Note (conditionally visible) */}
                  {formFollowUpRequired && (
                    <div className="col-12">
                      <label htmlFor="action-followup-note-input" className="form-label small fw-semibold">
                        Follow-Up Note <span className="text-danger">*</span>
                      </label>
                      <textarea
                        id="action-followup-note-input"
                        className={`form-control form-control-sm ${fieldErrors.followUpNote ? "is-invalid" : ""}`}
                        rows={2}
                        placeholder="Detail follow-up task, scheduling, or dependencies..."
                        value={formFollowUpNote}
                        onChange={(e) => setFormFollowUpNote(e.target.value)}
                        aria-describedby={fieldErrors.followUpNote ? "action-followup-error" : undefined}
                        required
                      />
                      {fieldErrors.followUpNote && (
                        <div id="action-followup-error" className="invalid-feedback small" role="alert">
                          {fieldErrors.followUpNote}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Attachment Notes */}
                  <div className="col-12">
                    <label htmlFor="action-attach-notes-input" className="form-label small fw-semibold">
                      Attachment Notes (Optional)
                    </label>
                    <input
                      id="action-attach-notes-input"
                      type="text"
                      className={`form-control form-control-sm ${fieldErrors.attachmentNotes ? "is-invalid" : ""}`}
                      placeholder="Notes referencing diagnostic files or screenshots..."
                      value={formAttachmentNotes}
                      onChange={(e) => setFormAttachmentNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-3 pt-2 border-top">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={handleCloseAddForm}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary"
                    disabled={isSubmitting}
                    data-testid="save-action-button"
                  >
                    {isSubmitting ? "Saving..." : "Save Action"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="text-center py-4 text-muted small">Loading actions taken...</div>
        ) : actions.length === 0 ? (
          /* Empty State */
          <div className="text-center py-4 text-muted small border rounded-2 bg-light">
            {isStaff
              ? "No actions taken recorded yet. Click '+ Add Action' above to log diagnostic work."
              : "No work actions recorded yet."}
          </div>
        ) : (
          /* Actions Taken List (Desktop Table / Mobile Stack) */
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.875rem" }}>
              <thead className="table-light">
                <tr>
                  <th scope="col" style={{ width: "15%" }}>
                    Date
                  </th>
                  <th scope="col" style={{ width: "12%" }}>
                    Status
                  </th>
                  <th scope="col" style={{ width: "25%" }}>
                    Description
                  </th>
                  <th scope="col" style={{ width: "20%" }}>
                    Result
                  </th>
                  <th scope="col" style={{ width: "15%" }}>
                    Personnel
                  </th>
                  {isStaff && (
                    <th scope="col" className="text-end" style={{ width: "13%" }}>
                      Controls
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {actions.map((act) => (
                  <tr key={act.id} data-testid={`action-row-${act.id}`}>
                    {/* Date */}
                    <td>
                      <div className="fw-semibold text-dark">{formatBangkokDate(act.actionAt)}</div>
                      {act.attachmentNotes && (
                        <small className="text-muted d-block text-truncate" style={{ maxWidth: 160 }}>
                          Ref: {act.attachmentNotes}
                        </small>
                      )}
                    </td>

                    {/* Status & Indicators */}
                    <td>
                      {act.status === "COMPLETED" && (
                        <span className="badge rounded-pill bg-success-subtle text-success-emphasis border border-success-subtle d-inline-flex align-items-center gap-1">
                          <CheckCircle2 size={12} /> Completed
                        </span>
                      )}
                      {act.status === "PLANNED" && (
                        <span className="badge rounded-pill bg-info-subtle text-info-emphasis border border-info-subtle d-inline-flex align-items-center gap-1">
                          <Clock size={12} /> Planned
                        </span>
                      )}
                      {act.status === "CANCELLED" && (
                        <span className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle d-inline-flex align-items-center gap-1">
                          <XCircle size={12} /> Cancelled
                        </span>
                      )}
                      {act.followUpRequired && (
                        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle d-inline-flex align-items-center gap-1 mt-1">
                          <Flag size={10} /> Follow-Up
                        </span>
                      )}
                    </td>

                    {/* Description */}
                    <td>
                      <div className="text-dark" style={{ whiteSpace: "pre-wrap" }}>
                        {act.description}
                      </div>
                      {act.followUpRequired && act.followUpNote && (
                        <div className="mt-1 small text-warning-emphasis bg-warning-subtle p-1 rounded border border-warning-subtle">
                          <strong>Note:</strong> {act.followUpNote}
                        </div>
                      )}
                    </td>

                    {/* Result */}
                    <td>
                      {act.result ? (
                        <span className="text-dark" style={{ whiteSpace: "pre-wrap" }}>
                          {act.result}
                        </span>
                      ) : (
                        <span className="text-muted fst-italic">None</span>
                      )}
                    </td>

                    {/* Personnel */}
                    <td>
                      <div className="small">
                        <span className="text-muted">Assigned: </span>
                        <strong>{act.assignee ? act.assignee.name : "Unassigned"}</strong>
                      </div>
                      <div className="small text-muted">
                        Performed: {act.performedBy?.name || "System"}
                      </div>
                      {act.status === "COMPLETED" && act.completedBy && (
                        <div className="small text-success fw-semibold">
                          Completed by: {act.completedBy.name}
                        </div>
                      )}
                    </td>

                    {/* Controls for Staff */}
                    {isStaff && (
                      <td className="text-end">
                        {act.status === "PLANNED" && !isTicketLocked ? (
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-success btn-sm"
                              title="Mark Completed"
                              onClick={() => handleOpenCompleteModal(act)}
                              data-testid={`complete-action-btn-${act.id}`}
                            >
                              <Check size={14} /> Complete
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              title="Edit Action"
                              onClick={() => handleOpenEditModal(act)}
                              data-testid={`edit-action-btn-${act.id}`}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              title="Cancel Action"
                              onClick={() => handleOpenCancelModal(act)}
                              data-testid={`cancel-action-btn-${act.id}`}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted small fst-italic">Immutable</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Complete Action Modal */}
      {completingAction && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="complete-action-title"
          onKeyDown={(e) => {
            if (e.key === "Escape") setCompletingAction(null);
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 id="complete-action-title" className="modal-title fw-bold text-success">
                  Complete Action Taken
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setCompletingAction(null)}
                  aria-label="Close modal"
                />
              </div>
              <div className="modal-body">
                <p className="small text-muted mb-2">
                  Completing planned action: <strong>{completingAction.description}</strong>
                </p>
                {completeError && (
                  <div className="alert alert-danger py-2 small" role="alert">
                    {completeError}
                  </div>
                )}
                <div className="mb-3">
                  <label htmlFor="complete-result-input" className="form-label small fw-semibold">
                    Result / Outcome <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="complete-result-input"
                    className="form-control form-control-sm"
                    rows={3}
                    placeholder="Enter what was done and the result..."
                    value={completeResult}
                    onChange={(e) => setCompleteResult(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setCompletingAction(null)}
                  disabled={isCompletingSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-success"
                  onClick={handleCompleteSubmit}
                  disabled={isCompletingSubmitting}
                  data-testid="confirm-complete-action-btn"
                >
                  {isCompletingSubmitting ? "Saving..." : "Confirm Complete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Action Modal */}
      {editingAction && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-action-title"
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditingAction(null);
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 id="edit-action-title" className="modal-title fw-bold">
                  Edit Planned Action
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setEditingAction(null)}
                  aria-label="Close modal"
                />
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body">
                  {editErrors.form && (
                    <div className="alert alert-danger py-2 small" role="alert">
                      {editErrors.form}
                    </div>
                  )}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="edit-action-date-input" className="form-label small fw-semibold">
                        Action Date / Time
                      </label>
                      <input
                        id="edit-action-date-input"
                        type="datetime-local"
                        className="form-control form-control-sm"
                        value={editActionAt}
                        onChange={(e) => setEditActionAt(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="edit-action-assignee-select" className="form-label small fw-semibold">
                        Assignee
                      </label>
                      <select
                        id="edit-action-assignee-select"
                        className="form-select form-select-sm"
                        value={editAssigneeId}
                        onChange={(e) => setEditAssigneeId(e.target.value)}
                      >
                        <option value="">(Unassigned)</option>
                        {staffUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label htmlFor="edit-action-desc-input" className="form-label small fw-semibold">
                        Description <span className="text-danger">*</span>
                      </label>
                      <textarea
                        id="edit-action-desc-input"
                        className={`form-control form-control-sm ${editErrors.description ? "is-invalid" : ""}`}
                        rows={3}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        required
                      />
                      {editErrors.description && (
                        <div className="invalid-feedback small">{editErrors.description}</div>
                      )}
                    </div>
                    <div className="col-12">
                      <label htmlFor="edit-action-result-input" className="form-label small fw-semibold">
                        Result (Optional while planned)
                      </label>
                      <textarea
                        id="edit-action-result-input"
                        className="form-control form-control-sm"
                        rows={2}
                        value={editResult}
                        onChange={(e) => setEditResult(e.target.value)}
                      />
                    </div>
                    <div className="col-12">
                      <div className="form-check">
                        <input
                          id="edit-action-followup-checkbox"
                          type="checkbox"
                          className="form-check-input"
                          checked={editFollowUpRequired}
                          onChange={(e) => setEditFollowUpRequired(e.target.checked)}
                        />
                        <label htmlFor="edit-action-followup-checkbox" className="form-check-label small fw-semibold">
                          Follow-Up Required
                        </label>
                      </div>
                    </div>
                    {editFollowUpRequired && (
                      <div className="col-12">
                        <label htmlFor="edit-action-followup-note-input" className="form-label small fw-semibold">
                          Follow-Up Note <span className="text-danger">*</span>
                        </label>
                        <textarea
                          id="edit-action-followup-note-input"
                          className={`form-control form-control-sm ${editErrors.followUpNote ? "is-invalid" : ""}`}
                          rows={2}
                          value={editFollowUpNote}
                          onChange={(e) => setEditFollowUpNote(e.target.value)}
                          required
                        />
                        {editErrors.followUpNote && (
                          <div className="invalid-feedback small">{editErrors.followUpNote}</div>
                        )}
                      </div>
                    )}
                    <div className="col-12">
                      <label htmlFor="edit-action-attachment-notes" className="form-label small fw-semibold">
                        Attachment Notes
                      </label>
                      <input
                        id="edit-action-attachment-notes"
                        type="text"
                        className="form-control form-control-sm"
                        value={editAttachmentNotes}
                        onChange={(e) => setEditAttachmentNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setEditingAction(null)}
                    disabled={isEditSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary"
                    disabled={isEditSubmitting}
                    data-testid="save-edit-action-btn"
                  >
                    {isEditSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Action Confirmation Modal */}
      {cancellingAction && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-action-title"
          onKeyDown={(e) => {
            if (e.key === "Escape") setCancellingAction(null);
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 id="cancel-action-title" className="modal-title fw-bold text-danger">
                  Cancel Planned Action
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setCancellingAction(null)}
                  aria-label="Close modal"
                />
              </div>
              <div className="modal-body">
                <p className="mb-0">
                  Are you sure you want to cancel this planned action? Once cancelled, this action record cannot be reopened or edited.
                </p>
                <div className="p-2 bg-light rounded mt-2 small text-muted">
                  <strong>Description:</strong> {cancellingAction.description}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setCancellingAction(null)}
                  disabled={isCancellingSubmitting}
                >
                  Keep Action
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={handleCancelSubmit}
                  disabled={isCancellingSubmitting}
                  data-testid="confirm-cancel-action-btn"
                >
                  {isCancellingSubmitting ? "Cancelling..." : "Confirm Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
