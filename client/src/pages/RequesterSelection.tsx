import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getActiveRequesters, type DevRequester } from "../api.js";
import { useRequester } from "../context/RequesterContext.js";

type LoadState = "loading" | "loaded" | "empty" | "error";

export default function RequesterSelection() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [requesters, setRequesters] = useState<DevRequester[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const { selectRequester } = useRequester();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    getActiveRequesters()
      .then((data) => {
        if (cancelled) return;
        setRequesters(data);
        setLoadState(data.length === 0 ? "empty" : "loaded");
      })
      .catch(() => {
        if (!cancelled) setLoadState("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleContinue() {
    const chosen = requesters.find((r) => String(r.id) === selectedId);
    if (!chosen) return;
    selectRequester({ id: chosen.id, name: chosen.name });
    navigate("/tickets");
  }

  return (
    <div className="container py-5" style={{ maxWidth: 480 }}>
      <div className="card p-4 text-center">
        <div className="mb-3" aria-hidden="true" style={{ fontSize: "2rem" }}>
          👤
        </div>
        <h1 className="h4 mb-2">Select Development Requester</h1>
        <p className="text-muted small mb-4">
          Choose a development requester to simulate the current requester context for Lab 2. This
          is for testing only and is not a login screen.
        </p>

        {loadState === "loading" && (
          <div className="my-3">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading requesters…</span>
            </div>
          </div>
        )}

        {loadState === "error" && (
          <div className="alert alert-danger text-start" role="alert">
            Unable to load development requesters right now. Please try again.
          </div>
        )}

        {loadState === "empty" && (
          <div className="alert alert-warning text-start" role="alert">
            No active development requesters are available. Ask an administrator to seed or
            activate at least one requester.
          </div>
        )}

        {loadState === "loaded" && (
          <div className="text-start mb-4">
            <label htmlFor="requester-select" className="form-label fw-semibold">
              Development Requester <span className="text-danger">*</span>
            </label>
            <select
              id="requester-select"
              className="form-select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="" disabled>
                Choose a requester…
              </option>
              {requesters.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <div className="alert alert-success mt-3 mb-0 py-2 small">
              Only active development requesters are shown.
            </div>
          </div>
        )}

        <div className="border rounded p-3 mb-4 text-start small text-muted">
          <strong>Authentication coming in Lab 3.</strong> In Lab 3, this selection will be replaced
          with secure authentication so you can access the system with your own account.
        </div>

        <div className="d-flex justify-content-end">
          <button
            className="btn btn-primary"
            disabled={loadState !== "loaded" || !selectedId}
            onClick={handleContinue}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}