import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useRequester } from "../context/RequesterContext.js";

export default function RouteGuard({ children }: { children: ReactNode }) {
  const { requester, isLoaded } = useRequester();

  // Wait for the initial sessionStorage check before deciding — otherwise a
  // returning user with a valid stored selection would flash-redirect.
  if (!isLoaded) return null;

  if (!requester) {
    return <Navigate to="/select-requester" replace />;
  }

  return <>{children}</>;
}