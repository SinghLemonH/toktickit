import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TicketDetail from "../../src/pages/TicketDetail.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import * as api from "../../src/api.js";

const mockTicket: api.TicketDetail = {
  id: 123,
  ticketNumber: "TKT-2026-000123",
  ticketDate: "2026-09-05T08:00:00.000Z",
  createdAt: "2026-09-05T08:00:00.000Z",
  categoryName: "Hardware",
  relatedSystemName: "Corporate Laptop",
  requesterName: "Jennifer Anderson",
  summary: "Battery draining rapidly",
  description: "The battery loses full charge in less than an hour while idling.",
  requestedPriority: "HIGH",
  itPriority: null,
  currentStatus: "NEW",
  attachments: [
    {
      id: 1,
      originalFilename: "battery_diagnostics.png",
      sizeBytes: 102400,
      uploadedAt: "2026-09-05T08:05:00.000Z",
      removedAt: null,
      removalReason: null,
    },
  ],
};

function renderComponent(ticketId = "123") {
  sessionStorage.setItem(
    "toktickit.selectedRequester",
    JSON.stringify({ id: 1, name: "Jennifer Anderson" })
  );
  return render(
    <MemoryRouter initialEntries={[`/tickets/${ticketId}`]}>
      <RequesterProvider>
        <Routes>
          <Route path="/tickets/:id" element={<TicketDetail />} />
        </Routes>
      </RequesterProvider>
    </MemoryRouter>
  );
}

describe("TicketDetail Page", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("renders all ticket fields as read-only (UI-10, AC-14)", async () => {
    vi.spyOn(api, "getTicketDetail").mockResolvedValue(mockTicket);
    renderComponent();

    expect(await screen.findByDisplayValue("TKT-2026-000123")).toBeInTheDocument();
    expect(screen.getByDisplayValue("TKT-2026-000123")).toHaveAttribute("readonly");
    expect(screen.getByDisplayValue("Hardware")).toHaveAttribute("readonly");
    expect(screen.getByDisplayValue("Corporate Laptop")).toHaveAttribute("readonly");
    expect(screen.getByDisplayValue("Jennifer Anderson")).toHaveAttribute("readonly");
    expect(screen.getByDisplayValue("Battery draining rapidly")).toHaveAttribute("readonly");
    expect(
      screen.getByDisplayValue("The battery loses full charge in less than an hour while idling.")
    ).toHaveAttribute("readonly");

    // Check badges
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("NEW")).toBeInTheDocument();

    // Check attachment rendered
    expect(screen.getByText("battery_diagnostics.png")).toBeInTheDocument();
  });

  it("shows not-found error state when ticket is not owned or missing (AC-03, AC-20)", async () => {
    vi.spyOn(api, "getTicketDetail").mockRejectedValue(new Error("NOT_FOUND"));
    renderComponent("999");

    expect(await screen.findByText(/Ticket not found/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to My Tickets/i })).toBeInTheDocument();
  });
});
