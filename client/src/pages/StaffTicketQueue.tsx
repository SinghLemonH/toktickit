import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, X, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  getStaffTickets,
  getActiveCategories,
  type StaffQueueTicket,
  type Category,
} from "../api.js";
import Pagination from "../components/Pagination.js";

export default function StaffTicketQueue() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<StaffQueueTicket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [reqPriorityFilter, setReqPriorityFilter] = useState("");
  const [itPriorityFilter, setItPriorityFilter] = useState("");
  const [assignedToFilter, setAssignedToFilter] = useState("all");

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  // Load category reference data
  useEffect(() => {
    getActiveCategories()
      .then((data) => setCategories(data))
      .catch((err) => console.error("Error loading categories:", err));
  }, []);

  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getStaffTickets({
        search: debouncedSearch.trim() || undefined,
        status: statusFilter || undefined,
        categoryId: categoryFilter ? Number(categoryFilter) : undefined,
        requestedPriority: reqPriorityFilter || undefined,
        itPriority: itPriorityFilter || undefined,
        assignedTo: assignedToFilter !== "all" ? assignedToFilter : undefined,
        sortBy,
        sortOrder,
        page,
        pageSize,
      });

      const list = response.tickets || (response as any).data || [];
      setTickets(list);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalItems(response.pagination?.totalItems ?? (response.pagination as any)?.total ?? list.length);
    } catch (err: any) {
      setError(err.message || "Unable to load tickets.");
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    statusFilter,
    categoryFilter,
    reqPriorityFilter,
    itPriorityFilter,
    assignedToFilter,
    sortBy,
    sortOrder,
    page,
  ]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, categoryFilter, reqPriorityFilter, itPriorityFilter, assignedToFilter]);

  function handleClearFilters() {
    setSearch("");
    setStatusFilter("");
    setCategoryFilter("");
    setReqPriorityFilter("");
    setItPriorityFilter("");
    setAssignedToFilter("all");
    setPage(1);
  }

  function handleSort(field: string) {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  }

  function getPriorityBadgeClass(p: string | null) {
    if (p === "HIGH") return "bg-danger";
    if (p === "MEDIUM") return "bg-warning text-dark";
    if (p === "LOW") return "bg-success";
    return "bg-secondary";
  }

  function getStatusBadgeClass(s: string) {
    switch (s) {
      case "NEW":
        return "bg-primary";
      case "OPEN":
        return "bg-info text-dark";
      case "IN_PROGRESS":
        return "bg-warning text-dark";
      case "WAITING_FOR_REQUESTER":
        return "bg-secondary";
      case "RESOLVED":
        return "bg-success";
      case "CLOSED":
        return "bg-dark";
      case "REOPENED":
        return "bg-danger";
      case "CANCELLED":
        return "bg-secondary text-light";
      default:
        return "bg-secondary";
    }
  }

  const isFiltered = Boolean(
    search ||
      statusFilter ||
      categoryFilter ||
      reqPriorityFilter ||
      itPriorityFilter ||
      assignedToFilter !== "all"
  );

  return (
    <div className="container-fluid py-2">
      {/* Header & Title */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div>
          <h2 className="mb-0 fw-bold" style={{ color: "var(--bs-primary, #006B3C)" }}>
            Ticket Queue
          </h2>
          <p className="text-muted small mb-0">
            View, prioritize, and manage all incoming IT support requests.
          </p>
        </div>
        {isFiltered && (
          <button
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            onClick={handleClearFilters}
          >
            <X size={14} /> Clear Filters
          </button>
        )}
      </div>

      {/* Toolbar: Search & Filters */}
      <div className="card shadow-sm border-0 mb-4 bg-light">
        <div className="card-body p-3">
          <div className="row g-2">
            {/* Search Input */}
            <div className="col-12 col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0">
                  <Search size={14} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search by ticket number or summary..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="col-6 col-md-2">
              <select
                aria-label="Category Filter"
                className="form-select form-select-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="col-6 col-md-2">
              <select
                aria-label="Status Filter"
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="NEW">New</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="WAITING_FOR_REQUESTER">Waiting for Requester</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
                <option value="REOPENED">Reopened</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* IT Priority Filter */}
            <div className="col-6 col-md-2">
              <select
                aria-label="Priority Filter"
                className="form-select form-select-sm"
                value={itPriorityFilter}
                onChange={(e) => setItPriorityFilter(e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {/* Ownership Filter */}
            <div className="col-6 col-md-2">
              <select
                aria-label="Ownership Filter"
                className="form-select form-select-sm"
                value={assignedToFilter}
                onChange={(e) => setAssignedToFilter(e.target.value)}
              >
                <option value="all">All Tickets</option>
                <option value="me">Assigned to Me</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-5 text-muted">
          <div className="spinner-border spinner-border-sm me-2 text-success" role="status" />
          Loading ticket queue...
        </div>
      ) : tickets.length === 0 ? (
        /* Empty / No-Results State */
        <div className="card border-0 shadow-sm text-center py-5">
          <div className="card-body">
            <Filter size={40} className="text-muted mb-2 opacity-50" />
            <h5 className="fw-bold text-secondary">
              {isFiltered ? "No tickets match your search or filters." : "No tickets in the queue yet."}
            </h5>
            <p className="text-muted small mb-3">
              {isFiltered
                ? "Try clearing or broadening your search criteria."
                : "New requester submissions will appear here automatically."}
            </p>
            {isFiltered && (
              <button className="btn btn-outline-secondary btn-sm" onClick={handleClearFilters}>
                Reset Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View (>= 768px) */}
          <div className="card shadow-sm border-0 d-none d-md-block">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted small text-uppercase">
                  <tr>
                    <th
                      style={{ cursor: "pointer" }}
                      onClick={() => handleSort("ticketNumber")}
                      className="user-select-none"
                    >
                      <span className="d-flex align-items-center gap-1">
                        Ticket No. <ArrowUpDown size={12} />
                      </span>
                    </th>
                    <th
                      style={{ cursor: "pointer" }}
                      onClick={() => handleSort("createdAt")}
                      className="user-select-none"
                    >
                      <span className="d-flex align-items-center gap-1">
                        Created <ArrowUpDown size={12} />
                      </span>
                    </th>
                    <th>Summary</th>
                    <th>Requester</th>
                    <th>Category</th>
                    <th
                      style={{ cursor: "pointer" }}
                      onClick={() => handleSort("requestedPriority")}
                      className="user-select-none"
                    >
                      <span className="d-flex align-items-center gap-1">
                        Req. Prio <ArrowUpDown size={12} />
                      </span>
                    </th>
                    <th
                      style={{ cursor: "pointer" }}
                      onClick={() => handleSort("itPriority")}
                      className="user-select-none"
                    >
                      <span className="d-flex align-items-center gap-1">
                        IT Prio <ArrowUpDown size={12} />
                      </span>
                    </th>
                    <th
                      style={{ cursor: "pointer" }}
                      onClick={() => handleSort("currentStatus")}
                      className="user-select-none"
                    >
                      <span className="d-flex align-items-center gap-1">
                        Status <ArrowUpDown size={12} />
                      </span>
                    </th>
                    <th>Owner</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr
                      key={t.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/staff/tickets/${t.id}`)}
                    >
                      <td className="fw-semibold text-primary">{t.ticketNumber}</td>
                      <td className="small text-muted">
                        {new Date(t.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="fw-normal text-truncate" style={{ maxWidth: "250px" }}>
                        {t.summary}
                        {t.isProblemResolvedIndicated && (
                          <span
                            className="badge bg-success-subtle text-success border border-success-subtle ms-2"
                            style={{ fontSize: "0.7rem" }}
                          >
                            Resolved Indicated
                          </span>
                        )}
                      </td>
                      <td className="small">{t.requester.name}</td>
                      <td className="small text-muted">{t.category.name}</td>
                      <td>
                        <span className={`badge ${getPriorityBadgeClass(t.requestedPriority)}`}>
                          {t.requestedPriority}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getPriorityBadgeClass(t.itPriority)}`}>
                          {t.itPriority || "Not Set"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(t.currentStatus)}`}>
                          {t.currentStatus.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="small">
                        {t.assignedTo ? (
                          <span className="fw-medium text-dark">{t.assignedTo.name}</span>
                        ) : (
                          <span className="text-muted fst-italic">Unassigned</span>
                        )}
                      </td>
                      <td className="text-end" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() => navigate(`/staff/tickets/${t.id}`)}
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View (< 768px) */}
          <div className="d-md-none">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="card border-0 shadow-sm mb-3 p-3"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/staff/tickets/${t.id}`)}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-bold text-primary">{t.ticketNumber}</span>
                  <div className="d-flex gap-1">
                    <span className={`badge ${getPriorityBadgeClass(t.itPriority)}`}>
                      {t.itPriority || t.requestedPriority}
                    </span>
                    <span className={`badge ${getStatusBadgeClass(t.currentStatus)}`}>
                      {t.currentStatus.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
                <h6 className="mb-1 fw-semibold">{t.summary}</h6>
                <div className="text-muted small mb-2">
                  <span>{t.category.name}</span> · <span>{t.requester.name}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center border-top pt-2 mt-1">
                  <span className="small text-muted">
                    Owner:{" "}
                    {t.assignedTo ? (
                      <strong className="text-dark">{t.assignedTo.name}</strong>
                    ) : (
                      <em className="text-muted">Unassigned</em>
                    )}
                  </span>
                  <button
                    className="btn btn-sm btn-outline-success"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/staff/tickets/${t.id}`);
                    }}
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Footer */}
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            showRange={true}
            ariaLabel="Ticket Queue Pagination"
          />
        </>
      )}
    </div>
  );
}
