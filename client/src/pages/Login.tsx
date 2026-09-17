import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ShieldAlert, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext.js";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!password) {
      newErrors.password = "Password is required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setSubmitting(true);
    const result = await login(email.trim(), password);
    setSubmitting(false);

    if (!result.success) {
      const errorMsg = result.error?.includes("Invalid email or password")
        ? "Invalid email or password. Please try again."
        : (result.error || "Invalid email or password. Please try again.");
      setServerError(errorMsg);
      return;
    }

    // Refresh and check user state from local storage or context
    const checkRes = await fetch("/api/auth/me", { credentials: "include" });
    if (checkRes.ok) {
      const { user } = await checkRes.json();
      if (user.mustChangePassword) {
        navigate("/change-password");
        return;
      }
      if (user.role === "REQUESTER") {
        navigate("/tickets");
      } else {
        navigate("/staff/queue");
      }
    } else {
      navigate("/tickets");
    }
  }

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light py-5">
      <div className="card shadow-sm border-0" style={{ maxWidth: "420px", width: "100%", borderRadius: "12px" }}>
        <div className="card-body p-4 p-sm-5">
          <div className="text-center mb-4">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{ width: "56px", height: "56px", backgroundColor: "var(--bs-primary-light, #E8F5E9)" }}
            >
              <LogIn size={28} style={{ color: "var(--bs-primary, #006B3C)" }} />
            </div>
            <h1 className="h4 fw-bold mb-1" style={{ color: "var(--bs-primary, #006B3C)" }}>
              TokTickIT
            </h1>
            <p className="text-muted small mb-0">Sign in to your account</p>
          </div>

          {serverError && (
            <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 small mb-4" role="alert">
              <ShieldAlert size={18} className="flex-shrink-0" />
              <div>{serverError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="email" className="form-label small fw-semibold">
                Email Address
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  id="email"
                  className={`form-control ${errors.email ? "is-invalid" : ""}`}
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  autoComplete="email"
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="form-label small fw-semibold">
                Password
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className={`form-control ${errors.password ? "is-invalid" : ""}`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
              disabled={submitting}
              style={{ backgroundColor: "var(--bs-primary, #006B3C)", borderColor: "var(--bs-primary, #006B3C)" }}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
