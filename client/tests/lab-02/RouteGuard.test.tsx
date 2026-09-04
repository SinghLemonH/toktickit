import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import RouteGuard from "../../src/components/RouteGuard.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";

function renderGuarded(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <RequesterProvider>
        <Routes>
          <Route path="/select-requester" element={<div>Selection Screen</div>} />
          <Route
            path="/tickets"
            element={
              <RouteGuard>
                <div>My Tickets Content</div>
              </RouteGuard>
            }
          />
        </Routes>
      </RequesterProvider>
    </MemoryRouter>
  );
}

describe("RouteGuard", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("redirects to the Requester Selection screen when no requester is selected", async () => {
    renderGuarded("/tickets");
    expect(await screen.findByText("Selection Screen")).toBeInTheDocument();
    expect(screen.queryByText("My Tickets Content")).not.toBeInTheDocument();
  });

  it("renders the protected content when a requester is already stored", async () => {
    sessionStorage.setItem(
      "toktickit.selectedRequester",
      JSON.stringify({ id: 1, name: "Jennifer Anderson" })
    );
    renderGuarded("/tickets");
    expect(await screen.findByText("My Tickets Content")).toBeInTheDocument();
  });
});