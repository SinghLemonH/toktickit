import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import StaffTicketDetail from "../../src/pages/StaffTicketDetail.js";
import * as api from "../../src/api.js";
import { AuthContext } from "../../src/context/AuthContext.js";

const mockStaffUser = {
  id: 3,
  name: "Michael Brown",
  email: "michael.brown@example.com",
  role: "IT_STAFF" as const,
  isActive: true,
  mustChangePassword: false,
};

const mockStaffMembers: api.StaffUser[] = [
  { id: 3, name: "Michael Brown", email: "michael.brown@example.com", role: "IT_STAFF", isActive: true },
  { id: 4, name: "Sarah Johnson", email: "sarah.johnson@example.com", role: "IT_STAFF", isActive: true },
];

const mockTicketDetail: api.TicketDetail = {
  id: 77,
  ticketNumber: "TKT-2026-000077",
  ticketDate: "2026-09-18T10:00:00.000Z",
  createdAt: "2026-09-18T10:00:00.000Z",
  categoryName: "Hardware",
  relatedSystemName: "Corporate Laptop",
  requesterName: "Jennifer Anderson",
  summary: "Laptop battery swollen",
  description: "The battery expanded and trackpad is lifting.",
  requestedPriority: "HIGH",
  itPriority: "HIGH",
  currentStatus: "NEW",
  isProblemResolvedIndicated: true, // test resolution banner
  assignedToId: null,
  assignedTo: null,
  attachments: [],
};

const mockComments: api.PublicComment[] = [
  {
    id: 1,
    ticketId: 77,
    content: "Please bring it to IT station immediately.",
    createdAt: "2026-09-18T10:30:00.000Z",
    author: { id: 3, name: "Michael Brown", role: "IT_STAFF" },
  },
];

const mockInternalNotes: api.InternalNote[] = [
  {
    id: 1,
    ticketId: 77,
    content: "Battery safety hazmat protocol engaged.",
    createdAt: "2026-09-18T10:35:00.000Z",
    author: { id: 3, name: "Michael Brown", role: "IT_STAFF" },
  },
];

function renderDetail(ticketId: number = 77) {
  return render(
    <MemoryRouter initialEntries={[`/staff/tickets/${ticketId}`]}>
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
          <Route path="/staff/queue" element={<div>Staff Ticket Queue Page</div>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe("StaffTicketDetail Component (UI-04, AC-12)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "getTicketDetail").mockResolvedValue(mockTicketDetail);
    vi.spyOn(api, "getStaffUsers").mockResolvedValue(mockStaffMembers);
    vi.spyOn(api, "getPublicComments").mockResolvedValue(mockComments);
    vi.spyOn(api, "getInternalNotes").mockResolvedValue(mockInternalNotes);
  });

  it("renders ticket operational controls and problem resolved alert banner", async () => {
    renderDetail();

    expect((await screen.findAllByText("TKT-2026-000077")).length).toBeGreaterThan(0);
    expect(screen.getByText("Laptop battery swollen")).toBeInTheDocument();

    // Verify Problem Appears Resolved banner is rendered
    expect(
      screen.getByText(/requester indicated that this issue appears resolved/i)
    ).toBeInTheDocument();

    // Verify Claim Ticket button exists when unassigned
    expect(screen.getByRole("button", { name: /claim ticket/i })).toBeInTheDocument();
  });

  it("claims ticket when Claim Ticket button is clicked", async () => {
    const user = userEvent.setup();
    const assignSpy = vi.spyOn(api, "assignStaffTicket").mockResolvedValue({
      ...mockTicketDetail,
      assignedToId: mockStaffUser.id,
      assignedTo: { id: mockStaffUser.id, name: mockStaffUser.name },
    });

    renderDetail();

    const claimButton = await screen.findByRole("button", { name: /claim ticket/i });
    await user.click(claimButton);

    expect(assignSpy).toHaveBeenCalledWith(77, mockStaffUser.id);
  });

  it("displays confirmation modal before changing ticket status", async () => {
    const user = userEvent.setup();
    const statusSpy = vi.spyOn(api, "updateTicketStatus").mockResolvedValue({
      ...mockTicketDetail,
      currentStatus: "OPEN",
    });

    renderDetail();

    const statusSelect = await screen.findByLabelText(/ticket status/i);
    await user.selectOptions(statusSelect, "OPEN");

    const updateButton = screen.getByRole("button", { name: /change status/i });
    await user.click(updateButton);

    // Confirmation modal should appear
    expect(
      await screen.findByText(/are you sure you want to change ticket status to OPEN/i)
    ).toBeInTheDocument();

    const confirmButton = screen.getByRole("button", { name: /confirm change/i });
    await user.click(confirmButton);

    expect(statusSpy).toHaveBeenCalledWith(77, "OPEN");
  });

  it("switches to Internal Notes tab and renders confidential note interface", async () => {
    const user = userEvent.setup();
    renderDetail();

    const notesTab = await screen.findByRole("tab", { name: /internal notes/i });
    await user.click(notesTab);

    // Verify warning header for internal notes
    expect(
      screen.getByText(/internal notes are private and never visible to requesters/i)
    ).toBeInTheDocument();

    // Verify note content is rendered
    expect(
      screen.getByText("Battery safety hazmat protocol engaged.")
    ).toBeInTheDocument();
  });
});
