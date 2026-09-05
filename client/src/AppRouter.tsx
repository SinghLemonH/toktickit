import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RequesterProvider } from "./context/RequesterContext.js";
import RequesterSelection from "./pages/RequesterSelection.js";
import MyTickets from "./pages/MyTickets.js";
import CreateTicket from "./pages/CreateTicket.js";
import TicketDetail from "./pages/TicketDetail.js";
import RouteGuard from "./components/RouteGuard.js";
import AppShell from "./components/AppShell.js";
import App from "./App.js";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <RequesterProvider>
        <Routes>
          <Route path="/select-requester" element={<RequesterSelection />} />

          {/* Lab 1's original health-check demo, unchanged, kept reachable. */}
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
    </BrowserRouter>
  );
}