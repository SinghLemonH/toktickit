import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Inbox,
  Search,
  LayoutList,
  AlertTriangle,
  Clock,
  UserCheck,
  Users,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import {
  getStaffDashboard,
  type StaffDashboardData,
  ApiError,
} from "../api.js";
import { useAuth } from "../context/AuthContext.js";
import { formatBangkokDateTime } from "../utils/dateUtils.js";

export default function StaffDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboardData = await getStaffDashboard();
      setData(dashboardData);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 403) {
        setError("Access denied. You do not have permission to view this dashboard.");
      } else {
        setError(err.message || "Unable to load dashboard data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isEmpty =
    data &&
    data.metrics.newTickets === 0 &&
    data.metrics.openTickets === 0 &&
    data.metrics.inProgress === 0 &&
    data.metrics.waitingForRequester === 0 &&
    data.metrics.myAssigned === 0 &&
    data.metrics.unassigned === 0;

  if (loading) {
    return (
      <div className="container py-5">
        <div className="row g-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="col-6 col-md-4 col-lg-2">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div
                    className="placeholder-glow mb-2"
                    style={{ height: "24px", width: "60%" }}
                  >
                    <span className="placeholder col-12 bg-secondary" />
                  </div>
                  <div
                    className="placeholder-glow"
                    style={{ height: "36px", width: "40%" }}
                  >
                    <span className="placeholder col-12 bg-secondary" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <AlertTriangle size={20} />
          <div>
            <strong>Error loading dashboard</strong>
            <div className="small">{error}</div>
          </div>
        </div>
        <button className="btn btn-outline-primary mt-3" onClick={fetchData}>
          <RefreshCw size={16} className="me-1" /> Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const isAdmin = user?.role === "ADMINISTRATOR";

  return (
    <div className="container py-4">
      {/* Welcome Banner */}
      <div className="mb-4">
        <h1 className="h3 fw-bold text-success mb-1">
          Welcome back, {user?.name || "Staff"}
        </h1>
        <p className="text-muted small">
          Here is an overview of the operational queue and your assigned work.
        </p>
      </div>

      {/* Metric Cards Row */}
      <div className="row g-3 mb-4">
        <MetricCard
          title="New"
          count={data.metrics.newTickets}
          link={data.links.newTickets}
          color="primary"
        />
        <MetricCard
          title="Open"
          count={data.metrics.openTickets}
          link={data.links.openTickets}
          color="info"
        />
        <MetricCard
          title="In Progress"
          count={data.metrics.inProgress}
          link={data.links.inProgress}
          color="warning"
        />
        <MetricCard
          title="Waiting for Requester"
          count={data.metrics.waitingForRequester}
          link={data.links.waitingForRequester}
          color="secondary"
        />
        <MetricCard
          title="My Assigned"
          count={data.metrics.myAssigned}
          link={data.links.myAssigned}
          color="success"
        />
        <MetricCard
          title="Unassigned"
          count={data.metrics.unassigned}
          link={data.links.unassigned}
          color="danger"
        />
      </div>

      {/* Empty State */}
      {isEmpty && (
        <div className="alert alert-info d-flex align-items-center gap-3" role="alert">
          <CheckCircle2 size={32} className="text-success" />
          <div>
            <strong>No tickets in queue.</strong>
            <div className="small text-muted">All systems operating smoothly.</div>
          </div>
        </div>
      )}

      {/* Main Section: 2-Column Grid */}
      <div className="row g-4">
        {/* Left Column: Recent Operational Tickets */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                <Clock size={18} className="text-info" />
                Recent Operational Tickets
              </h5>
              <span className="badge bg-light text-muted small">
                Last 7 days
              </span>
            </div>
            <div className="card-body">
              {data.recentTickets.length === 0 ? (
                <p className="text-muted small text-center py-3">
                  No recent ticket activity in the last 7 days.
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Ticket No.</th>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentTickets.map((ticket) => (
                        <tr key={ticket.id}>
                          <td>
                            <Link
                              to={`/staff/queue/${ticket.id}`}
                              className="text-decoration-none fw-medium"
                            >
                              {ticket.ticketNumber}
                            </Link>
                          </td>
                          <td className="fw-medium">{ticket.title}</td>
                          <td>
                            <span className="badge bg-light text-dark">
                              {ticket.currentStatus.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="text-muted small">
                            {formatBangkokDateTime(ticket.updatedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions & User Counts */}
        <div className="col-12 col-lg-4 d-flex flex-column gap-4">
          {/* Quick Actions */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="fw-bold mb-3">Quick Actions</h5>
              <div className="d-grid gap-2">
                <Link
                  to="/staff/queue"
                  className="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2"
                >
                  <Search size={18} /> Search Tickets
                </Link>
                <Link
                  to={data.links.myAssigned}
                  className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2"
                >
                  <LayoutList size={18} /> My Queue
                </Link>
              </div>
            </div>
          </div>

          {/* Administrator Enhancement: User Counts */}
          {isAdmin && data.userCounts && (
            <div className="card shadow-sm">
              <div className="card-header bg-white py-3 border-bottom">
                <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                  <Users size={18} className="text-primary" />
                  User Accounts
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3 text-center">
                  <div className="col-4">
                    <div className="h3 fw-bold mb-0 text-primary">
                      {data.userCounts.totalUsers}
                    </div>
                    <div className="small text-muted">Total</div>
                  </div>
                  <div className="col-4">
                    <div className="h3 fw-bold mb-0 text-success">
                      {data.userCounts.activeUsers}
                    </div>
                    <div className="small text-muted">Active</div>
                  </div>
                  <div className="col-4">
                    <div className="h3 fw-bold mb-0 text-secondary">
                      {data.userCounts.inactiveUsers}
                    </div>
                    <div className="small text-muted">Inactive</div>
                  </div>
                </div>
                <div className="mt-3">
                  <Link
                    to="/admin/users"
                    className="btn btn-sm btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-1"
                  >
                    Manage Users <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  count: number;
  link: string;
  color: "primary" | "secondary" | "success" | "danger" | "warning" | "info";
}

function MetricCard({ title, count, link, color }: MetricCardProps) {
  return (
    <div className="card shadow-sm hover-shadow">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className={`text-${color} mb-0`}>
            {color === "primary" && <Inbox size={20} />}
            {color === "secondary" && <AlertTriangle size={20} />}
            {color === "success" && <UserCheck size={20} />}
            {color === "danger" && <AlertTriangle size={20} />}
            {color === "warning" && <Clock size={20} />}
            {color === "info" && <Inbox size={20} />}
          </div>
          <Link to={link} className="btn btn-sm btn-link text-decoration-none p-0">
            View <ArrowRight size={14} />
          </Link>
        </div>
        <div className="h2 fw-bold mb-1">{count}</div>
        <div className="small text-muted">{title}</div>
      </div>
    </div>
  );
}
