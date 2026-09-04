import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRequester } from "../context/RequesterContext.js";

export default function AppShell({ children }: { children: ReactNode }) {
  const { requester, clearRequester } = useRequester();
  const navigate = useNavigate();

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
        <div className="container">
          <span className="navbar-brand">TokTickIT</span>
          <div className="navbar-nav me-auto">
            <Link className="nav-link text-white zg-nav-active" to="/tickets">
              My Tickets
            </Link>
          </div>
          {requester && (
            <div className="d-flex align-items-center text-white">
              <span className="me-3 small">{requester.name}</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-light"
                onClick={handleChangeRequester}
              >
                Change Requester
              </button>
            </div>
          )}
        </div>
      </nav>
      <div className="container py-4">{children}</div>
    </div>
  );
}