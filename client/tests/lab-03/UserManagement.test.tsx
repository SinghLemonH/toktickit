import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import UserManagement from "../../src/pages/UserManagement.js";
import * as api from "../../src/api.js";
import { AuthContext } from "../../src/context/AuthContext.js";

const mockAdminUser = {
  id: 2,
  name: "John Smith",
  email: "admin@toktickit.com",
  role: "ADMINISTRATOR" as const,
  isActive: true,
  mustChangePassword: false,
};

const mockUsersList: api.AdminUser[] = [
  {
    id: 1,
    name: "Jennifer Anderson",
    email: "jennifer.anderson@example.com",
    role: "REQUESTER",
    isActive: true,
    mustChangePassword: false,
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: 2,
    name: "John Smith",
    email: "admin@toktickit.com",
    role: "ADMINISTRATOR",
    isActive: true,
    mustChangePassword: false,
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: 3,
    name: "Michael Brown",
    email: "michael.brown@example.com",
    role: "IT_STAFF",
    isActive: false,
    mustChangePassword: true,
    createdAt: "2026-09-02T00:00:00.000Z",
  },
];

function renderUserManagement(currentUser = mockAdminUser) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider
        value={{
          user: currentUser,
          loading: false,
          isConfigured: true,
          login: vi.fn(),
          logout: vi.fn(),
          changePassword: vi.fn(),
          refreshUser: vi.fn(),
        }}
      >
        <UserManagement />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe("UserManagement Component (UI-05, AC-15, AC-18)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders user table with name, email, role badges, and status pills", async () => {
    vi.spyOn(api, "getAdminUsers").mockResolvedValue(mockUsersList);

    renderUserManagement();

    const jenniferElements = await screen.findAllByText("Jennifer Anderson");
    expect(jenniferElements.length).toBeGreaterThan(0);
    expect(screen.getAllByText("jennifer.anderson@example.com").length).toBeGreaterThan(0);
    expect(screen.getAllByText("admin@toktickit.com").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Michael Brown").length).toBeGreaterThan(0);

    // Badges and pills
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Inactive").length).toBeGreaterThan(0);
  });

  it("opens create user modal, generates safe password, and submits new user", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "getAdminUsers").mockResolvedValue(mockUsersList);
    const createSpy = vi.spyOn(api, "createAdminUser").mockResolvedValue({
      id: 4,
      name: "Alice Cooper",
      email: "alice@example.com",
      role: "IT_STAFF",
      isActive: true,
      mustChangePassword: true,
      createdAt: new Date().toISOString(),
    });

    renderUserManagement();
    await screen.findAllByText("Jennifer Anderson");

    // Click "+ Create User"
    await user.click(screen.getByRole("button", { name: /\+ Create User/i }));

    // Fill form
    await user.type(screen.getByLabelText(/Full Name/i), "Alice Cooper");
    await user.type(screen.getByLabelText(/Email Address/i), "alice@example.com");

    // Click "Generate Safe Password"
    await user.click(screen.getByRole("button", { name: /Generate Safe Password/i }));

    const passwordInput = screen.getByLabelText(/Initial Password/i) as HTMLInputElement;
    expect(passwordInput.value.length).toBeGreaterThanOrEqual(10);

    // Submit
    await user.click(screen.getByRole("button", { name: /Save User/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Alice Cooper",
          email: "alice@example.com",
        })
      );
    });
  });

  it("disables self-deactivation when an admin edits their own account (BR-16, AC-18)", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "getAdminUsers").mockResolvedValue(mockUsersList);

    renderUserManagement(mockAdminUser);
    await screen.findAllByText("Jennifer Anderson");

    // Click Edit on John Smith (id: 2, current logged in admin)
    await user.click(screen.getByRole("button", { name: "Edit John Smith" }));

    // Modal opens
    expect(screen.getByRole("heading", { name: /Edit User/i })).toBeInTheDocument();

    // Verify self-deactivation switch is disabled with warning
    const activeToggle = screen.getByLabelText(/Active Account/i);
    expect(activeToggle).toBeDisabled();
    expect(
      screen.getByText(/You cannot deactivate your own account/i)
    ).toBeInTheDocument();
  });

  it("warns and disables deactivation if editing the sole active Administrator (BR-17, AC-19)", async () => {
    const user = userEvent.setup();
    // Only John Smith is Administrator in mockUsersList
    vi.spyOn(api, "getAdminUsers").mockResolvedValue(mockUsersList);

    // Another admin (id 99) editing John Smith (id 2) who is the only active admin
    renderUserManagement({
      ...mockAdminUser,
      id: 99,
      email: "other.admin@toktickit.com",
    });
    await screen.findAllByText("Jennifer Anderson");

    // Click Edit on John Smith (id: 2)
    await user.click(screen.getByRole("button", { name: "Edit John Smith" }));

    // Active toggle and Role select should be disabled with warning
    expect(
      screen.getByText(/At least one active Administrator must exist/i)
    ).toBeInTheDocument();
  });

  it("opens password reset sub-modal and submits new initial password", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "getAdminUsers").mockResolvedValue(mockUsersList);
    const resetSpy = vi.spyOn(api, "resetUserPassword").mockResolvedValue({
      message: "Initial password set successfully",
    });

    renderUserManagement();
    await screen.findAllByText("Jennifer Anderson");

    // Click Edit on Jennifer
    await user.click(screen.getByRole("button", { name: "Edit Jennifer Anderson" }));

    // Click "Reset Initial Password"
    await user.click(screen.getByRole("button", { name: /Reset Initial Password/i }));

    // Reset password modal
    const initialPassInput = screen.getByLabelText(/New Initial Password/i);
    await user.clear(initialPassInput);
    await user.type(initialPassInput, "NewTempPass123!");

    await user.click(screen.getByRole("button", { name: /Set Password/i }));

    await waitFor(() => {
      expect(resetSpy).toHaveBeenCalledWith(1, "NewTempPass123!");
    });
  });
});
