import type { ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";
import { useRequester } from "../context/RequesterContext.js";
import { useAuth } from "../context/AuthContext.js";

interface RouteGuardProps {
  children: ReactNode;
  allowedRoles?: ("REQUESTER" | "IT_STAFF" | "ADMINISTRATOR")[];
}

export default function RouteGuard({ children, allowedRoles }: RouteGuardProps) {
  const { user, loading, isConfigured } = useAuth();
  const { requester, isLoaded } = useRequester();

  // If running inside AuthProvider (Sprint 3 real application mode)
  if (isConfigured) {
    if (loading) {
      return null;
    }
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    if (user.mustChangePassword) {
      return <Navigate to="/change-password" replace />;
    }
    if (allowedRoles && !allowedRoles.includes(user.role as any)) {
      const dashboard = "/dashboard";
      return (
        <main className="container py-5">
          <div className="alert alert-warning" role="alert">
            <h1 className="h4">Access Denied</h1>
            <p className="mb-3">You do not have permission to view this page.</p>
            <Link className="btn btn-primary" to={dashboard}>
              Return to Dashboard
            </Link>
          </div>
        </main>
      );
    }
    return <>{children}</>;
  }

  // Lab 2 backward compatibility fallback (when rendered without AuthProvider)
  if (!isLoaded) {
    return null;
  }
  if (requester) {
    return <>{children}</>;
  }
  return <Navigate to="/select-requester" replace />;
}
