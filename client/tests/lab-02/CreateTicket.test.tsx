import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import CreateTicket from "../../src/pages/CreateTicket.js";
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
        <CreateTicket />
        <LocationDisplay />
      </RequesterProvider>
    </MemoryRouter>
  );
}

function LocationDisplay() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

describe("CreateTicket", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.spyOn(api, "getActiveCategories").mockResolvedValue([{ id: 2, name: "Hardware" }]);
    vi.spyOn(api, "getActiveRelatedSystems").mockResolvedValue([
      { id: 7, name: "Corporate Laptop" },
    ]);
  });

  it("shows a field error and does not call the API when Summary is empty (UI-03)", async () => {
    const createSpy = vi.spyOn(api, "createTicket");
    renderPage();

    await screen.findByLabelText(/Category/i);
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(await screen.findByText(/5-120 characters/i)).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("returns to My Tickets when Cancel is clicked", async () => {
    renderPage();

    await screen.findByLabelText(/Category/i);
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.getByTestId("location")).toHaveTextContent("/tickets");
  });

  it("disables the Submit button while a request is in flight (UI-04)", async () => {
    let resolveCreate: (value: Awaited<ReturnType<typeof api.createTicket>>) => void = () => {};
    vi.spyOn(api, "createTicket").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        })
    );
    renderPage();

    await userEvent.type(await screen.findByLabelText(/Summary/i), "Laptop battery drains quickly");
    await userEvent.type(
      screen.getByLabelText(/Description/i),
      "This description is long enough to satisfy the minimum character requirement."
    );
    await userEvent.selectOptions(screen.getByLabelText(/Category/i), "2");
    await userEvent.selectOptions(screen.getByLabelText(/Related System/i), "7");

    const submitButton = screen.getByRole("button", { name: /submit/i });
    await userEvent.click(submitButton);

    expect(await screen.findByText(/submitting/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    resolveCreate({ id: 1, ticketNumber: "TKT-2026-000001", failedAttachments: [] });
    await waitFor(() => expect(screen.getByText("TKT-2026-000001")).toBeInTheDocument());
  });
});
