import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useRequester } from "../context/RequesterContext.js";
import { useAuth } from "../context/AuthContext.js";

export default function RouteGuard({ children }: { children: ReactNode }) {
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
