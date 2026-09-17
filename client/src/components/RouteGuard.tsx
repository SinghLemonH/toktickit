import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useRequester } from "../context/RequesterContext.js";
import { useAuth } from "../context/AuthContext.js";

export default function RouteGuard({ children }: { children: ReactNode }) {
  const { requester, isLoaded } = useRequester();
  const { user, loading } = useAuth();

  if (loading || !isLoaded) {
    return null;
  }

  // Sprint 3 authenticated user handling
  if (user) {
    if (user.mustChangePassword) {
      return <Navigate to="/change-password" replace />;
    }
    return <>{children}</>;
  }

  // Lab 2 backward compatibility fallback
  if (requester) {
    return <>{children}</>;
  }

  return <Navigate to="/select-requester" replace />;
}
