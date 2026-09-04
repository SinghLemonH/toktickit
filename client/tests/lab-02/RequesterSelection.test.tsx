import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import RequesterSelection from "../../src/pages/RequesterSelection.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import * as api from "../../src/api.js";

function renderPage() {
  return render(
    <MemoryRouter>
      <RequesterProvider>
        <RequesterSelection />
      </RequesterProvider>
    </MemoryRouter>
  );
}

describe("RequesterSelection", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("shows an empty state and disables Continue when there are no active requesters", async () => {
    vi.spyOn(api, "getActiveRequesters").mockResolvedValue([]);
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/No active development requesters/i)).toBeInTheDocument()
    );
    expect(screen.getByText("Continue →")).toBeDisabled();
  });

  it("shows a safe error state when loading requesters fails", async () => {
    vi.spyOn(api, "getActiveRequesters").mockRejectedValue(new Error("network down"));
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/Unable to load development requesters/i)).toBeInTheDocument()
    );
  });

  it("enables Continue only once a requester is chosen", async () => {
    vi.spyOn(api, "getActiveRequesters").mockResolvedValue([
      { id: 1, name: "Jennifer Anderson", email: "jennifer@example.com" },
    ]);
    renderPage();

    const select = await screen.findByLabelText(/Development Requester/i);
    expect(screen.getByText("Continue →")).toBeDisabled();

    await userEvent.selectOptions(select, "1");
    expect(screen.getByText("Continue →")).not.toBeDisabled();
  });
});