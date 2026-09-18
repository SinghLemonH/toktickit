import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import TicketDetail from "../../src/pages/TicketDetail.js";
import * as api from "../../src/api.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import { AuthProvider } from "../../src/context/AuthContext.js";

const mockTicket: api.TicketDetail = {
  id: 42,
  ticketNumber: "TKT-2026-000042",
  ticketDate: "2026-09-15T10:00:00.000Z",
  createdAt: "2026-09-15T10:00:00.000Z",
  categoryName: "Hardware",
  relatedSystemName: "Corporate Laptop",
  requesterName: "Jennifer Anderson",
  summary: "Laptop overheating issue",
  description: "The fan makes loud noise and CPU throttles heavily.",
  requestedPriority: "HIGH",
  itPriority: "HIGH",
  currentStatus: "IN_PROGRESS",
  isProblemResolvedIndicated: false,
  attachments: [],
};

const mockComments: api.PublicComment[] = [
  {
    id: 1,
    ticketId: 42,
    content: "We have dispatched a thermal paste replacement kit.",
    createdAt: "2026-09-15T11:00:00.000Z",
    author: {
      id: 2,
      name: "Michael Brown",
      role: "IT_STAFF",
    },
  },
  {
    id: 2,
    ticketId: 42,
    content: "Received the kit, will test today.",
    createdAt: "2026-09-15T14:00:00.000Z",
    author: {
      id: 1,
      name: "Jennifer Anderson",
      role: "REQUESTER",
    },
  },
];

function renderTicketDetail(ticketId: number = 42) {
  return render(
    <MemoryRouter initialEntries={[`/tickets/${ticketId}`]}>
      <AuthProvider>
        <RequesterProvider>
          <Routes>
            <Route path="/tickets/:id" element={<TicketDetail />} />
            <Route path="/tickets" element={<div>My Tickets List</div>} />
          </Routes>
        </RequesterProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("TicketDetail Public Comments & Resolution Indicator (Issue #32)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.setItem(
      "toktickit.selectedRequester",
      JSON.stringify({ id: 1, name: "Jennifer Anderson" })
    );

    // Default API mocks
    vi.spyOn(api, "getTicketDetail").mockResolvedValue(mockTicket);
    vi.spyOn(api, "getPublicComments").mockResolvedValue(mockComments);
  });

  it("renders public comments stream with author name, role badges, and content", async () => {
    renderTicketDetail(42);

    expect(await screen.findByText("Ticket Details: TKT-2026-000042")).toBeInTheDocument();
    expect(screen.getByText("Public Comments")).toBeInTheDocument();

    // Verify existing comments
    expect(screen.getByText("We have dispatched a thermal paste replacement kit.")).toBeInTheDocument();
    expect(screen.getByText("Michael Brown")).toBeInTheDocument();
    expect(screen.getByText("IT Staff")).toBeInTheDocument();

    expect(screen.getByText("Received the kit, will test today.")).toBeInTheDocument();
    expect(screen.getAllByText("Jennifer Anderson").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Requester").length).toBeGreaterThan(0);
  });

  it("submits a new public comment and appends it to the list", async () => {
    const user = userEvent.setup();
    const newCommentMock: api.PublicComment = {
      id: 3,
      ticketId: 42,
      content: "Thermal paste applied, temps dropped to 45C!",
      createdAt: new Date().toISOString(),
      author: {
        id: 1,
        name: "Jennifer Anderson",
        role: "REQUESTER",
      },
    };

    const postSpy = vi.spyOn(api, "postPublicComment").mockResolvedValue(newCommentMock);

    renderTicketDetail(42);

    expect(await screen.findByText("Ticket Details: TKT-2026-000042")).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText("Add a comment...");
    const postButton = screen.getByRole("button", { name: /Post Comment/i });

    // Initially disabled when empty
    expect(postButton).toBeDisabled();

    // Type comment
    await user.type(textarea, "Thermal paste applied, temps dropped to 45C!");
    expect(screen.getByText(/2000/)).toBeInTheDocument();
    expect(postButton).toBeEnabled();

    // Submit
    await user.click(postButton);

    expect(postSpy).toHaveBeenCalledWith(42, "Thermal paste applied, temps dropped to 45C!");
    expect(await screen.findByText("Thermal paste applied, temps dropped to 45C!")).toBeInTheDocument();
  });

  it("allows requester to indicate problem resolved and displays the resolved badge", async () => {
    const user = userEvent.setup();
    const indicateSpy = vi.spyOn(api, "indicateProblemResolved").mockResolvedValue({
      id: 42,
      ticketNumber: "TKT-2026-000042",
      isProblemResolvedIndicated: true,
    });

    renderTicketDetail(42);

    expect(await screen.findByText("Ticket Details: TKT-2026-000042")).toBeInTheDocument();

    // Click Problem Appears Resolved button
    const resolveBtn = screen.getByRole("button", { name: /Problem Appears Resolved/i });
    await user.click(resolveBtn);

    // Confirmation banner appears
    expect(screen.getByText("Confirm Problem Resolution")).toBeInTheDocument();

    // Confirm
    const confirmBtn = screen.getByRole("button", { name: /Yes, Problem is Resolved/i });
    await user.click(confirmBtn);

    expect(indicateSpy).toHaveBeenCalledWith(42);

    // Green badge appears
    await waitFor(() => {
      expect(screen.getAllByText(/Problem appears resolved/i).length).toBeGreaterThan(0);
    });
  });
});
