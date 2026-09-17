import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RequesterProvider } from "./context/RequesterContext.js";
import { AuthProvider } from "./context/AuthContext.js";
import RequesterSelection from "./pages/RequesterSelection.js";
import Login from "./pages/Login.js";
import ChangePassword from "./pages/ChangePassword.js";
import MyTickets from "./pages/MyTickets.js";
import CreateTicket from "./pages/CreateTicket.js";
import TicketDetail from "./pages/TicketDetail.js";
import RouteGuard from "./components/RouteGuard.js";
import AppShell from "./components/AppShell.js";
import App from "./App.js";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RequesterProvider>
          <Routes>
            {/* Sprint 3 Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/change-password" element={<ChangePassword />} />

            {/* Lab 2 Requester Selection fallback */}
            <Route path="/select-requester" element={<RequesterSelection />} />

            {/* Lab 1 Health Check Demo */}
            <Route path="/system-status" element={<App />} />

            <Route
              path="/tickets"
              element={
                <RouteGuard>
                  <AppShell>
                    <MyTickets />
                  </AppShell>
                </RouteGuard>
              }
            />

            <Route
              path="/tickets/create"
              element={
                <RouteGuard>
                  <AppShell>
                    <CreateTicket />
                  </AppShell>
                </RouteGuard>
              }
            />

            <Route
              path="/tickets/:id"
              element={
                <RouteGuard>
                  <AppShell>
                    <TicketDetail />
                  </AppShell>
                </RouteGuard>
              }
            />

            <Route path="/" element={<Navigate to="/tickets" replace />} />
            <Route path="*" element={<Navigate to="/tickets" replace />} />
          </Routes>
        </RequesterProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
