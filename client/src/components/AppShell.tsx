import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, LayoutList, PlusCircle, UserCircle2 } from "lucide-react";
import { useRequester } from "../context/RequesterContext.js";
import MobileMenu from "./MobileMenu.js";

export default function AppShell({ children }: { children: ReactNode }) {
  const { requester, clearRequester } = useRequester();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleChangeRequester() {
    clearRequester();
    navigate("/select-requester");
  }

  return (
    <div>
      <nav
        className="navbar navbar-expand navbar-dark"
        style={{ backgroundColor: "var(--bs-primary)" }}
      >
        <div className="container d-flex align-items-center">
          <span className="navbar-brand mb-0">TokTickIT</span>

          {/* Desktop nav — hidden on mobile, replaced by the popup menu. */}
          <div className="navbar-nav me-auto d-none d-md-flex flex-row gap-2">
            <Link
              className={`nav-link text-white d-flex align-items-center gap-1 ${
                location.pathname === "/tickets" ? "zg-nav-active" : ""
              }`}
              to="/tickets"
            >
              <LayoutList size={16} aria-hidden="true" /> My Tickets
            </Link>
            <Link
              className={`nav-link text-white d-flex align-items-center gap-1 ${
                location.pathname === "/tickets/create" ? "zg-nav-active" : ""
              }`}
              to="/tickets/create"
            >
              <PlusCircle size={16} aria-hidden="true" /> Create Ticket
            </Link>
          </div>

          {requester && (
            <div className="d-none d-md-flex align-items-center text-white ms-auto">
              <span className="me-3 small d-flex align-items-center gap-1">
                <UserCircle2 size={16} aria-hidden="true" /> {requester.name}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-light"
                onClick={handleChangeRequester}
              >
                Change Requester
              </button>
            </div>
          )}

          {/* Mobile: single hamburger button opens the popup menu. */}
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