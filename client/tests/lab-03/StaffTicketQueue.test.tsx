import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import StaffTicketQueue from "../../src/pages/StaffTicketQueue.js";
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

const mockTicketsResponse: api.StaffQueueResponse = {
  tickets: [
    {
      id: 101,
      ticketNumber: "TKT-2026-000101",
      createdAt: "2026-09-18T08:00:00.000Z",
      summary: "Database connection intermittent",
      category: { id: 1, name: "Database" },
      requester: { id: 5, name: "Jennifer Anderson" },
      assignedTo: { id: 3, name: "Michael Brown" },
      requestedPriority: "HIGH",
      itPriority: "HIGH",
      currentStatus: "IN_PROGRESS",
      isProblemResolvedIndicated: false,
    },
    {
      id: 102,
      ticketNumber: "TKT-2026-000102",
      createdAt: "2026-09-18T09:00:00.000Z",
      summary: "Keyboard replacement requested",
      category: { id: 2, name: "Hardware" },
      requester: { id: 6, name: "David Lee" },
      assignedTo: null,
      requestedPriority: "LOW",
      itPriority: "LOW",
      currentStatus: "NEW",
      isProblemResolvedIndicated: false,
    },
  ],
  pagination: {
    totalItems: 2,
    totalPages: 1,
    currentPage: 1,
    pageSize: 10,
  },
};

function renderQueue() {
  return render(
    <MemoryRouter initialEntries={["/staff/queue"]}>
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
          <Route path="/staff/queue" element={<StaffTicketQueue />} />
          <Route path="/staff/tickets/:id" element={<div>Staff Ticket Detail Page</div>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe("StaffTicketQueue Component (UI-03, AC-11)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "getActiveCategories").mockResolvedValue([
      { id: 1, name: "Database" },
      { id: 2, name: "Hardware" },
    ]);
  });

  it("renders queue table with ticket columns, badges, and owner names", async () => {
    vi.spyOn(api, "getStaffTickets").mockResolvedValue(mockTicketsResponse);

    renderQueue();

    expect((await screen.findAllByText("TKT-2026-000101")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Database connection intermittent").length).toBeGreaterThan(0);
    expect(screen.getAllByText("TKT-2026-000102").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Keyboard replacement requested").length).toBeGreaterThan(0);

    // Verify assigned user vs unassigned display
    expect(screen.getAllByText("Michael Brown").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/unassigned/i).length).toBeGreaterThan(0);
  });

  it("triggers search API call when typing in the search bar", async () => {
    const user = userEvent.setup();
    const getStaffTicketsSpy = vi
      .spyOn(api, "getStaffTickets")
      .mockResolvedValue(mockTicketsResponse);

    renderQueue();

    const searchInput = await screen.findByPlaceholderText(/search by ticket number or summary/i);
    await user.type(searchInput, "Database");

    await waitFor(
      () => {
        expect(getStaffTicketsSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            search: "Database",
          })
        );
      },
      { timeout: 1500 }
    );
  });

  it("shows empty state when no tickets exist in queue", async () => {
    vi.spyOn(api, "getStaffTickets").mockResolvedValue({
      tickets: [],
      pagination: { totalItems: 0, totalPages: 1, currentPage: 1, pageSize: 10 },
    });

    renderQueue();

    expect(await screen.findByText(/no tickets in the queue/i)).toBeInTheDocument();
  });

  it("navigates to ticket operational detail when Open button is clicked", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "getStaffTickets").mockResolvedValue(mockTicketsResponse);

    renderQueue();

    const openButtons = await screen.findAllByRole("button", { name: /open/i });
    expect(openButtons.length).toBeGreaterThan(0);
    await user.click(openButtons[0]);

    expect(await screen.findByText("Staff Ticket Detail Page")).toBeInTheDocument();
  });
});
