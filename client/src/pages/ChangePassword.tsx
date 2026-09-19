import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, KeyRound, ShieldAlert, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext.js";

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Password complexity rules
  const hasMinLength = newPassword.length >= 8;
  const hasUpperAndLower = /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword);
  const hasNumberAndSpecial = /[0-9]/.test(newPassword) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  const isComplexityMet = hasMinLength && hasUpperAndLower && hasNumberAndSpecial;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const canSubmit = isComplexityMet && passwordsMatch && currentPassword.length > 0 && !submitting;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setServerError(null);
    setSubmitting(true);

    const res = await changePassword(currentPassword, newPassword);
    setSubmitting(false);

    if (!res.success) {
      setServerError(res.error || "Failed to update password. Please check your credentials.");
      return;
    }

    if (user?.role === "REQUESTER") {
      navigate("/tickets");
    } else {
      navigate("/staff/queue");
    }
  }

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light py-5">
      <div className="card shadow-sm border-0" style={{ maxWidth: "460px", width: "100%", borderRadius: "12px" }}>
        <div className="card-body p-4 p-sm-5">
          <div className="text-center mb-4">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{ width: "56px", height: "56px", backgroundColor: "var(--bs-primary-light, #E8F5E9)" }}
            >
              <KeyRound size={28} style={{ color: "var(--bs-primary, #006B3C)" }} />
            </div>
            <h1 className="h4 fw-bold mb-1" style={{ color: "var(--bs-primary, #006B3C)" }}>
              Change Your Password
            </h1>
            <p className="text-muted small mb-0">
              You must update your temporary initial password before proceeding.
            </p>
          </div>

          {serverError && (
            <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 small mb-4" role="alert">
              <ShieldAlert size={18} className="flex-shrink-0" />
              <div>{serverError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="currentPassword" className="form-label small fw-semibold">
                Current (Temporary) Password
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  id="currentPassword"
                  className="form-control"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={submitting}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="newPassword" className="form-label small fw-semibold">
                New Password
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  id="newPassword"
                  className="form-control"
                  placeholder="Create new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={submitting}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Real-time Checklist */}
            <div className="p-3 mb-3 rounded bg-light border">
              <span className="d-block small fw-bold text-muted mb-2">Password Requirements:</span>
              <ul className="list-unstyled mb-0 small d-flex flex-column gap-1">
                <li className={`d-flex align-items-center gap-2 ${hasMinLength ? "text-success fw-semibold" : "text-muted"}`}>
                  {hasMinLength ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  <span>At least 8 characters</span>
                </li>
                <li className={`d-flex align-items-center gap-2 ${hasUpperAndLower ? "text-success fw-semibold" : "text-muted"}`}>
                  {hasUpperAndLower ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  <span>Include uppercase and lowercase letters</span>
                </li>
                <li className={`d-flex align-items-center gap-2 ${hasNumberAndSpecial ? "text-success fw-semibold" : "text-muted"}`}>
                  {hasNumberAndSpecial ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  <span>Include a number and a special character</span>
                </li>
              </ul>
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className="form-label small fw-semibold">
                Confirm New Password
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  id="confirmPassword"
                  className={`form-control ${confirmPassword && !passwordsMatch ? "is-invalid" : ""}`}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={submitting}
                  autoComplete="new-password"
                />
                {confirmPassword && !passwordsMatch && (
                  <div className="invalid-feedback">Passwords do not match.</div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-semibold"
              disabled={!canSubmit}
              style={{ backgroundColor: "var(--bs-primary, #006B3C)", borderColor: "var(--bs-primary, #006B3C)" }}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Updating Password...
                </>
              ) : (
                "Continue to TokTickIT"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
