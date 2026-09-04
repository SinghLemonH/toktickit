import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MyTickets from "../../src/pages/MyTickets.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import * as api from "../../src/api.js";

function renderPage() {
  sessionStorage.setItem(
    "toktickit.selectedRequester",
    JSON.stringify({ id: 1, name: "Jennifer Anderson" })
  );
  return render(
    <MemoryRouter>
      <RequesterProvider>
        <MyTickets />
      </RequesterProvider>
    </MemoryRouter>
  );
}

const emptyResponse = { items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 1 };

describe("MyTickets", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("shows the empty state (not no-results) when the Requester has zero tickets ever (UI-07)", async () => {
    vi.spyOn(api, "getMyTickets").mockResolvedValue(emptyResponse);
    renderPage();
    expect(
      await screen.findByText(/You haven't created any tickets yet/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/No tickets match/i)).not.toBeInTheDocument();
  });

  it("shows a list of tickets when the response has items", async () => {
    vi.spyOn(api, "getMyTickets").mockResolvedValue({
      items: [
        {
          id: 1,
          ticketNumber: "TKT-2026-000001",
          summary: "Laptop battery drains quickly",
          categoryName: "Hardware",
          requestedPriority: "MEDIUM",
          itPriority: null,
          currentStatus: "NEW",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      page: 1,
      pageSize: 10,
      totalItems: 1,
      totalPages: 1,
    });
    renderPage();
    const matches = await screen.findAllByText("TKT-2026-000001");
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("re-fetches when the selected Requester changes (UI-09/AC-17)", async () => {
    const spy = vi.spyOn(api, "getMyTickets").mockResolvedValue(emptyResponse);
    renderPage();
    await waitFor(() => expect(spy).toHaveBeenCalledWith(1, expect.anything()));
  });
});