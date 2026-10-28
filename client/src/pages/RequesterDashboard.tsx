import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LayoutList,
  PlusCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import {
  getRequesterDashboard,
  type RequesterDashboardData,
  ApiError,
} from "../api.js";
import { useAuth } from "../context/AuthContext.js";
import { formatBangkokDateTime } from "../utils/dateUtils.js";

export default function RequesterDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<RequesterDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboardData = await getRequesterDashboard();
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
    data.metrics.myOpenTickets === 0 &&
    data.metrics.waitingForRequester === 0 &&
    data.metrics.inProgress === 0 &&
    data.metrics.resolved === 0 &&
    data.metrics.closed === 0;

  if (loading) {
    return (
      <div className="container py-5">
        <div className="row g-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="col-6 col-md-4 col-lg">
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

  return (
    <div className="container py-4">
      {/* Welcome Banner */}
      <div className="mb-4">
        <h1 className="h3 fw-bold text-success mb-1">
          Welcome back, {user?.name || "Requester"}
        </h1>
        <p className="text-muted small">Here is an overview of your support requests.</p>
      </div>

      {/* Metric Cards Row */}
      <div className="row g-3 mb-4">
        <MetricCard
          title="My Open Tickets"
          count={data.metrics.myOpenTickets}
          link={data.links.myOpenTickets}
          icon={<LayoutList size={20} />}
          color="primary"
        />
        <MetricCard
          title="Waiting for Requester"
          count={data.metrics.waitingForRequester}
          link={data.links.waitingForRequester}
          icon={<AlertTriangle size={20} />}
          color="warning"
        />
        <MetricCard
          title="In Progress"
          count={data.metrics.inProgress}
          link={data.links.inProgress}
          icon={<Clock size={20} />}
          color="info"
        />
        <MetricCard
          title="Resolved"
          count={data.metrics.resolved}
          link={data.links.resolved}
          icon={<CheckCircle2 size={20} />}
          color="success"
        />
        <MetricCard
          title="Closed"
          count={data.metrics.closed}
          link={data.links.closed}
          icon={<XCircle size={20} />}
          color="secondary"
        />
      </div>

      {/* Empty State */}
      {isEmpty && (
        <div className="alert alert-info d-flex align-items-center gap-3" role="alert">
          <CheckCircle2 size={32} className="text-success" />
          <div>
            <strong>You have no active support requests.</strong>
            <div className="small text-muted mb-2">Need assistance? Create a ticket.</div>
            <Link to="/tickets/create" className="btn btn-sm btn-primary">
              <PlusCircle size={14} className="me-1" /> Create Ticket
            </Link>
          </div>
        </div>
      )}

      {/* Content Grid */}
      <div className="row g-4">
        {/* Attention Required */}
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                <AlertTriangle size={18} className="text-warning" />
                Attention Required
              </h5>
              {data.attentionTickets.length > 0 && (
                <Link
                  to={data.links.waitingForRequester}
                  className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                >
                  View All <ArrowRight size={14} />
                </Link>
              )}
            </div>
            <div className="card-body">
              {data.attentionTickets.length === 0 ? (
                <p className="text-muted small text-center py-3">
                  No tickets requiring your attention.
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <tbody>
                      {data.attentionTickets.map((ticket) => (
                        <tr key={ticket.id}>
                          <td>
                            <Link
                              to={`/tickets/${ticket.id}`}
                              className="text-decoration-none fw-medium"
                            >
                              {ticket.ticketNumber}
                            </Link>
                          </td>
                          <td className="fw-medium">{ticket.title}</td>
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

        {/* Right Column */}
        <div className="col-12 col-lg-5 d-flex flex-column gap-4">
          {/* My Recent Tickets */}
          <div className="card shadow-sm">
            <div className="card-header bg-white py-3 border-bottom">
              <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                <Clock size={18} className="text-info" />
                My Recent Tickets
              </h5>
            </div>
            <div className="card-body">
              {data.recentTickets.length === 0 ? (
                <p className="text-muted small text-center py-3">No recent tickets.</p>
              ) : (
                <div className="vstack gap-2">
                  {data.recentTickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      to={`/tickets/${ticket.id}`}
                      className="text-decoration-none p-2 rounded border bg-light hover-bg-light"
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="fw-medium small text-dark">{ticket.ticketNumber}</div>
                          <div className="small text-muted text-truncate" style={{ maxWidth: "200px" }}>
                            {ticket.title}
                          </div>
                        </div>
                        <div className="text-muted small ms-2">
                          {formatBangkokDateTime(ticket.updatedAt)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="fw-bold mb-3">Quick Actions</h5>
              <div className="d-grid gap-2">
                <Link to="/tickets/create" className="btn btn-primary d-flex align-items-center justify-content-center gap-2">
                  <PlusCircle size={18} /> Create Ticket
                </Link>
                <Link to="/tickets" className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2">
                  <LayoutList size={18} /> View My Tickets
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  count: number;
  link: string;
  icon: React.ReactNode;
  color: "primary" | "secondary" | "success" | "danger" | "warning" | "info";
}

function MetricCard({ title, count, link, icon, color }: MetricCardProps) {
  const colorClass = `text-${color}`;
  const bgClass = `bg-${color}-subtle`;

  return (
    <div className="card shadow-sm hover-shadow">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className={`text-${color} mb-0`}>{icon}</div>
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
