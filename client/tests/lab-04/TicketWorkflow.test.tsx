import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import StaffTicketDetail from "../../src/pages/StaffTicketDetail.js";
import TicketDetail from "../../src/pages/TicketDetail.js";
import * as api from "../../src/api.js";
import { AuthContext } from "../../src/context/AuthContext.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";

const mockStaffUser = {
  id: 3,
  name: "Michael Brown",
  email: "michael.brown@example.com",
  role: "IT_STAFF" as const,
  isActive: true,
  mustChangePassword: false,
};

const mockRequesterUser = {
  id: 10,
  name: "Jennifer Anderson",
  email: "jennifer.anderson@example.com",
  role: "REQUESTER" as const,
  isActive: true,
  mustChangePassword: false,
};

const mockStaffMembers: api.StaffUser[] = [
  { id: 3, name: "Michael Brown", email: "michael.brown@example.com", role: "IT_STAFF", isActive: true },
];

const mockUnresolvedTicket: api.TicketDetail = {
  id: 77,
  ticketNumber: "TKT-2026-000077",
  ticketDate: "2026-10-13T10:00:00.000Z",
  createdAt: "2026-10-13T10:00:00.000Z",
  categoryName: "Hardware",
  relatedSystemName: "Corporate Laptop",
  requesterName: "Jennifer Anderson",
  summary: "Laptop battery swollen",
  description: "The battery expanded.",
  requestedPriority: "HIGH",
  itPriority: "HIGH",
  currentStatus: "IN_PROGRESS",
  assignedToId: null, // No owner!
  assignedTo: null,
  version: 2,
  allowedTransitions: ["WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  resolutionGate: {
    ok: false,
    reasons: [
      "Ticket must have an assigned owner to be resolved.",
      "Ticket must have at least one completed Action Taken to be resolved.",
    ],
  },
  attachments: [],
};

const mockResolvedTicket: api.TicketDetail = {
  id: 88,
  ticketNumber: "TKT-2026-000088",
  ticketDate: "2026-10-10T10:00:00.000Z",
  createdAt: "2026-10-10T10:00:00.000Z",
  categoryName: "Software",
  relatedSystemName: "VPN",
  requesterName: "Jennifer Anderson",
  summary: "Cannot access internal network",
  description: "VPN client failed handshake.",
  requestedPriority: "MEDIUM",
  itPriority: "MEDIUM",
  currentStatus: "RESOLVED",
  assignedToId: 3,
  assignedTo: { id: 3, name: "Michael Brown" },
  version: 4,
  allowedTransitions: ["CLOSED", "REOPENED"],
  resolutionGate: { ok: true, reasons: [] },
  attachments: [],
};

describe("TicketWorkflow Component Tests (Lab 4)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "getStaffUsers").mockResolvedValue(mockStaffMembers);
    vi.spyOn(api, "getPublicComments").mockResolvedValue([]);
    vi.spyOn(api, "getInternalNotes").mockResolvedValue([]);
    vi.spyOn(api, "getActionsTaken").mockResolvedValue([]);
    vi.spyOn(api, "getTicketStatusHistory").mockResolvedValue([]);
  });

  describe("UI-07: Resolution Gate Feedback in Staff Ticket Detail (AC-07, FR-06)", () => {
    it("displays resolution gate missing requirements banner and checks reasons on RESOLVED selection", async () => {
      const user = userEvent.setup();
      vi.spyOn(api, "getTicketDetail").mockResolvedValue(mockUnresolvedTicket);

      render(
        <MemoryRouter initialEntries={["/staff/tickets/77"]}>
          <AuthContext.Provider
            value={{
              user: mockStaffUser,
              loading: false,
              isConfigured: true,
              login: vi.fn(),
              logout: vi.fn(),
              changePassword: vi.fn(),
              refreshUser: vi.fn(),
            }}
          >
            <Routes>
              <Route path="/staff/tickets/:id" element={<StaffTicketDetail />} />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      // Verify inline resolution gate banner renders missing reasons
      expect(await screen.findByText(/resolution gate:/i)).toBeInTheDocument();
      expect(screen.getByText(/ticket must have an assigned owner to be resolved/i)).toBeInTheDocument();
      expect(screen.getByText(/ticket must have at least one completed action taken to be resolved/i)).toBeInTheDocument();

      // Select RESOLVED in status dropdown
      const statusSelect = screen.getByLabelText(/ticket status/i);
      await user.selectOptions(statusSelect, "RESOLVED");

      // Click Change Status button
      const changeStatusBtn = screen.getByRole("button", { name: /change status/i });
      await user.click(changeStatusBtn);

      // Verify modal pops up with resolution gate warning listing reasons
      expect(await screen.findByText(/cannot resolve ticket: resolution gate not satisfied/i)).toBeInTheDocument();
    });
  });

  describe("UI-10: Requester Reopen Action and Modal (AC-15, FR-08)", () => {
    it("renders Reopen Ticket button on resolved ticket and calls reopenTicket with reason", async () => {
      const user = userEvent.setup();
      vi.spyOn(api, "getTicketDetail").mockResolvedValue(mockResolvedTicket);
      const reopenSpy = vi.spyOn(api, "reopenTicket").mockResolvedValue({
        ...mockResolvedTicket,
        currentStatus: "REOPENED",
        version: 5,
      });

      render(
        <MemoryRouter initialEntries={["/tickets/88"]}>
          <AuthContext.Provider
            value={{
              user: mockRequesterUser,
              loading: false,
              isConfigured: true,
              login: vi.fn(),
              logout: vi.fn(),
              changePassword: vi.fn(),
              refreshUser: vi.fn(),
            }}
          >
            <RequesterProvider>
              <Routes>
                <Route path="/tickets/:id" element={<TicketDetail />} />
              </Routes>
            </RequesterProvider>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      // Verify Reopen Ticket button exists
      const reopenBtn = await screen.findByRole("button", { name: /reopen ticket/i });
      expect(reopenBtn).toBeInTheDocument();

      // Click Reopen Ticket
      await user.click(reopenBtn);

      // Verify modal is displayed
      expect(await screen.findByText(/if this issue is not fully resolved or has reoccurred/i)).toBeInTheDocument();

      // Enter optional reason
      const reasonInput = screen.getByPlaceholderText(/explain why this ticket needs further work/i);
      await user.type(reasonInput, "VPN still drops every 10 minutes.");

      // Confirm reopen
      const confirmBtn = screen.getByRole("button", { name: /confirm reopen/i });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(reopenSpy).toHaveBeenCalledWith(88, {
          reason: "VPN still drops every 10 minutes.",
          expectedVersion: 4,
        });
      });
    });
  });
});
