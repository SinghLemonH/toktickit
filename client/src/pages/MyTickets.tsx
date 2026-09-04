import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyTickets, type TicketListItem, type MyTicketsQuery } from "../api.js";
import { useRequester } from "../context/RequesterContext.js";

type LoadState = "loading" | "loaded" | "error";

function PriorityBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted small">—</span>;
  const cls =
    value === "HIGH" ? "zg-badge-high" : value === "LOW" ? "zg-badge-low" : "zg-badge-medium";
  return <span className={`zg-badge ${cls}`}>{value}</span>;
}

export default function MyTickets() {
  const { requester } = useRequester();

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [items, setItems] = useState<TicketListItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [requestedPriority, setRequestedPriority] = useState("");
  const [currentStatus, setCurrentStatus] = useState("");
  const [sortBy, setSortBy] = useState<MyTicketsQuery["sortBy"]>("createdAt");
  const [sortDir, setSortDir] = useState<MyTicketsQuery["sortDir"]>("desc");
  const [page, setPage] = useState(1);

  const hasActiveFilters = Boolean(search || requestedPriority || currentStatus);

  useEffect(() => {
    if (!requester) return;
    setLoadState("loading");
    getMyTickets(requester.id, {
      search,
      requestedPriority: requestedPriority || undefined,
      currentStatus: currentStatus || undefined,
      sortBy,
      sortDir,
      page,
      pageSize: 10,
    })
      .then((res) => {
        setItems(res.items);
        setTotalItems(res.totalItems);
        setTotalPages(res.totalPages);
        setLoadState("loaded");
      })
      .catch(() => setLoadState("error"));
    // requester?.id intentionally drives a full reload when the Requester is
    // changed (AC-17) — My Tickets never shows stale data from another Requester.
  }, [requester?.id, search, requestedPriority, currentStatus, sortBy, sortDir, page]);

  function toggleSort(field: NonNullable<MyTicketsQuery["sortBy"]>) {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setRequestedPriority("");
    setCurrentStatus("");
    setPage(1);
  }

  const isEmptyEver = loadState === "loaded" && totalItems === 0 && !hasActiveFilters;
  const isNoResults = loadState === "loaded" && items.length === 0 && hasActiveFilters;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <h1 className="h4 mb-1">My Tickets</h1>
          <p className="text-muted small mb-0">View and track all of your support requests.</p>
        </div>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={clearFilters}>
            Clear Filters
          </button>
          <Link to="/tickets/create" className="btn btn-primary btn-sm">
            + Create Ticket
          </Link>
        </div>
      </div>

      <div className="row g-2 mb-3">
        <div className="col-md-4">
          <input
            className="form-control"
            placeholder="Search by ticket number or summary…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="col-md-4">
          <select
            className="form-select"
            value={requestedPriority}
            onChange={(e) => {
              setRequestedPriority(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
        <div className="col-md-4">
          <select
            className="form-select"
            value={currentStatus}
            onChange={(e) => {
              setCurrentStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {loadState === "loading" && (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading tickets…</span>
          </div>
        </div>
      )}

      {loadState === "error" && (
        <div className="alert alert-danger" role="alert">
          Unable to load your tickets right now. Please try again.
        </div>
      )}

      {isEmptyEver && (
        <div className="text-center py-5">
          <p className="text-muted mb-3">You haven't created any tickets yet.</p>
          <Link to="/tickets/create" className="btn btn-primary">
            Create your first ticket
          </Link>
        </div>
      )}

      {isNoResults && (
        <div className="text-center py-5">
          <p className="text-muted mb-3">No tickets match your search or filters.</p>
          <button type="button" className="btn btn-outline-secondary" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      )}

      {loadState === "loaded" && items.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="table-responsive d-none d-md-block">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th role="button" onClick={() => toggleSort("ticketNumber")}>
                    Ticket No. {sortBy === "ticketNumber" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th role="button" onClick={() => toggleSort("createdAt")}>
                    Created Date {sortBy === "createdAt" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th>Summary</th>
                  <th>Category</th>
                  <th>Requested Priority</th>
                  <th>Current Status</th>
                  <th role="button" onClick={() => toggleSort("updatedAt")}>
                    Last Updated {sortBy === "updatedAt" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Link to={`/tickets/${t.id}`}>{t.ticketNumber}</Link>
                    </td>
                    <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td>{t.summary}</td>
                    <td>{t.categoryName}</td>
                    <td>
                      <PriorityBadge value={t.requestedPriority} />
                    </td>
                    <td>{t.currentStatus}</td>
                    <td>{new Date(t.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="d-md-none">
            {items.map((t) => (
              <Link
                key={t.id}
                to={`/tickets/${t.id}`}
                className="card mb-2 p-3 text-decoration-none text-body"
              >
                <div className="d-flex justify-content-between">
                  <strong>{t.ticketNumber}</strong>
                  <PriorityBadge value={t.requestedPriority} />
                </div>
                <div>{t.summary}</div>
                <div className="text-muted small">
                  {t.categoryName} · {t.currentStatus}
                </div>
              </Link>
            ))}
          </div>

          <div className="d-flex justify-content-between align-items-center mt-3">
            <span className="text-muted small">
              Showing page {page} of {totalPages} ({totalItems} total)
            </span>
            <div className="btn-group">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}