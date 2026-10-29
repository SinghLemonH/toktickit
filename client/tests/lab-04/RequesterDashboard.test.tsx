import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../../src/context/AuthContext.js";
import RequesterDashboard from "../../src/pages/RequesterDashboard.js";
import * as api from "../../src/api.js";

// Mock API
vi.mock("../../src/api.js", async () => {
  const actual = await vi.importActual("../../src/api.js");
  return {
    ...actual,
    getRequesterDashboard: vi.fn(),
  };
});

const mockRequesterDashboardData = {
  metrics: {
    myOpenTickets: 3,
    waitingForRequester: 1,
    inProgress: 2,
    resolved: 5,
    closed: 12,
  },
  links: {
    myOpenTickets: "/tickets?statusGroup=active",
    waitingForRequester: "/tickets?currentStatus=WAITING_FOR_REQUESTER",
    inProgress: "/tickets?currentStatus=IN_PROGRESS",
    resolved: "/tickets?currentStatus=RESOLVED",
    closed: "/tickets?currentStatus=CLOSED",
  },
  attentionTickets: [
    {
      id: 12,
      ticketNumber: "TKT-2026-000012",
      title: "Please provide device serial number",
      currentStatus: "WAITING_FOR_REQUESTER",
      updatedAt: "2026-10-11T08:30:00.000Z",
    },
  ],
  recentTickets: [
    {
      id: 15,
      ticketNumber: "TKT-2026-000015",
      title: "Laptop battery drains quickly",
      currentStatus: "IN_PROGRESS",
      updatedAt: "2026-10-11T09:14:00.000Z",
    },
  ],
  timeZone: "Asia/Bangkok",
  generatedAt: "2026-10-11T10:00:00.000Z",
};

const mockEmptyDashboardData = {
  metrics: {
    myOpenTickets: 0,
    waitingForRequester: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  },
  links: {
    myOpenTickets: "/tickets?statusGroup=active",
    waitingForRequester: "/tickets?currentStatus=WAITING_FOR_REQUESTER",
    inProgress: "/tickets?currentStatus=IN_PROGRESS",
    resolved: "/tickets?currentStatus=RESOLVED",
    closed: "/tickets?currentStatus=CLOSED",
  },
  attentionTickets: [],
  recentTickets: [],
  timeZone: "Asia/Bangkok",
  generatedAt: "2026-10-11T10:00:00.000Z",
};

function renderWithAuth(component: React.ReactNode) {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
}

describe("RequesterDashboard Component (Lab 4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("UI-01: renders metric cards with correct values and drill-down links (FR-12, FR-15)", async () => {
    vi.mocked(api.getRequesterDashboard).mockResolvedValue(mockRequesterDashboardData);

    renderWithAuth(<RequesterDashboard />);

    await waitFor(() => {
      expect(screen.getByText("My Open Tickets")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("Waiting for Requester")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("In Progress")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("Resolved")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("Closed")).toBeInTheDocument();
      expect(screen.getByText("12")).toBeInTheDocument();
    });

    // Check drill-down links
    const viewLinks = screen.getAllByText("View");
    expect(viewLinks).toHaveLength(5);
  });

  it("UI-02: displays loading skeleton state while fetching data (FR-18)", () => {
    vi.mocked(api.getRequesterDashboard).mockImplementation(
      () => new Promise(() => {})
    );

    renderWithAuth(<RequesterDashboard />);

    // Check for skeleton loaders (placeholder elements)
    const placeholders = document.querySelectorAll(".placeholder");
    expect(placeholders.length).toBeGreaterThan(0);
  });

  it("UI-02: displays empty state when requester has no tickets (AC-14, BR-23)", async () => {
    vi.mocked(api.getRequesterDashboard).mockResolvedValue(mockEmptyDashboardData);

    renderWithAuth(<RequesterDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText("You have no active support requests.")
      ).toBeInTheDocument();
      expect(screen.getByText("Need assistance? Create a ticket.")).toBeInTheDocument();
    });

    // Check for Create Ticket button (may appear in both empty state and quick actions)
    const createButtons = screen.getAllByText("Create Ticket");
    expect(createButtons.length).toBeGreaterThan(0);
  });

  it("UI-02: displays error banner and retry button on API failure (FR-18)", async () => {
    vi.mocked(api.getRequesterDashboard).mockRejectedValue(
      new Error("Network error")
    );

    renderWithAuth(<RequesterDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Error loading dashboard/i)).toBeInTheDocument();
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });

    const retryButton = screen.getByText("Retry");
    expect(retryButton).toBeInTheDocument();
  });

  it("UI-02: displays error state on API failure (FR-18)", async () => {
    vi.mocked(api.getRequesterDashboard).mockRejectedValue(
      new Error("Network error")
    );

    renderWithAuth(<RequesterDashboard />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("renders attention tickets list with navigation", async () => {
    vi.mocked(api.getRequesterDashboard).mockResolvedValue(mockRequesterDashboardData);

    renderWithAuth(<RequesterDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Attention Required")).toBeInTheDocument();
      expect(screen.getByText("TKT-2026-000012")).toBeInTheDocument();
      expect(
        screen.getByText("Please provide device serial number")
      ).toBeInTheDocument();
    });
  });

  it("renders recent tickets list with navigation", async () => {
    vi.mocked(api.getRequesterDashboard).mockResolvedValue(mockRequesterDashboardData);

    renderWithAuth(<RequesterDashboard />);

    await waitFor(() => {
      expect(screen.getByText("My Recent Tickets")).toBeInTheDocument();
      expect(screen.getByText("TKT-2026-000015")).toBeInTheDocument();
      expect(screen.getByText("Laptop battery drains quickly")).toBeInTheDocument();
    });
  });

  it("renders quick actions buttons", async () => {
    vi.mocked(api.getRequesterDashboard).mockResolvedValue(mockRequesterDashboardData);

    renderWithAuth(<RequesterDashboard />);

    await waitFor(() => {
      const createButtons = screen.getAllByText("Create Ticket");
      expect(createButtons.length).toBeGreaterThan(0);
      expect(screen.getByText("View My Tickets")).toBeInTheDocument();
    });
  });
});
