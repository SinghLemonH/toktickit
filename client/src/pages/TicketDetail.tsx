import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle, ArrowUp, Minus, ArrowDown, CircleDot, Clock, CheckCircle2 } from "lucide-react";
import { getTicketDetail, type TicketDetail as TicketDetailType } from "../api.js";
import { useRequester } from "../context/RequesterContext.js";
import AttachmentSection from "../components/AttachmentSection.js";

function PriorityBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted small">—</span>;
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

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const { requester } = useRequester();

  const [ticket, setTicket] = useState<TicketDetailType | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "notFound" | "error">("loading");

  function fetchTicket() {
    if (!requester || !id) return;
    setLoadState("loading");
    getTicketDetail(requester.id, Number(id))
      .then((data) => {
        setTicket(data);
        setLoadState("loaded");
      })
      .catch((err) => {
        if (err.message === "NOT_FOUND") {
          setLoadState("notFound");
        } else {
          setLoadState("error");
        }
      });
  }

  useEffect(() => {
    fetchTicket();
  }, [requester?.id, id]);

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
      <div className="card p-4">
        <h1 className="h4 mb-4">Ticket Details — {ticket.ticketNumber}</h1>

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
        requesterId={requester!.id}
        attachments={ticket.attachments}
        onAttachmentsUpdated={fetchTicket}
      />
    </div>
  );
}
