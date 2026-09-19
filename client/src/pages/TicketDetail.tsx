import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  ArrowUp,
  Minus,
  ArrowDown,
  CircleDot,
  Clock,
  CheckCircle2,
  MessageSquare,
  Send,
  Check,
} from "lucide-react";
import {
  getTicketDetail,
  getPublicComments,
  postPublicComment,
  indicateProblemResolved,
  type TicketDetail as TicketDetailType,
  type PublicComment,
} from "../api.js";
import { useRequester } from "../context/RequesterContext.js";
import { useAuth } from "../context/AuthContext.js";
import AttachmentSection from "../components/AttachmentSection.js";

function PriorityBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted small">None</span>;
  if (value === "HIGH")
    return (
      <span className="zg-badge zg-badge-high">
        <ArrowUp aria-hidden="true" /> High
      </span>
    );
  if (value === "LOW")
    return (
      <span className="zg-badge zg-badge-low">
        <ArrowDown aria-hidden="true" /> Low
      </span>
    );
  return (
    <span className="zg-badge zg-badge-medium">
      <Minus aria-hidden="true" /> Medium
    </span>
  );
}

function StatusBadge({ value }: { value: string }) {
  if (value === "RESOLVED" || value === "CLOSED")
    return (
      <span className="zg-badge zg-badge-status-resolved">
        <CheckCircle2 size={12} aria-hidden="true" /> {value}
      </span>
    );
  if (value === "OPEN" || value === "IN_PROGRESS" || value === "PENDING")
    return (
      <span className="zg-badge zg-badge-status-progress">
        <Clock size={12} aria-hidden="true" /> {value.replace("_", " ")}
      </span>
    );
  return (
    <span className="zg-badge zg-badge-status-new">
      <CircleDot size={12} aria-hidden="true" /> {value}
    </span>
  );
}

function CommentRoleBadge({ role }: { role: string }) {
  if (role === "IT_STAFF") {
    return (
      <span
        className="badge ms-2"
        style={{ backgroundColor: "#006B3C", color: "#FFFFFF", fontSize: "0.75rem" }}
      >
        IT Staff
      </span>
    );
  }
  if (role === "ADMINISTRATOR") {
    return (
      <span
        className="badge ms-2"
        style={{ backgroundColor: "#4A235A", color: "#FFFFFF", fontSize: "0.75rem" }}
      >
        Admin
      </span>
    );
  }
  return (
    <span
      className="badge ms-2"
      style={{
        border: "1px solid #6C757D",
        color: "#495057",
        backgroundColor: "transparent",
        fontSize: "0.75rem",
      }}
    >
      Requester
    </span>
  );
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const { requester } = useRequester();
  const { user } = useAuth();

  const effectiveRequesterId = user?.id || requester?.id || 0;

  const [ticket, setTicket] = useState<TicketDetailType | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "notFound" | "error">("loading");

  // Public Comments State
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Problem Resolved State
  const [isResolving, setIsResolving] = useState(false);
  const [showConfirmResolve, setShowConfirmResolve] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  function fetchTicket() {
    if (!effectiveRequesterId || !id) return;
    setLoadState("loading");
    getTicketDetail(effectiveRequesterId, Number(id))
      .then((data) => {
        setTicket(data);
        setLoadState("loaded");
        loadComments(Number(id));
      })
      .catch((err) => {
        if (err.message === "NOT_FOUND") {
          setLoadState("notFound");
        } else {
          setLoadState("error");
        }
      });
  }

  function loadComments(ticketId: number) {
    getPublicComments(ticketId)
      .then((data) => setComments(data))
      .catch((err) => console.error("Error loading comments:", err));
  }

  useEffect(() => {
    fetchTicket();
  }, [effectiveRequesterId, id]);

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newComment.trim();
    if (!trimmed || !ticket) return;

    setIsSubmittingComment(true);
    setCommentError(null);

    try {
      const added = await postPublicComment(ticket.id, trimmed);
      setComments((prev) => [...prev, added]);
      setNewComment("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to post comment";
      setCommentError(msg);
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function handleIndicateResolved() {
    if (!ticket) return;
    setIsResolving(true);
    setResolveError(null);

    try {
      const result = await indicateProblemResolved(ticket.id);
      setTicket((prev) =>
        prev ? { ...prev, isProblemResolvedIndicated: result.isProblemResolvedIndicated } : prev
      );
      setShowConfirmResolve(false);
      loadComments(ticket.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update ticket";
      setResolveError(msg);
    } finally {
      setIsResolving(false);
    }
  }

  if (loadState === "loading") {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  if (loadState === "notFound") {
    return (
      <div className="zg-state-panel zg-state-error py-5">
        <AlertTriangle size={36} aria-hidden="true" />
        <h1 className="h5">Ticket not found or access denied.</h1>
        <p className="small text-muted mb-3">
          This ticket does not exist or does not belong to the currently selected requester.
        </p>
        <Link to="/tickets" className="btn btn-primary btn-sm">
          Back to My Tickets
        </Link>
      </div>
    );
  }

  if (loadState === "error" || !ticket) {
    return (
      <div className="zg-state-panel zg-state-error py-5">
        <AlertTriangle size={36} aria-hidden="true" />
        <h1 className="h5">Unable to load ticket details.</h1>
        <p className="small text-muted mb-3">Something went wrong. Please try again.</p>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={fetchTicket}>
          Retry
        </button>
      </div>
    );
  }

  const isClosedOrResolved =
    ticket.currentStatus === "RESOLVED" || ticket.currentStatus === "CLOSED";

  return (
    <div>
      {/* Top navigation row with breadcrumb and back button */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="zg-breadcrumb">
          <Link to="/tickets" className="text-decoration-none text-muted">
            My Tickets
          </Link>
          <span aria-hidden="true">›</span>
          <span className="zg-breadcrumb-current">Ticket Details</span>
        </div>
        <Link to="/tickets" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
          <ArrowLeft size={14} aria-hidden="true" /> Back to My Tickets
        </Link>
      </div>

      {/* Read-only ticket information card */}
      <div className="card p-4 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
          <h1 className="h4 mb-0">Ticket Details: {ticket.ticketNumber}</h1>

          {/* Problem Appears Resolved Indicator / Action */}
          <div>
            {ticket.isProblemResolvedIndicated ? (
              <span
                className="badge bg-success d-inline-flex align-items-center gap-1 px-3 py-2"
                style={{ fontSize: "0.85rem" }}
              >
                <Check size={14} aria-hidden="true" /> Problem appears resolved
              </span>
            ) : !isClosedOrResolved ? (
              <button
                type="button"
                className="btn btn-outline-success btn-sm d-inline-flex align-items-center gap-1"
                onClick={() => setShowConfirmResolve(true)}
              >
                <CheckCircle2 size={14} aria-hidden="true" /> Problem Appears Resolved
              </button>
            ) : null}
          </div>
        </div>

        {/* Resolve Confirmation Modal / Dialog */}
        {showConfirmResolve && (
          <div className="alert alert-warning mb-4" role="alert">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h2 className="h6 fw-bold mb-1">Confirm Problem Resolution</h2>
                <p className="small mb-2">
                  Confirm that your issue has been resolved? This will notify IT Staff and post a
                  public update on your ticket.
                </p>
                {resolveError && (
                  <div className="text-danger small mb-2">{resolveError}</div>
                )}
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    disabled={isResolving}
                    onClick={handleIndicateResolved}
                  >
                    {isResolving ? "Confirming..." : "Yes, Problem is Resolved"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    disabled={isResolving}
                    onClick={() => setShowConfirmResolve(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Row 1: System and classification info */}
        <div className="row g-3 mb-3">
          <div className="col-md-3 col-sm-6">
            <label className="form-label fw-semibold small">Ticket No.</label>
            <input
              className="form-control form-control-readonly"
              value={ticket.ticketNumber}
              readOnly
              aria-readonly="true"
            />
          </div>
          <div className="col-md-3 col-sm-6">
            <label className="form-label fw-semibold small">Ticket Date</label>
            <input
              className="form-control form-control-readonly"
              value={new Date(ticket.createdAt).toLocaleString()}
              readOnly
              aria-readonly="true"
            />
          </div>
          <div className="col-md-3 col-sm-6">
            <label className="form-label fw-semibold small">Category</label>
            <input
              className="form-control form-control-readonly"
              value={ticket.categoryName}
              readOnly
              aria-readonly="true"
            />
          </div>
          <div className="col-md-3 col-sm-6">
            <label className="form-label fw-semibold small">Related System</label>
            <input
              className="form-control form-control-readonly"
              value={ticket.relatedSystemName}
              readOnly
              aria-readonly="true"
            />
          </div>
        </div>

        {/* Row 2: Requester, Priorities, Status */}
        <div className="row g-3 mb-4">
          <div className="col-md-3 col-sm-6">
            <label className="form-label fw-semibold small">Requester</label>
            <input
              className="form-control form-control-readonly"
              value={ticket.requesterName}
              readOnly
              aria-readonly="true"
            />
          </div>
          <div className="col-md-3 col-sm-6">
            <label className="form-label fw-semibold small d-block">Requested Priority</label>
            <div className="mt-1">
              <PriorityBadge value={ticket.requestedPriority} />
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <label className="form-label fw-semibold small d-block">IT Priority</label>
            <div className="mt-1">
              <PriorityBadge value={ticket.itPriority} />
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <label className="form-label fw-semibold small d-block">Current Status</label>
            <div className="mt-1">
              <StatusBadge value={ticket.currentStatus} />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-3">
          <label className="form-label fw-semibold small">Summary</label>
          <input
            className="form-control form-control-readonly"
            value={ticket.summary}
            readOnly
            aria-readonly="true"
          />
        </div>

        {/* Description */}
        <div className="mb-2">
          <label className="form-label fw-semibold small">Description</label>
          <textarea
            className="form-control form-control-readonly"
            rows={5}
            value={ticket.description}
            readOnly
            aria-readonly="true"
          />
        </div>
      </div>

      {/* Attachments Section */}
      <AttachmentSection
        ticketId={ticket.id}
        requesterId={effectiveRequesterId}
        attachments={ticket.attachments}
        onAttachmentsUpdated={fetchTicket}
      />

      {/* Public Comments Section */}
      <div className="card p-4 mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h5 mb-0 d-flex align-items-center gap-2">
            <MessageSquare size={18} aria-hidden="true" /> Public Comments
          </h2>
          {ticket.isProblemResolvedIndicated && (
            <span className="badge bg-success" style={{ fontSize: "0.8rem" }}>
              Problem appears resolved
            </span>
          )}
        </div>

        {/* Comments Stream */}
        <div
          className="mb-4 d-flex flex-column gap-3 p-3 rounded"
          style={{ backgroundColor: "#F8F9FA", maxHeight: "400px", overflowY: "auto" }}
        >
          {comments.length === 0 ? (
            <p className="text-muted small mb-0 text-center py-3">
              No public comments yet. Add a comment below to start a conversation.
            </p>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className="bg-white p-3 rounded border shadow-sm"
                data-testid={`comment-item-${c.id}`}
              >
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div className="d-flex align-items-center">
                    <span className="fw-semibold small">{c.author.name}</span>
                    <CommentRoleBadge role={c.author.role} />
                  </div>
                  <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                </div>
                <div
                  className="text-dark small"
                  style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {c.content}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        <form onSubmit={handleAddComment}>
          {commentError && (
            <div className="alert alert-danger py-2 small mb-2">{commentError}</div>
          )}
          <div className="mb-2">
            <label htmlFor="public-comment-input" className="form-label visually-hidden">
              Add a comment
            </label>
            <textarea
              id="public-comment-input"
              className="form-control"
              placeholder="Add a comment..."
              rows={3}
              maxLength={2000}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={isSubmittingComment}
            />
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted small">{newComment.length} / 2000</span>
            <button
              type="submit"
              className="btn btn-primary btn-sm d-flex align-items-center gap-1"
              disabled={!newComment.trim() || isSubmittingComment}
            >
              <Send size={14} aria-hidden="true" />
              {isSubmittingComment ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
