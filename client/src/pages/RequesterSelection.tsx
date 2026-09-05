import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserCog, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { getActiveRequesters, type DevRequester } from "../api.js";
import { useRequester } from "../context/RequesterContext.js";

type LoadState = "loading" | "loaded" | "empty" | "error";

export default function RequesterSelection() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [requesters, setRequesters] = useState<DevRequester[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const { selectRequester, requester } = useRequester();
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
    <div className="container py-5" style={{ maxWidth: 440 }}>
      <div className="card p-4 text-center">
        <div className="mb-3 d-flex justify-content-center text-success" aria-hidden="true">
          <UserCog size={40} strokeWidth={1.5} />
        </div>
        <h1 className="h4 mb-2">Select Requester</h1>
        <p className="text-muted small mb-4">
          For Lab 2 testing only — not a login.
        </p>

        {loadState === "loading" && (
          <div className="my-3">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading…</span>
            </div>
          </div>
        )}

        {loadState === "error" && (
          <div className="zg-state-panel zg-state-error py-3">
            <AlertTriangle size={28} aria-hidden="true" />
            <span>Couldn't load requesters. Try again.</span>
          </div>
        )}

        {loadState === "empty" && (
          <div className="zg-state-panel py-3">
            <AlertTriangle size={28} aria-hidden="true" />
            <span>No active requesters available.</span>
          </div>
        )}

        {loadState === "loaded" && (
          <div className="text-start mb-4">
            <label htmlFor="requester-select" className="form-label fw-semibold">
              Requester <span className="text-danger">*</span>
            </label>
            <select
              id="requester-select"
              className="form-select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="" disabled>
                Select…
              </option>
              {requesters.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <div className="d-flex align-items-center gap-2 mt-3 small text-success">
              <CheckCircle2 size={14} aria-hidden="true" />
              <span>Only active requesters shown</span>
            </div>
          </div>
        )}

        <div className="d-flex align-items-start gap-2 border rounded p-3 mb-4 text-start small text-muted">
          <ShieldCheck size={18} className="flex-shrink-0 mt-1" aria-hidden="true" />
          <span>Real login arrives in Lab 3.</span>
        </div>

        <div className="d-flex justify-content-end gap-2">
          {requester && (
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate("/tickets")}
            >
              Cancel
            </button>
          )}
          <button
            className="btn btn-primary"
            disabled={loadState !== "loaded" || !selectedId}
            onClick={handleContinue}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}