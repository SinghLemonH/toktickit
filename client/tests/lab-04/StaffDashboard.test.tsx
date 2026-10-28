import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { AuthContext, type AuthContextType, type AuthUser } from "../../src/context/AuthContext.js";
import StaffDashboard from "../../src/pages/StaffDashboard.js";
import * as api from "../../src/api.js";

// Mock API
vi.mock("../../src/api.js", async () => {
  const actual = await vi.importActual("../../src/api.js");
  return {
    ...actual,
    getStaffDashboard: vi.fn(),
  };
});

const mockStaffDashboardData = {
  metrics: {
    newTickets: 14,
    openTickets: 23,
    inProgress: 18,
    waitingForRequester: 7,
    myAssigned: 16,
    unassigned: 12,
  },
  links: {
    newTickets: "/staff/queue?status=NEW",
    openTickets: "/staff/queue?status=OPEN",
    inProgress: "/staff/queue?status=IN_PROGRESS",
    waitingForRequester: "/staff/queue?status=WAITING_FOR_REQUESTER",
    myAssigned: "/staff/queue?assignedTo=me&statusGroup=active",
    unassigned: "/staff/queue?assignedTo=unassigned&statusGroup=active",
  },
  recentTickets: [
    {
      id: 15,
      ticketNumber: "TKT-2026-000015",
      title: "VPN disconnects randomly",
      currentStatus: "RESOLVED",
      updatedAt: "2026-10-11T09:14:00.000Z",
    },
  ],
  userCounts: {
    totalUsers: 25,
    activeUsers: 23,
    inactiveUsers: 2,
  },
  timeZone: "Asia/Bangkok",
  generatedAt: "2026-10-11T10:00:00.000Z",
};

const mockEmptyDashboardData = {
  metrics: {
    newTickets: 0,
    openTickets: 0,
    inProgress: 0,
    waitingForRequester: 0,
    myAssigned: 0,
    unassigned: 0,
  },
  links: {
    newTickets: "/staff/queue?status=NEW",
    openTickets: "/staff/queue?status=OPEN",
    inProgress: "/staff/queue?status=IN_PROGRESS",
    waitingForRequester: "/staff/queue?status=WAITING_FOR_REQUESTER",
    myAssigned: "/staff/queue?assignedTo=me&statusGroup=active",
    unassigned: "/staff/queue?assignedTo=unassigned&statusGroup=active",
  },
  recentTickets: [],
  timeZone: "Asia/Bangkok",
  generatedAt: "2026-10-11T10:00:00.000Z",
};

function renderWithAuth(component: React.ReactNode, role: AuthUser["role"] = "IT_STAFF") {
  const mockUser: AuthUser = {
    id: 1,
    name: "Test Staff",
    email: "staff@test.com",
    role,
    mustChangePassword: false,
  };
  const auth: AuthContextType = {
    user: mockUser,
    loading: false,
    isConfigured: true,
    login: vi.fn(),
    logout: vi.fn(),
    changePassword: vi.fn(),
    refreshUser: vi.fn(),
  };
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={auth}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>
  );
}

describe("StaffDashboard Component (Lab 4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("UI-01: renders 6 metric cards with correct values and drill-down links (FR-13, FR-15)", async () => {
    vi.mocked(api.getStaffDashboard).mockResolvedValue(mockStaffDashboardData);

    renderWithAuth(<StaffDashboard />);

    await waitFor(() => {
      expect(screen.getByText("New")).toBeInTheDocument();
      expect(screen.getByText("14")).toBeInTheDocument();
      expect(screen.getByText("Open")).toBeInTheDocument();
      expect(screen.getByText("23")).toBeInTheDocument();
      expect(screen.getByText("In Progress")).toBeInTheDocument();
      expect(screen.getByText("18")).toBeInTheDocument();
      expect(screen.getByText("Waiting for Requester")).toBeInTheDocument();
      expect(screen.getByText("7")).toBeInTheDocument();
      expect(screen.getByText("My Assigned")).toBeInTheDocument();
      expect(screen.getByText("16")).toBeInTheDocument();
      expect(screen.getByText("Unassigned")).toBeInTheDocument();
      expect(screen.getByText("12")).toBeInTheDocument();
    });

    // Check drill-down links
    const viewLinks = screen.getAllByText("View");
    expect(viewLinks.length).toBeGreaterThanOrEqual(6);
  });

  it("UI-02: displays loading skeleton state while fetching data (FR-18)", () => {
    vi.mocked(api.getStaffDashboard).mockImplementation(
      () => new Promise(() => {})
    );

    renderWithAuth(<StaffDashboard />);

    // Check for skeleton loaders (placeholder elements)
    const placeholders = document.querySelectorAll(".placeholder");
    expect(placeholders.length).toBeGreaterThan(0);
  });

  it("UI-02: displays empty state when queue has no tickets (AC-14, BR-23)", async () => {
    vi.mocked(api.getStaffDashboard).mockResolvedValue(mockEmptyDashboardData);

    renderWithAuth(<StaffDashboard />);

    await waitFor(() => {
      expect(screen.getByText("No tickets in queue.")).toBeInTheDocument();
      expect(
        screen.getByText("All systems operating smoothly.")
      ).toBeInTheDocument();
    });
  });

  it("UI-02: displays error banner and retry button on API failure (FR-18)", async () => {
    vi.mocked(api.getStaffDashboard).mockRejectedValue(
      new Error("Network error")
    );

    renderWithAuth(<StaffDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Error loading dashboard/i)).toBeInTheDocument();
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });

    const retryButton = screen.getByText("Retry");
    expect(retryButton).toBeInTheDocument();
  });

  it("UI-02: displays error state on API failure (FR-18)", async () => {
    vi.mocked(api.getStaffDashboard).mockRejectedValue(
      new Error("Network error")
    );

    renderWithAuth(<StaffDashboard />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("renders recent operational tickets table", async () => {
    vi.mocked(api.getStaffDashboard).mockResolvedValue(mockStaffDashboardData);

    renderWithAuth(<StaffDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Recent Operational Tickets")).toBeInTheDocument();
      expect(screen.getByText("TKT-2026-000015")).toBeInTheDocument();
      expect(screen.getByText("VPN disconnects randomly")).toBeInTheDocument();
    });
  });

  it("renders quick actions buttons", async () => {
    vi.mocked(api.getStaffDashboard).mockResolvedValue(mockStaffDashboardData);

    renderWithAuth(<StaffDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Search Tickets")).toBeInTheDocument();
      expect(screen.getByText("My Queue")).toBeInTheDocument();
    });
  });

  it("does not display user counts section for IT Staff", async () => {
    vi.mocked(api.getStaffDashboard).mockResolvedValue(mockStaffDashboardData);

    renderWithAuth(<StaffDashboard />, "IT_STAFF");

    await waitFor(() => {
      expect(screen.queryByText("User Accounts")).not.toBeInTheDocument();
    });
  });

  it("displays user account counts for Administrators (FR-14)", async () => {
    vi.mocked(api.getStaffDashboard).mockResolvedValue(mockStaffDashboardData);
    renderWithAuth(<StaffDashboard />, "ADMINISTRATOR");
    await waitFor(() => {
      expect(screen.getByText("User Accounts")).toBeInTheDocument();
      expect(screen.getByText("25")).toBeInTheDocument();
      expect(screen.getByText("Manage Users")).toBeInTheDocument();
    });
  });
});
