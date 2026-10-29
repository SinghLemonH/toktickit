import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  UserCheck,
  ShieldAlert,
  MessageSquare,
  Lock,
  Paperclip,
  Download,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  getTicketDetail,
  getStaffUsers,
  assignStaffTicket,
  updateTicketItPriority,
  updateTicketStatus,
  getPublicComments,
  postPublicComment,
  getInternalNotes,
  addInternalNote,
  getTicketStatusHistory,
  ApiError,
  type TicketDetail as TicketDetailType,
  type StaffUser,
  type PublicComment,
  type InternalNote,
  type TicketStatusHistoryItem,
} from "../api.js";
import { useAuth } from "../context/AuthContext.js";
import ActionsTakenSection from "../components/ActionsTakenSection.js";
import Modal from "../components/Modal.js";
import { formatBangkokDateTime } from "../utils/dateUtils.js";

function getPriorityBadgeClass(p: string | null) {
  if (p === "HIGH") return "bg-danger text-white";
  if (p === "MEDIUM") return "bg-warning text-dark";
  if (p === "LOW") return "bg-success text-white";
  return "bg-secondary text-white";
}

function getStatusBadgeClass(s: string) {
  switch (s) {
    case "NEW":
      return "bg-primary text-white";
    case "OPEN":
      return "bg-info text-white";
    case "IN_PROGRESS":
      return "bg-warning text-dark";
    case "WAITING_FOR_REQUESTER":
      return "bg-secondary text-white";
    case "RESOLVED":
      return "bg-success text-white";
    case "CLOSED":
      return "bg-dark text-white";
    case "REOPENED":
      return "bg-danger text-white";
    case "CANCELLED":
      return "bg-secondary text-light";
    default:
      return "bg-secondary text-white";
  }
}

function getRoleBadgeClass(role: string) {
  if (role === "ADMINISTRATOR") return "bg-success text-white";
  if (role === "IT_STAFF") return "bg-primary text-white";
  return "bg-secondary text-white";
}

export default function StaffTicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const ticketId = Number(id);

  const [ticket, setTicket] = useState<TicketDetailType | null>(null);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [internalNotes, setInternalNotes] = useState<InternalNote[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Operational controls state
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("MEDIUM");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dual-Channel Tabs: "public" | "internal"
  const [activeTab, setActiveTab] = useState<"public" | "internal">("public");
  const [commentInput, setCommentInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);

  // Status history state
  const [historyItems, setHistoryItems] = useState<TicketStatusHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [staleConflict, setStaleConflict] = useState(false);
  const [gateReasons, setGateReasons] = useState<string[]>([]);

  const loadTicketData = useCallback(async (isInitial = false) => {
    if (Number.isNaN(ticketId)) {
      setError("Invalid ticket ID.");
      setLoading(false);
      return;
    }

    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      setStaleConflict(false);

      // Load ticket details and reference staff
      const [ticketData, staffList] = await Promise.all([
        getTicketDetail(undefined, ticketId),
        getStaffUsers().catch(() => []),
      ]);

      setTicket(ticketData);
      setStaffUsers(staffList);
      setSelectedAssignee(ticketData.assignedToId ? String(ticketData.assignedToId) : "");
      setSelectedPriority(ticketData.itPriority || ticketData.requestedPriority || "MEDIUM");
      setSelectedStatus(ticketData.currentStatus);

      // Load comments, notes, and status audit history
      setHistoryLoading(true);
      const [publicComms, notes, history] = await Promise.all([
        getPublicComments(ticketId).catch(() => []),
        getInternalNotes(ticketId).catch(() => []),
        getTicketStatusHistory(ticketId).catch(() => []),
      ]);

      setComments(publicComms);
      setInternalNotes(notes);
      setHistoryItems(history);
      setHistoryLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to load ticket details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [ticketId]);

  useEffect(() => {
    loadTicketData(true);
  }, [loadTicketData]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  // Operations: Quick Claim Ticket
  async function handleClaimTicket() {
    if (!ticket || !user) return;
    if (ticket.version === undefined) {
      setError("Ticket version is missing. Please reload ticket.");
      return;
    }
    try {
      setStaleConflict(false);
      await assignStaffTicket(ticket.id, user.id, ticket.version);
      await loadTicketData(false);
      showSuccess("You have claimed this ticket.");
    } catch (err: any) {
      if (err instanceof ApiError && err.code === "STALE_UPDATE") {
        setStaleConflict(true);
      } else {
        setError(err.message || "Failed to claim ticket.");
      }
    }
  }

  // Operations: Reassign Ticket
  async function handleReassign() {
    if (!ticket) return;
    if (ticket.version === undefined) {
      setError("Ticket version is missing. Please reload ticket.");
      return;
    }
    const targetId = selectedAssignee ? Number(selectedAssignee) : null;
    try {
      setStaleConflict(false);
      await assignStaffTicket(ticket.id, targetId, ticket.version);
      await loadTicketData(false);
      showSuccess(targetId ? "Ticket reassigned successfully." : "Ticket unassigned.");
    } catch (err: any) {
      if (err instanceof ApiError && err.code === "STALE_UPDATE") {
        setStaleConflict(true);
      } else {
        setError(err.message || "Failed to reassign ticket.");
      }
    }
  }

  // Operations: Update IT Priority
  async function handlePriorityChange() {
    if (!ticket) return;
    try {
      setStaleConflict(false);
      await updateTicketItPriority(ticket.id, selectedPriority);
      await loadTicketData(false);
      showSuccess(`IT Priority updated to ${selectedPriority}.`);
    } catch (err: any) {
      setError(err.message || "Failed to update IT Priority.");
    }
  }

  // Operations: Initiate Status Change Check
  function handleInitiateStatusChange() {
    if (!ticket || !selectedStatus) return;
    setGateReasons([]);
    // If transitioning to RESOLVED, check resolution gate feedback
    if (selectedStatus === "RESOLVED" && ticket.resolutionGate && !ticket.resolutionGate.ok) {
      setGateReasons(ticket.resolutionGate.reasons);
    }
    setIsStatusModalOpen(true);
  }

  // Operations: Confirm Status Change
  async function handleConfirmStatusChange() {
    if (!ticket || !selectedStatus) return;
    if (ticket.version === undefined) {
      setError("Ticket version is missing. Please reload ticket.");
      return;
    }
    try {
      setStaleConflict(false);
      await updateTicketStatus(ticket.id, selectedStatus, ticket.version);
      await loadTicketData(false);
      setIsStatusModalOpen(false);
      setGateReasons([]);
      showSuccess(`Ticket status updated to ${selectedStatus.replace(/_/g, " ")}.`);
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.code === "STALE_UPDATE") {
          setStaleConflict(true);
          setIsStatusModalOpen(false);
          return;
        }
        if (err.code === "RESOLUTION_GATE_NOT_MET" && err.reasons) {
          setGateReasons(err.reasons);
          return;
        }
      }
      setError(err.message || "Failed to change ticket status.");
      setIsStatusModalOpen(false);
    }
  }

  // Dual-Channel: Post Public Comment
  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentInput.trim() || !ticket) return;

    setSubmittingComment(true);
    try {
      const newComment = await postPublicComment(ticket.id, commentInput.trim());
      setComments((prev) => [...prev, newComment]);
      setCommentInput("");
    } catch (err: any) {
      setError(err.message || "Unable to post comment.");
    } finally {
      setSubmittingComment(false);
    }
  }

  // Dual-Channel: Add Internal Note
  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteInput.trim() || !ticket) return;

    setSubmittingNote(true);
    try {
      const newNote = await addInternalNote(ticket.id, noteInput.trim());
      setInternalNotes((prev) => [...prev, newNote]);
      setNoteInput("");
    } catch (err: any) {
      setError(err.message || "Unable to add internal note.");
    } finally {
      setSubmittingNote(false);
    }
  }

  function showSuccess(msg: string) {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
    }
    setActionSuccessMessage(msg);
    successTimerRef.current = setTimeout(() => {
      setActionSuccessMessage(null);
      successTimerRef.current = null;
    }, 4000);
  }

  const validNextStatuses = ticket?.allowedTransitions || [];
  const isTicketLocked = ticket ? ["RESOLVED", "CLOSED", "CANCELLED"].includes(ticket.currentStatus) : false;

  if (loading) {
    return (
      <div className="container py-5 text-center text-muted">
        <div className="spinner-border spinner-border-sm me-2 text-success" role="status" />
        Loading operational ticket details...
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate("/staff/queue")}>
          <ArrowLeft size={14} /> Back to Queue
        </button>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="container-fluid py-2">
      {/* Breadcrumb & Navigation */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <Link to="/staff/queue" className="text-decoration-none text-success">
                Ticket Queue
              </Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {ticket.ticketNumber}
            </li>
          </ol>
        </nav>
        <button
          className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
          onClick={() => navigate("/staff/queue")}
        >
          <ArrowLeft size={14} /> Back to Queue
        </button>
      </div>

      {/* Success / Error Banners */}
      {actionSuccessMessage && (
        <div className="alert alert-success py-2 d-flex align-items-center gap-2" role="alert">
          <CheckCircle2 size={16} /> {actionSuccessMessage}
        </div>
      )}
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      {/* Stale Update / Concurrency Conflict Alert Banner */}
      {staleConflict && (
        <div className="alert alert-warning py-2 d-flex justify-content-between align-items-center" role="alert">
          <div>
            <strong>Record changed by another user.</strong> This ticket was updated concurrently. Please reload to see the latest changes.
          </div>
          <button className="btn btn-outline-dark btn-sm ms-3" onClick={() => loadTicketData(true)}>
            Reload Ticket
          </button>
        </div>
      )}

      {/* Problem Appears Resolved Alert Banner */}
      {ticket.isProblemResolvedIndicated && (
        <div
          className="alert alert-info border-info d-flex align-items-center gap-2 mb-3"
          role="alert"
        >
          <CheckCircle2 size={20} className="text-info flex-shrink-0" />
          <div>
            <strong>Requester indicated that this issue appears resolved.</strong>
            <div className="small">Please verify the resolution and formally close when ready.</div>
          </div>
        </div>
      )}

      <div className="row g-3">
        {/* Left Column: Ticket Info & Operational Controls */}
        <div className="col-12 col-lg-8">
          {/* Main Ticket Information Card */}
          <div className="card shadow-sm border-0 mb-3">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small">Ticket Number:</span>
                <h4 className="fw-bold mb-0 text-success">{ticket.ticketNumber}</h4>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className={`badge ${getStatusBadgeClass(ticket.currentStatus)}`}>
                  {ticket.currentStatus.replace(/_/g, " ")}
                </span>
                <span className={`badge ${getPriorityBadgeClass(ticket.itPriority || ticket.requestedPriority)}`}>
                  {ticket.itPriority || ticket.requestedPriority}
                </span>
              </div>
            </div>
            <div className="card-body">
              <h5 className="fw-bold mb-2">{ticket.summary}</h5>
              <p className="text-secondary mb-4" style={{ whiteSpace: "pre-wrap" }}>
                {ticket.description}
              </p>

              <div className="row g-2 border-top pt-3 small text-muted">
                <div className="col-6 col-md-3">
                  <strong>Requester:</strong>
                  <div>{ticket.requesterName}</div>
                </div>
                <div className="col-6 col-md-3">
                  <strong>Category:</strong>
                  <div>{ticket.categoryName}</div>
                </div>
                <div className="col-6 col-md-3">
                  <strong>Related System:</strong>
                  <div>{ticket.relatedSystemName}</div>
                </div>
                <div className="col-6 col-md-3">
                  <strong>Created At:</strong>
                  <div>{formatBangkokDateTime(ticket.createdAt)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="card shadow-sm border-0 mb-3">
              <div className="card-header bg-white py-2 fw-semibold d-flex align-items-center gap-2">
                <Paperclip size={16} /> Attachments ({ticket.attachments.length})
              </div>
              <ul className="list-group list-group-flush">
                {ticket.attachments.map((att) => (
                  <li
                    key={att.id}
                    className="list-group-item d-flex justify-content-between align-items-center py-2"
                  >
                    <div>
                      <span className="fw-medium">{att.originalFilename}</span>
                      <span className="text-muted small ms-2">
                        ({Math.round(att.sizeBytes / 1024)} KB)
                      </span>
                    </div>
                    {att.removedAt === null ? (
                      <a
                        href={`/api/attachments/${att.id}/download`}
                        className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                        download
                      >
                        <Download size={14} /> Download
                      </a>
                    ) : (
                      <span className="badge bg-secondary">Removed</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions Taken on Ticket (Lab 4) */}
          <div className="mb-3">
            <ActionsTakenSection
              ticketId={ticket.id}
              isStaff={true}
              ticketStatus={ticket.currentStatus}
              onActionSaved={() => loadTicketData(false)}
            />
          </div>

          {/* Dual-Channel Tabs: Public Comments vs Internal Notes */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white p-0 border-bottom">
              <ul className="nav nav-tabs card-header-tabs m-0 border-0" role="tablist">
                <li className="nav-item">
                  <button
                    id="tab-public-comments"
                    role="tab"
                    aria-selected={activeTab === "public"}
                    aria-controls="panel-public-comments"
                    className={`nav-link py-3 px-4 fw-semibold border-0 ${
                      activeTab === "public" ? "active text-success border-bottom border-success border-3" : "text-muted"
                    }`}
                    onClick={() => setActiveTab("public")}
                  >
                    <MessageSquare size={16} className="me-1 inline" /> Public Comments ({comments.length})
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    id="tab-internal-notes"
                    role="tab"
                    aria-selected={activeTab === "internal"}
                    aria-controls="panel-internal-notes"
                    className={`nav-link py-3 px-4 fw-semibold border-0 ${
                      activeTab === "internal"
                        ? "active text-warning-emphasis border-bottom border-warning border-3"
                        : "text-muted"
                    }`}
                    onClick={() => setActiveTab("internal")}
                  >
                    <Lock size={16} className="me-1 inline" /> Internal Notes ({internalNotes.length})
                  </button>
                </li>
              </ul>
            </div>

            <div className="card-body">
              {/* Tab 1: Public Comments */}
              {activeTab === "public" && (
                <div id="panel-public-comments" role="tabpanel" aria-labelledby="tab-public-comments">
                  <div className="mb-3 text-muted small">
                    Public comments are visible to the Requester, IT Staff, and Administrators.
                  </div>

                  <div className="vstack gap-3 mb-4" style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {comments.length === 0 ? (
                      <div className="text-center py-4 text-muted small">No public comments yet.</div>
                    ) : (
                      comments.map((c) => (
                        <div key={c.id} className="p-3 rounded border bg-light">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="fw-semibold small">{c.author.name}</span>
                            <div className="d-flex align-items-center gap-2">
                              <span className={`badge ${getRoleBadgeClass(c.author.role)}`} style={{ fontSize: "0.7rem" }}>
                                {c.author.role.replace(/_/g, " ")}
                              </span>
                              <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                                {formatBangkokDateTime(c.createdAt)}
                              </span>
                            </div>
                          </div>
                          <div className="small text-dark" style={{ whiteSpace: "pre-wrap" }}>
                            {c.content}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Public Comment Form */}
                  <form onSubmit={handlePostComment}>
                    <div className="mb-2">
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Write a public comment for the requester..."
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        maxLength={2000}
                        required
                      />
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="small text-muted">{commentInput.length} / 2000</span>
                      <button
                        type="submit"
                        className="btn btn-success btn-sm"
                        disabled={submittingComment || !commentInput.trim()}
                      >
                        {submittingComment ? "Posting..." : "Post Comment"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab 2: Internal Notes (Amber / Confidential Styling per ui-spec 1.3) */}
              {activeTab === "internal" && (
                <div id="panel-internal-notes" role="tabpanel" aria-labelledby="tab-internal-notes">
                  <div
                    className="p-2 mb-3 rounded border d-flex align-items-center gap-2"
                    style={{ backgroundColor: "#FEF3C7", borderColor: "#D97706", color: "#92400E" }}
                  >
                    <ShieldAlert size={18} className="flex-shrink-0" />
                    <span className="small fw-semibold">
                      Internal Notes are private and never visible to Requesters.
                    </span>
                  </div>

                  <div className="vstack gap-3 mb-4" style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {internalNotes.length === 0 ? (
                      <div className="text-center py-4 text-muted small">No internal notes recorded yet.</div>
                    ) : (
                      internalNotes.map((n) => (
                        <div
                          key={n.id}
                          className="p-3 rounded border"
                          style={{ backgroundColor: "#FEF3C7", borderColor: "#D97706" }}
                        >
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="fw-semibold small text-dark">{n.author.name}</span>
                            <div className="d-flex align-items-center gap-2">
                              <span className="badge text-white" style={{ backgroundColor: "#D97706", fontSize: "0.7rem" }}>
                                Internal Note: Staff Only
                              </span>
                              <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                                {formatBangkokDateTime(n.createdAt)}
                              </span>
                            </div>
                          </div>
                          <div className="small text-dark" style={{ whiteSpace: "pre-wrap" }}>
                            {n.content}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Internal Note Form */}
                  <form onSubmit={handleAddNote}>
                    <div className="mb-2">
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Write a confidential note for IT Staff..."
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        maxLength={2000}
                        required
                      />
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="small text-muted">{noteInput.length} / 2000</span>
                      <button
                        type="submit"
                        className="btn btn-warning btn-sm fw-semibold"
                        disabled={submittingNote || !noteInput.trim()}
                      >
                        {submittingNote ? "Saving..." : "Add Internal Note"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Operational Controls Panel */}
        <div className="col-12 col-lg-4">
          <div className="sticky-lg-top" style={{ top: "1rem", maxHeight: "calc(100vh - 2rem)", overflowY: "auto" }}>
            <div className="card shadow-sm border-0 mb-3">
              <div className="card-header bg-white py-3 fw-bold border-bottom">
                Operational Controls
              </div>
              <div className="card-body">
                {/* 1. Ticket Ownership / Claim / Reassign */}
                <div className="mb-4">
                  <label className="form-label fw-semibold small text-muted mb-1">
                    Ticket Ownership
                  </label>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="small">
                      Owner:{" "}
                      {ticket.assignedTo ? (
                        <strong className="text-dark">{ticket.assignedTo.name}</strong>
                      ) : (
                        <em className="text-muted">Unassigned</em>
                      )}
                    </span>
                    {(!ticket.assignedTo || ticket.assignedTo.id !== user?.id) && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
                        onClick={handleClaimTicket}
                        disabled={isTicketLocked}
                      >
                        <UserCheck size={14} /> Claim Ticket
                      </button>
                    )}
                  </div>

                  <div className="input-group input-group-sm">
                    <select
                      aria-label="Reassign Staff"
                      className="form-select"
                      value={selectedAssignee}
                      onChange={(e) => setSelectedAssignee(e.target.value)}
                      disabled={isTicketLocked}
                    >
                      <option value="">Unassigned</option>
                      {staffUsers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.role === "ADMINISTRATOR" ? "Admin" : "Staff"})
                        </option>
                      ))}
                    </select>
                    <button className="btn btn-secondary" onClick={handleReassign} disabled={isTicketLocked}>
                      Reassign
                    </button>
                  </div>
                  {isTicketLocked && (
                    <div className="small text-muted mt-1">
                      Cannot reassign a resolved, closed, or cancelled ticket.
                    </div>
                  )}
                </div>

                {/* 2. IT Priority */}
                <div className="mb-4">
                  <label className="form-label fw-semibold small text-muted mb-1">IT Priority</label>
                  <div className="input-group input-group-sm">
                    <select
                      aria-label="IT Priority"
                      className="form-select"
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      disabled={isTicketLocked}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                    <button className="btn btn-secondary" onClick={handlePriorityChange} disabled={isTicketLocked}>
                      Update
                    </button>
                  </div>
                  <div className="small text-muted mt-1">
                    Requested Priority: <strong>{ticket.requestedPriority}</strong> (immutable)
                  </div>
                </div>

                {/* 3. Ticket Status */}
                <div className="mb-3">
                  <label htmlFor="ticket-status-select" className="form-label fw-semibold small text-muted mb-1">
                    Ticket Status
                  </label>
                  <div className="input-group input-group-sm">
                    <select
                      id="ticket-status-select"
                      aria-label="Ticket Status"
                      className="form-select"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                      <option value={ticket.currentStatus}>
                        {ticket.currentStatus.replace(/_/g, " ")} (Current)
                      </option>
                      {validNextStatuses.map((st) => (
                        <option key={st} value={st}>
                          {st.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn btn-success"
                      disabled={selectedStatus === ticket.currentStatus}
                      onClick={handleInitiateStatusChange}
                    >
                      Change Status
                    </button>
                  </div>

                  {/* Inline Resolution Gate Alert shown only when RESOLVED is candidate transition */}
                  {(validNextStatuses.includes("RESOLVED") || selectedStatus === "RESOLVED") &&
                    ticket.resolutionGate &&
                    !ticket.resolutionGate.ok && (
                    <div className="alert alert-warning py-2 mt-2 small" role="alert">
                      <div className="fw-semibold mb-1">Resolution Gate:</div>
                      <ul className="mb-0 ps-3">
                        {ticket.resolutionGate.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Status History Audit Trail Card */}
            <div className="card shadow-sm border-0 mb-3">
              <div className="card-header bg-white py-3 fw-bold border-bottom">
                Status History
              </div>
              <div className="card-body p-0">
                {historyLoading ? (
                  <div className="p-3 text-center text-muted small">Loading history...</div>
                ) : historyItems.length === 0 ? (
                  <div className="p-3 text-center text-muted small">No status changes recorded.</div>
                ) : (
                  <ul className="list-group list-group-flush small">
                    {historyItems.map((h) => (
                      <li key={h.id} className="list-group-item py-2 px-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <div>
                            <span className="badge bg-secondary me-1">{h.fromStatus ? h.fromStatus.replace(/_/g, " ") : "ORIGIN"}</span>
                            <span className="text-muted">to</span>{" "}
                            <span className="badge bg-success ms-1">{h.toStatus.replace(/_/g, " ")}</span>
                          </div>
                          <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                            {formatBangkokDateTime(h.changedAt)}
                          </span>
                        </div>
                        <div className="text-muted">
                          by {h.changedBy ? h.changedBy.name : "System"}
                          {h.reason && <span className="ms-1 text-dark">- Reason: {h.reason}</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Change Confirmation Modal with Accessible Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={
          <>
            <AlertTriangle className="text-warning" size={20} /> Confirm Status Change
          </>
        }
        titleId="status-modal-title"
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setIsStatusModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-success btn-sm"
              onClick={handleConfirmStatusChange}
              disabled={selectedStatus === "RESOLVED" && Boolean(ticket.resolutionGate && !ticket.resolutionGate.ok)}
            >
              Confirm Change
            </button>
          </>
        }
      >
        <div>
          {!(selectedStatus === "RESOLVED" && ticket.resolutionGate && !ticket.resolutionGate.ok) && (
            <p className="mb-2">
              Are you sure you want to change ticket status to {selectedStatus.replace(/_/g, " ")}?
            </p>
          )}
          {gateReasons.length > 0 && (
            <div className="alert alert-danger py-2 mt-2 small mb-0" role="alert">
              <div className="fw-semibold mb-1">Cannot resolve ticket: Resolution Gate not satisfied</div>
              <ul className="mb-0 ps-3">
                {gateReasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
