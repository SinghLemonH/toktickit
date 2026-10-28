import { Link } from "react-router-dom";
import { X, LayoutList, PlusCircle, UserCircle2, LogOut, Inbox, Users } from "lucide-react";
import type { SelectedRequester } from "../context/RequesterContext.js";
import { useAuth } from "../context/AuthContext.js";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  requester: SelectedRequester | null;
  onChangeRequester: () => void;
  activePath: string;
}

export default function MobileMenu({
  isOpen,
  onClose,
  requester,
  onChangeRequester,
  activePath,
}: MobileMenuProps) {
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  const userRole = user?.role;

  async function handleLogout() {
    await logout();
    window.location.href = "/login";
  }

  return (
    <div
      className="zg-mobile-menu-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="zg-mobile-menu-panel"
        role="dialog"
        aria-label="Navigation"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
          <div className="d-flex align-items-center gap-2 text-muted small">
            <UserCircle2 size={16} aria-hidden="true" />
            <span>{user?.name || requester?.name}</span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-light"
            aria-label="Close menu"
            title="Close menu"
            onClick={onClose}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <nav className="d-flex flex-column">
          {(!userRole || userRole === "REQUESTER") && (
            <>
              <Link
                to="/dashboard"
                className={`nav-link d-flex align-items-center gap-2 ${
                  activePath === "/dashboard" ? "zg-nav-active" : ""
                }`}
                onClick={onClose}
              >
                <LayoutList size={16} aria-hidden="true" /> Dashboard
              </Link>
              <Link
                to="/tickets"
                className={`nav-link d-flex align-items-center gap-2 ${
                  activePath === "/tickets" ? "zg-nav-active" : ""
                }`}
                onClick={onClose}
              >
                <LayoutList size={16} aria-hidden="true" /> My Tickets
              </Link>
              <Link
                to="/tickets/create"
                className={`nav-link d-flex align-items-center gap-2 ${
                  activePath === "/tickets/create" ? "zg-nav-active" : ""
                }`}
                onClick={onClose}
              >
                <PlusCircle size={16} aria-hidden="true" /> Create Ticket
              </Link>
            </>
          )}

          {(userRole === "IT_STAFF" || userRole === "ADMINISTRATOR") && (
            <>
              <Link
                to="/staff/dashboard"
                className={`nav-link d-flex align-items-center gap-2 ${
                  activePath === "/staff/dashboard" ? "zg-nav-active" : ""
                }`}
                onClick={onClose}
              >
                <LayoutList size={16} aria-hidden="true" /> Dashboard
              </Link>
              <Link
                to="/staff/queue"
                className={`nav-link d-flex align-items-center gap-2 ${
                  activePath.startsWith("/staff/queue") ? "zg-nav-active" : ""
                }`}
                onClick={onClose}
              >
                <Inbox size={16} aria-hidden="true" /> Ticket Queue
              </Link>
            </>
          )}

          {userRole === "ADMINISTRATOR" && (
            <Link
              to="/admin/users"
              className={`nav-link d-flex align-items-center gap-2 ${
                activePath.startsWith("/admin/users") ? "zg-nav-active" : ""
              }`}
              onClick={onClose}
            >
              <Users size={16} aria-hidden="true" /> User Management
            </Link>
          )}

          <div className="border-top my-2" />

          {user ? (
            <button
              type="button"
              className="nav-link d-flex align-items-center gap-2 text-start border-0 bg-transparent text-danger"
              onClick={handleLogout}
            >
              <LogOut size={16} aria-hidden="true" /> Log Out
            </button>
          ) : (
            <button
              type="button"
              className="nav-link d-flex align-items-center gap-2 text-start border-0 bg-transparent"
              onClick={() => {
                onClose();
                onChangeRequester();
              }}
            >
              <RefreshCcw size={16} aria-hidden="true" /> Change Requester
            </button>
          )}
        </nav>
      </div>
    </div>
  );
}