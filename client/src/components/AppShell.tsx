import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, LayoutList, PlusCircle, UserCircle2, LogOut, Users, Inbox } from "lucide-react";
import { useRequester } from "../context/RequesterContext.js";
import { useAuth } from "../context/AuthContext.js";
import MobileMenu from "./MobileMenu.js";

export default function AppShell({ children }: { children: ReactNode }) {
  const { requester, clearRequester } = useRequester();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    clearRequester();
    await logout();
    navigate("/login");
  }

  function handleChangeRequester() {
    clearRequester();
    navigate("/select-requester");
  }

  // Determine user display info
  const displayName = user?.name || requester?.name;
  const userRole = user?.role;

  function renderRoleBadge() {
    if (!userRole) return null;
    if (userRole === "REQUESTER") {
      return (
        <span
          className="badge ms-2"
          style={{ border: "1px solid #CED4DA", color: "#FFFFFF", backgroundColor: "transparent" }}
        >
          Requester
        </span>
      );
    }
    if (userRole === "IT_STAFF") {
      return (
        <span className="badge ms-2 bg-light text-dark fw-bold">
          IT Staff
        </span>
      );
    }
    if (userRole === "ADMINISTRATOR") {
      return (
        <span className="badge ms-2" style={{ backgroundColor: "#4A235A", color: "#FFFFFF" }}>
          Admin
        </span>
      );
    }
    return null;
  }

  return (
    <div>
      <nav
        className="navbar navbar-expand navbar-dark"
        style={{ backgroundColor: "var(--bs-primary, #006B3C)" }}
      >
        <div className="container d-flex align-items-center">
          <Link to="/" className="navbar-brand mb-0 fw-bold d-flex align-items-center gap-2">
            TokTickIT
          </Link>

          {/* Desktop nav */}
          <div className="navbar-nav me-auto d-none d-md-flex flex-row gap-2">
            {(!userRole || userRole === "REQUESTER") && (
              <>
                <Link
                  className={`nav-link text-white d-flex align-items-center gap-1 ${
                    location.pathname === "/tickets" ? "zg-nav-active fw-bold" : ""
                  }`}
                  to="/tickets"
                >
                  <LayoutList size={16} aria-hidden="true" /> My Tickets
                </Link>
                <Link
                  className={`nav-link text-white d-flex align-items-center gap-1 ${
                    location.pathname === "/tickets/create" ? "zg-nav-active fw-bold" : ""
                  }`}
                  to="/tickets/create"
                >
                  <PlusCircle size={16} aria-hidden="true" /> Create Ticket
                </Link>
              </>
            )}

            {(userRole === "IT_STAFF" || userRole === "ADMINISTRATOR") && (
              <Link
                className={`nav-link text-white d-flex align-items-center gap-1 ${
                  location.pathname.startsWith("/staff/queue") ? "zg-nav-active fw-bold" : ""
                }`}
                to="/staff/queue"
              >
                <Inbox size={16} aria-hidden="true" /> Ticket Queue
              </Link>
            )}

            {userRole === "ADMINISTRATOR" && (
              <Link
                className={`nav-link text-white d-flex align-items-center gap-1 ${
                  location.pathname.startsWith("/admin/users") ? "zg-nav-active fw-bold" : ""
                }`}
                to="/admin/users"
              >
                <Users size={16} aria-hidden="true" /> User Management
              </Link>
            )}
          </div>

          {/* User profile & actions */}
          <div className="d-none d-md-flex align-items-center text-white ms-auto">
            {displayName && (
              <span className="me-3 small d-flex align-items-center gap-1">
                <UserCircle2 size={18} aria-hidden="true" /> {displayName}
                {renderRoleBadge()}
              </span>
            )}

            {user ? (
              <button
                type="button"
                className="btn btn-sm btn-outline-light d-flex align-items-center gap-1"
                onClick={handleLogout}
              >
                <LogOut size={14} aria-hidden="true" /> Log Out
              </button>
            ) : requester ? (
              <button
                type="button"
                className="btn btn-sm btn-outline-light"
                onClick={handleChangeRequester}
              >
                Change Requester
              </button>
            ) : null}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="btn btn-sm btn-outline-light d-md-none ms-auto"
            aria-label="Open menu"
            title="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={18} aria-hidden="true" />
          </button>
        </div>
      </nav>

      <MobileMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        requester={requester}
        onChangeRequester={handleChangeRequester}
        activePath={location.pathname}
      />

      <div className="container py-4">{children}</div>
    </div>
  );
}
