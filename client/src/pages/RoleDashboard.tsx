import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import RequesterDashboard from "./RequesterDashboard.js";
import StaffDashboard from "./StaffDashboard.js";

export default function RoleDashboard() {
  const { user } = useAuth();

  if (user?.role === "IT_STAFF" || user?.role === "ADMINISTRATOR") {
    return <StaffDashboard />;
  }
  if (user?.role === "REQUESTER") {
    return <RequesterDashboard />;
  }
  return <Navigate to="/login" replace />;
}
